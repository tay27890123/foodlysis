import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Leaf, ArrowLeft, Search, MapPin, Weight,
  Tag, SlidersHorizontal, X, Package, Navigation, ShoppingCart, Store,
  Pencil, Trash2, MoreVertical, MessageCircle, Truck, PackageCheck, CalendarDays, Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSurplusListings, type SurplusListing } from "@/hooks/useSurplusListings";
import { useUserLocation, haversineDistance } from "@/hooks/useUserLocation";
import AddListingModal from "@/components/AddListingModal";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

type Category = "All" | "Vegetables" | "Fruits" | "Grains" | "Seafood" | "Poultry" | "Dairy" | "Other";

const categories: Category[] = ["All", "Vegetables", "Fruits", "Grains", "Seafood", "Poultry", "Dairy", "Other"];

const MALAYSIA_STATES = [
  "All States", "Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Labuan", "Melaka",
  "Negeri Sembilan", "Pahang", "Penang", "Perak", "Perlis", "Putrajaya",
  "Sabah", "Sarawak", "Selangor", "Terengganu",
];

const urgencyStyles: Record<string, string> = {
  High: "bg-destructive/15 text-destructive border-destructive/20",
  Medium: "bg-secondary/15 text-secondary border-secondary/20",
  Low: "bg-primary/15 text-primary border-primary/20",
};

interface SurplusCardProps {
  listing: SurplusListing;
  index: number;
  distance?: number | null;
  mode: "buy" | "sell";
}

const isCoordLabel = (label?: string | null) => {
  if (!label) return false;
  return /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(label.trim());
};

const areaNameCache = new Map<string, string>();

const useAreaName = (listing: SurplusListing) => {
  const rawLabel = listing.location_label;
  const lat = listing.location_lat;
  const lng = listing.location_lng;
  const [area, setArea] = useState<string>(rawLabel && !isCoordLabel(rawLabel) ? rawLabel : "");

  useEffect(() => {
    if (rawLabel && !isCoordLabel(rawLabel)) { setArea(rawLabel); return; }
    if (lat == null || lng == null) { setArea(listing.profiles?.location_state || "—"); return; }

    const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    if (areaNameCache.has(key)) { setArea(areaNameCache.get(key)!); return; }

    let cancelled = false;
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&addressdetails=1`, { headers: { "Accept-Language": "en" } })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const addr = data.address;
        const a = addr?.suburb || addr?.town || addr?.city || addr?.county || addr?.state_district || "";
        const s = addr?.state || "";
        const name = a && s ? `${a}, ${s}` : a || s || `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
        areaNameCache.set(key, name);
        setArea(name);
      })
      .catch(() => { if (!cancelled) setArea(`${lat.toFixed(2)}, ${lng.toFixed(2)}`); });
    return () => { cancelled = true; };
  }, [rawLabel, lat, lng]);

  return area;
};

const SurplusCard = ({ listing, index, distance, mode, onRefresh }: SurplusCardProps & { onRefresh: () => void }) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const areaName = useAreaName(listing);
  const discount = listing.original_price > 0
    ? Math.round((1 - listing.discounted_price / listing.original_price) * 100)
    : 0;

  const isExpiringSoon = listing.expiry_date
    ? new Date(listing.expiry_date).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000
    : false;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("surplus_listings").delete().eq("id", listing.id);
      if (error) throw error;
      toast.success("Listing deleted");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="glass-card group hover:border-primary/40 transition-all duration-300 flex flex-col overflow-hidden"
    >
      {/* Product image */}
      {listing.image_url ? (
        <div className="relative w-full h-36 bg-muted/30">
          <img src={listing.image_url} alt={listing.product_name} className="w-full h-full object-cover" />
          {discount > 0 && (
            <Badge className="absolute top-2 left-2 bg-primary/90 text-primary-foreground border-0">-{discount}%</Badge>
          )}
        </div>
      ) : (
        <div className="relative w-full h-20 bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground/20" />
          {discount > 0 && (
            <Badge className="absolute top-2 left-2 bg-primary/90 text-primary-foreground border-0">-{discount}%</Badge>
          )}
        </div>
      )}

      <div className="flex items-center justify-between px-5 pt-3 pb-1">
        <Badge variant="outline" className={`text-[11px] font-medium ${urgencyStyles[listing.urgency_level] ?? ""}`}>
          {listing.urgency_level === "High" ? "⚡ Urgent" : listing.urgency_level === "Medium" ? "⏳ Moderate" : "📦 Flexible"}
        </Badge>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">{listing.category}</span>
          {mode === "sell" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <AddListingModal
                  editListing={listing}
                  onSuccess={onRefresh}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 cursor-pointer">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </DropdownMenuItem>
                  }
                />
                <DropdownMenuItem className="gap-2 text-destructive cursor-pointer" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="px-5 pb-4 flex-1 flex flex-col">
        <h3 className="font-display text-lg font-semibold mt-1 mb-1 group-hover:text-primary transition-colors">
          {listing.product_name}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">{listing.profiles?.business_name ?? "Unknown Supplier"}</p>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Weight className="h-3.5 w-3.5 shrink-0" />
            <span>{listing.quantity_kg.toLocaleString()} kg</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{areaName || "—"}</span>
          </div>
          {listing.expiry_date && (
            <div className={`flex items-center gap-2 text-sm col-span-2 ${isExpiringSoon ? "text-destructive" : "text-muted-foreground"}`}>
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              <span>Expires {format(new Date(listing.expiry_date), "d MMM yyyy")}</span>
            </div>
          )}
        </div>

        {/* Transport & badges row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {listing.transportation_available ? (
            <Badge variant="outline" className="text-[11px] gap-1 bg-primary/10 text-primary border-primary/20">
              <Truck className="h-3 w-3" /> Transport Available
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[11px] gap-1 bg-muted/50 text-muted-foreground border-border/50">
              <PackageCheck className="h-3 w-3" /> Self-pickup
            </Badge>
          )}
        </div>

        {distance != null && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Navigation className="h-3 w-3 shrink-0" />
            <span>{distance < 1 ? `${Math.round(distance * 1000)} m away` : `${distance.toFixed(1)} km away`}</span>
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-border/50 flex items-end justify-between">
          <div>
            <span className="text-xs text-muted-foreground line-through">RM {listing.original_price.toFixed(2)}/kg</span>
            <div className="font-display text-xl font-bold text-primary">RM {listing.discounted_price.toFixed(2)}/kg</div>
          </div>
        </div>
      </div>

      {mode === "buy" && (
        <div className="px-5 pb-5">
          <Button className="w-full" size="sm" variant="outline" onClick={() => setContactOpen(true)}>
            <MessageCircle className="h-3.5 w-3.5 mr-2" /> Contact Seller
          </Button>
        </div>
      )}

      {/* Contact Seller Dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg">Contact Seller — {listing.product_name}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {listing.transportation_available
                ? "This seller provides transportation for this item."
                : "This item does not include transportation. How would you like to handle delivery?"}
            </DialogDescription>
          </DialogHeader>

          {listing.transportation_available ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-primary/10 p-4 flex items-center gap-3">
                <Truck className="h-5 w-5 text-primary shrink-0" />
                <p className="text-sm">🚛 Transport is included with this listing.</p>
              </div>
              <DialogFooter>
                <Button onClick={() => { setContactOpen(false); toast.success("Contact request sent to seller!"); }}>
                  <MessageCircle className="h-4 w-4 mr-2" /> Send Contact Request
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-4 h-auto px-5 py-4"
                onClick={() => { setContactOpen(false); toast.success("Platform logistics team will reach out to coordinate delivery."); }}
              >
                <Truck className="h-6 w-6 text-primary shrink-0" />
                <div className="text-left min-w-0">
                  <p className="font-medium text-sm">Get help from platform</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">Our logistics partners will assist with delivery. Platform coordination fees may apply.</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-4 h-auto px-5 py-4"
                onClick={() => { setContactOpen(false); toast.success("Contact request sent to seller!"); }}
              >
                <PackageCheck className="h-6 w-6 text-muted-foreground shrink-0" />
                <div className="text-left min-w-0">
                  <p className="font-medium text-sm">I'll arrange transport myself</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">Contact the seller directly and handle pickup or delivery on your own.</p>
                </div>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{listing.product_name}" from the marketplace.
            </AlertDialogDescription>
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

const Match = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [tab, setTab] = useState("buy");

  const { location: userLocation, loading: gpsLoading, requestLocation } = useUserLocation();

  useEffect(() => {
    const stateParam = searchParams.get("state");
    if (stateParam) setStateFilter(stateParam);
  }, [searchParams]);

  const { data: listings, isLoading } = useSurplusListings();
  const queryClient = useQueryClient();

  const listingsWithDistance = useMemo(() => {
    return (listings ?? []).map((l) => {
      let dist: number | null = null;
      if (userLocation && l.location_lat && l.location_lng) {
        dist = haversineDistance(userLocation.lat, userLocation.lng, l.location_lat, l.location_lng);
      }
      return { ...l, _distance: dist };
    });
  }, [listings, userLocation]);

  const filtered = listingsWithDistance.filter((l) => {
    const matchSearch = l.product_name.toLowerCase().includes(search.toLowerCase()) ||
      (l.profiles?.business_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || l.category === category;
    const matchState = !stateFilter || (l.location_label || l.profiles?.location_state || "").toLowerCase().includes(stateFilter.toLowerCase());
    return matchSearch && matchCategory && matchState;
  });

  const sorted = useMemo(() => {
    if (!userLocation) return filtered;
    return [...filtered].sort((a, b) => {
      if (a._distance == null && b._distance == null) return 0;
      if (a._distance == null) return 1;
      if (b._distance == null) return -1;
      return a._distance - b._distance;
    });
  }, [filtered, userLocation]);

  const hasFilters = search || category !== "All" || stateFilter;
  const clearFilters = () => { setSearch(""); setCategory("All"); setStateFilter(""); };

  const FilterBar = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4 mb-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products, suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-background/60" />
          </div>
          <select
            value={stateFilter || "All States"}
            onChange={(e) => setStateFilter(e.target.value === "All States" ? "" : e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-[160px]"
          >
            {MALAYSIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button
            variant={userLocation ? "default" : "outline"}
            size="sm"
            className="text-xs h-10 gap-1"
            onClick={requestLocation}
            disabled={gpsLoading}
          >
            <Navigation className="h-3.5 w-3.5" />
            {gpsLoading ? "Locating..." : userLocation ? "Nearby" : "Use GPS"}
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          {categories.map((cat) => (
            <Button key={cat} variant={category === cat ? "default" : "outline"} size="sm" onClick={() => setCategory(cat)} className="text-xs h-8">
              {cat}
            </Button>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const ListingGrid = () => (
    <>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{sorted.length}</span> listing{sorted.length !== 1 ? "s" : ""}
          </p>
          {userLocation && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Navigation className="h-3 w-3" /> Sorted by distance
            </Badge>
          )}
          {stateFilter && (
            <Badge variant="outline" className="gap-1 text-xs">
              <MapPin className="h-3 w-3" /> {stateFilter}
              <button onClick={() => setStateFilter("")} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
            </Badge>
          )}
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1">
            <X className="h-3 w-3" /> Clear filters
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Loading listings...</div>
      ) : (
        <AnimatePresence mode="wait">
          {sorted.length > 0 ? (
            <motion.div key={`${category}-${search}-${tab}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {sorted.map((listing, i) => (
                <SurplusCard key={listing.id} listing={listing} index={i} distance={listing._distance} mode={tab as "buy" | "sell"} onRefresh={() => queryClient.invalidateQueries({ queryKey: ["surplus_listings"] })} />
              ))}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold mb-1">No active surplus listings right now</h3>
              <p className="text-sm text-muted-foreground mb-4">Be the first to list!</p>
              {hasFilters ? (
                <Button variant="outline" size="sm" onClick={clearFilters}>Clear all filters</Button>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background pt-20">

      <main className="container py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="font-display text-3xl font-bold mb-1">Surplus Marketplace</h1>
          <p className="text-muted-foreground">Buy or sell discounted surplus food across Malaysia</p>
        </motion.div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full max-w-sm grid-cols-2 mb-6">
            <TabsTrigger value="buy" className="gap-2">
              <ShoppingCart className="h-4 w-4" /> Buy (Demand)
            </TabsTrigger>
            <TabsTrigger value="sell" className="gap-2">
              <Store className="h-4 w-4" /> Sell (Supply)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy">
            <FilterBar />
            <ListingGrid />
          </TabsContent>

          <TabsContent value="sell">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="glass-card p-6 text-center">
                <Store className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="font-display text-xl font-bold mb-2">Sell Your Surplus Food</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Reduce waste and earn revenue by listing surplus produce. Your listing will be visible to buyers across Malaysia instantly.
                </p>
                <AddListingModal onSuccess={() => queryClient.invalidateQueries({ queryKey: ["surplus_listings"] })} />
              </div>

              <div>
                <h3 className="font-display text-lg font-semibold mb-4">All Active Listings</h3>
                <FilterBar />
                <ListingGrid />
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Match;
