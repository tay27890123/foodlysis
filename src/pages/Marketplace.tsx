import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Search, MapPin, Weight, Tag, X, Package, Navigation, ShoppingCart, Store,
  Trash2, MoreVertical, MessageCircle, Truck, PackageCheck, Plus, ImagePlus,
  Calendar, Filter, TrendingUp, TrendingDown, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// ── Types ───────────────────────────────────────────────────────────────────────
interface Listing {
  id: string;
  supplier_id: string | null;
  product_name: string;
  category: string;
  quantity_kg: number;
  original_price: number;
  discounted_price: number;
  urgency_level: string;
  status: string;
  created_at: string;
  location_lat: number | null;
  location_lng: number | null;
  location_label: string | null;
  transportation_available: boolean;
  image_url: string | null;
  expiry_date: string | null;
}

type Category = "All" | "Vegetables" | "Fruits" | "Grains" | "Seafood" | "Poultry" | "Dairy" | "Other";
const categories: Category[] = ["All", "Vegetables", "Fruits", "Grains", "Seafood", "Poultry", "Dairy", "Other"];

const states = [
  "All", "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan",
  "Pahang", "Penang", "Perak", "Perlis", "Sabah", "Sarawak",
  "Selangor", "Terengganu", "Kuala Lumpur", "Putrajaya", "Labuan",
];

const urgencyStyles: Record<string, string> = {
  High: "bg-destructive/15 text-destructive border-destructive/20",
  Medium: "bg-secondary/15 text-secondary border-secondary/20",
  Low: "bg-primary/15 text-primary border-primary/20",
};

// ── Realtime hook ───────────────────────────────────────────────────────────────
const useRealtimeListings = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("marketplace_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "surplus_listings" }, () => {
        queryClient.invalidateQueries({ queryKey: ["marketplace_listings"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return useQuery({
    queryKey: ["marketplace_listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surplus_listings")
        .select("*")
        .eq("status", "Active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Listing[];
    },
  });
};

// ── Supply vs Demand Summary ────────────────────────────────────────────────────
const SupplyDemandSummary = ({ listings }: { listings: Listing[] }) => {
  const stats = useMemo(() => {
    const byCategory: Record<string, { totalKg: number; count: number; avgPrice: number }> = {};
    listings.forEach((l) => {
      if (!byCategory[l.category]) byCategory[l.category] = { totalKg: 0, count: 0, avgPrice: 0 };
      byCategory[l.category].totalKg += l.quantity_kg;
      byCategory[l.category].count += 1;
      byCategory[l.category].avgPrice += l.discounted_price;
    });
    return Object.entries(byCategory)
      .map(([cat, d]) => ({ category: cat, totalKg: d.totalKg, count: d.count, avgPrice: d.count > 0 ? d.avgPrice / d.count : 0 }))
      .sort((a, b) => b.totalKg - a.totalKg);
  }, [listings]);

  const totalKg = listings.reduce((s, l) => s + l.quantity_kg, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4">
          <Store className="h-4 w-4 text-muted-foreground mb-2" />
          <div className="font-display text-2xl font-bold">{listings.length}</div>
          <div className="text-xs text-muted-foreground">Active Listings</div>
        </div>
        <div className="glass-card p-4">
          <Weight className="h-4 w-4 text-muted-foreground mb-2" />
          <div className="font-display text-2xl font-bold">{totalKg.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Total Supply (kg)</div>
        </div>
        <div className="glass-card p-4">
          <Tag className="h-4 w-4 text-muted-foreground mb-2" />
          <div className="font-display text-2xl font-bold">{stats.length}</div>
          <div className="text-xs text-muted-foreground">Categories</div>
        </div>
        <div className="glass-card p-4">
          <Truck className="h-4 w-4 text-muted-foreground mb-2" />
          <div className="font-display text-2xl font-bold">{listings.filter(l => l.transportation_available).length}</div>
          <div className="text-xs text-muted-foreground">With Transport</div>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Supply by Category
        </h3>
        <div className="space-y-3">
          {stats.map((s) => {
            const maxKg = Math.max(...stats.map(x => x.totalKg));
            const pct = maxKg > 0 ? (s.totalKg / maxKg) * 100 : 0;
            return (
              <div key={s.category}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{s.category}</span>
                  <span className="text-xs text-muted-foreground">{s.totalKg.toLocaleString()} kg · {s.count} listings · avg RM{s.avgPrice.toFixed(2)}/kg</span>
                </div>
                <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full bg-primary/60"
                  />
                </div>
              </div>
            );
          })}
          {stats.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No listings yet</p>}
        </div>
      </div>
    </div>
  );
};

// ── Add Listing Form ────────────────────────────────────────────────────────────
const AddListingForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [priceError, setPriceError] = useState("");
  const [form, setForm] = useState({
    product_name: "", category: "Vegetables", quantity_kg: "",
    original_price: "", discounted_price: "", urgency_level: "Medium",
    location_label: "", transportation_available: false, expiry_date: "",
  });

  const update = (key: string, val: string | boolean) => {
    setForm(f => ({ ...f, [key]: val }));
    if (key === "discounted_price" || key === "original_price") setPriceError("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const origPrice = parseFloat(form.original_price);
    const discPrice = parseFloat(form.discounted_price);
    if (discPrice >= origPrice) { setPriceError("Discounted price must be less than original price"); return; }

    setLoading(true);
    try {
      let image_url: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("listing-images").upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("listing-images").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      const { error } = await supabase.from("surplus_listings").insert({
        product_name: form.product_name.trim(),
        category: form.category,
        quantity_kg: parseFloat(form.quantity_kg),
        original_price: origPrice,
        discounted_price: discPrice,
        urgency_level: form.urgency_level,
        location_label: form.location_label || null,
        transportation_available: form.transportation_available,
        expiry_date: form.expiry_date || null,
        image_url,
        supplier_id: user?.id || "00000000-0000-0000-0000-000000000000",
      } as any);
      if (error) throw error;

      toast.success("Listing posted!");
      setOpen(false);
      setForm({ product_name: "", category: "Vegetables", quantity_kg: "", original_price: "", discounted_price: "", urgency_level: "Medium", location_label: "", transportation_available: false, expiry_date: "" });
      setImageFile(null);
      setImagePreview(null);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" /> Post Listing
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card border-border/50 sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Post Surplus Food</DialogTitle>
            <DialogDescription>List your surplus produce for buyers across Malaysia</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Photo Upload */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Product Photo</label>
              <div className="flex items-center gap-3">
                {imagePreview ? (
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-border">
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                )}
                <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Product Name</label>
              <Input value={form.product_name} onChange={e => update("product_name", e.target.value)} required placeholder="e.g. Ugly Tomatoes" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <select value={form.category} onChange={e => update("category", e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Quantity (kg)</label>
                <Input type="number" min="0" step="0.1" value={form.quantity_kg} onChange={e => update("quantity_kg", e.target.value)} required placeholder="500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Original Price (RM/kg)</label>
                <Input type="number" min="0" step="0.01" value={form.original_price} onChange={e => update("original_price", e.target.value)} required placeholder="4.20" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Discounted Price (RM/kg)</label>
                <Input type="number" min="0" step="0.01" value={form.discounted_price} onChange={e => update("discounted_price", e.target.value)} required placeholder="2.80" className={priceError ? "border-destructive" : ""} />
              </div>
            </div>
            {priceError && <p className="text-xs text-destructive -mt-2">{priceError}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">State / Location</label>
                <Input value={form.location_label} onChange={e => update("location_label", e.target.value)} placeholder="e.g. Pahang" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Expiry Date</label>
                <Input type="date" value={form.expiry_date} onChange={e => update("expiry_date", e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Urgency</label>
              <div className="flex gap-2">
                {(["Low", "Medium", "High"] as const).map(u => (
                  <Button key={u} type="button" variant={form.urgency_level === u ? "default" : "outline"} size="sm" className="flex-1" onClick={() => update("urgency_level", u)}>
                    {u === "High" ? "⚡" : u === "Medium" ? "⏳" : "📦"} {u}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium cursor-pointer">Transportation Available</Label>
              </div>
              <Switch checked={form.transportation_available} onCheckedChange={v => update("transportation_available", v)} />
            </div>

            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
              <p className="text-xs text-muted-foreground">💰 A <span className="font-semibold text-foreground">1% processing fee</span> will be charged on total revenue per transaction.</p>
              <p className="text-[11px] text-muted-foreground/70">Join as a member to have all processing fees waived.</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Posting..." : "Post Listing"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ── Listing Card ────────────────────────────────────────────────────────────────
const ListingCard = ({ listing, index, onRefresh }: { listing: Listing; index: number; onRefresh: () => void }) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const discount = listing.original_price > 0
    ? Math.round((1 - listing.discounted_price / listing.original_price) * 100)
    : 0;

  const daysToExpiry = listing.expiry_date
    ? Math.ceil((new Date(listing.expiry_date).getTime() - Date.now()) / 86400000)
    : null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("surplus_listings").delete().eq("id", listing.id);
      if (error) throw error;
      toast.success("Listing deleted");
      onRefresh();
    } catch (err: any) { toast.error(err.message); }
    finally { setDeleting(false); setDeleteOpen(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.35 }}
      className="glass-card group hover:border-primary/40 transition-all duration-300 flex flex-col overflow-hidden"
    >
      {/* Image */}
      {listing.image_url ? (
        <div className="h-40 w-full overflow-hidden bg-muted/30">
          <img src={listing.image_url} alt={listing.product_name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      ) : (
        <div className="h-28 w-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <Package className="h-10 w-10 text-primary/30" />
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col">
        {/* Badges row */}
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className={`text-[11px] font-medium ${urgencyStyles[listing.urgency_level] ?? ""}`}>
            {listing.urgency_level === "High" ? "⚡ Urgent" : listing.urgency_level === "Medium" ? "⏳ Moderate" : "📦 Flexible"}
          </Badge>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-muted-foreground">{listing.category}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="gap-2 text-destructive cursor-pointer" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <h3 className="font-display text-lg font-semibold group-hover:text-primary transition-colors">{listing.product_name}</h3>

        <div className="grid grid-cols-2 gap-2 mt-2 mb-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Weight className="h-3.5 w-3.5" /> {listing.quantity_kg.toLocaleString()} kg</span>
          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {listing.location_label || "—"}</span>
        </div>

        {/* Transport & Expiry */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {listing.transportation_available ? (
            <Badge variant="outline" className="text-[11px] gap-1 bg-primary/10 text-primary border-primary/20">
              <Truck className="h-3 w-3" /> Transport
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[11px] gap-1 bg-muted/50 text-muted-foreground">
              <PackageCheck className="h-3 w-3" /> Self-pickup
            </Badge>
          )}
          {daysToExpiry != null && (
            <Badge variant="outline" className={`text-[11px] gap-1 ${daysToExpiry <= 3 ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-muted/50 text-muted-foreground"}`}>
              <Calendar className="h-3 w-3" /> {daysToExpiry <= 0 ? "Expired" : `${daysToExpiry}d left`}
            </Badge>
          )}
        </div>

        {/* Price */}
        <div className="mt-auto pt-3 border-t border-border/50 flex items-end justify-between">
          <div>
            <span className="text-xs text-muted-foreground line-through">RM {listing.original_price.toFixed(2)}/kg</span>
            <div className="font-display text-xl font-bold text-primary">RM {listing.discounted_price.toFixed(2)}/kg</div>
          </div>
          {discount > 0 && <Badge className="bg-primary/15 text-primary border-primary/30">-{discount}%</Badge>}
        </div>
      </div>

      <div className="px-4 pb-4">
        <Button className="w-full" size="sm" variant="outline" onClick={() => setContactOpen(true)}>
          <MessageCircle className="h-3.5 w-3.5 mr-2" /> Contact Seller
        </Button>
      </div>

      {/* Contact Dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Seller — {listing.product_name}</DialogTitle>
            <DialogDescription>
              {listing.transportation_available
                ? "This seller provides transportation."
                : "This item does not include transportation."}
            </DialogDescription>
          </DialogHeader>
          {listing.transportation_available ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-primary/10 p-3 flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <p className="text-sm">🚛 Transport included with this listing.</p>
              </div>
              <DialogFooter>
                <Button onClick={() => { setContactOpen(false); toast.success("Contact request sent!"); }}>
                  <MessageCircle className="h-4 w-4 mr-2" /> Send Request
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3" onClick={() => { setContactOpen(false); toast.success("Platform logistics will assist."); }}>
                <Truck className="h-5 w-5 text-primary shrink-0" />
                <div className="text-left"><p className="font-medium text-sm">Get help from platform</p><p className="text-xs text-muted-foreground">Our logistics partners will assist with delivery.</p></div>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3" onClick={() => { setContactOpen(false); toast.success("Contact request sent!"); }}>
                <PackageCheck className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="text-left"><p className="font-medium text-sm">Arrange transport myself</p><p className="text-xs text-muted-foreground">Handle pickup/delivery on your own.</p></div>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove "{listing.product_name}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

// ── Main Page ───────────────────────────────────────────────────────────────────
const Marketplace = () => {
  const [searchParams] = useSearchParams();
  const { data: listings, isLoading } = useRealtimeListings();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [tab, setTab] = useState("listings");

  useEffect(() => {
    const s = searchParams.get("state");
    if (s) setStateFilter(s);
  }, [searchParams]);

  const filtered = useMemo(() => {
    return (listings ?? []).filter(l => {
      const matchSearch = l.product_name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === "All" || l.category === category;
      const matchState = stateFilter === "All" || (l.location_label || "").toLowerCase().includes(stateFilter.toLowerCase());
      return matchSearch && matchCategory && matchState;
    });
  }, [listings, search, category, stateFilter]);

  const hasFilters = search || category !== "All" || stateFilter !== "All";
  const clearFilters = () => { setSearch(""); setCategory("All"); setStateFilter("All"); };

  return (
    <div className="min-h-screen bg-background pt-20">
      <main className="container py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-3">
              <ShoppingCart className="h-7 w-7 text-primary" /> Marketplace
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Buy and sell surplus food across Malaysia — real-time updates</p>
          </div>
          <AddListingForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ["marketplace_listings"] })} />
        </motion.div>

        <Tabs value={tab} onValueChange={setTab} className="mb-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="listings" className="gap-2"><Store className="h-4 w-4" /> Listings</TabsTrigger>
            <TabsTrigger value="supply-demand" className="gap-2"><TrendingUp className="h-4 w-4" /> Supply vs Demand</TabsTrigger>
          </TabsList>

          <TabsContent value="supply-demand" className="mt-4">
            <SupplyDemandSummary listings={listings ?? []} />
          </TabsContent>

          <TabsContent value="listings" className="mt-4">
            {/* Filters */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background/60" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-muted-foreground hidden md:block" />
                  <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {categories.map(cat => (
                    <Button key={cat} variant={category === cat ? "default" : "outline"} size="sm" onClick={() => setCategory(cat)} className="text-xs h-8">
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{filtered.length}</span> listing{filtered.length !== 1 ? "s" : ""}
              </p>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1"><X className="h-3 w-3" /> Clear</Button>
              )}
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading listings…</span>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {filtered.length > 0 ? (
                  <motion.div key={`${category}-${search}-${stateFilter}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filtered.map((l, i) => (
                      <ListingCard key={l.id} listing={l} index={i} onRefresh={() => queryClient.invalidateQueries({ queryKey: ["marketplace_listings"] })} />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                    <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="font-display text-lg font-semibold mb-1">No listings found</h3>
                    <p className="text-sm text-muted-foreground">Try different filters or post a listing</p>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Marketplace;
