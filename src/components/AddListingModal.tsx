import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Navigation, Truck, CalendarIcon, ImagePlus, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { SurplusListing } from "@/hooks/useSurplusListings";
import { useAuth } from "@/hooks/useAuth";

const categories = ["Vegetables", "Fruits", "Grains", "Seafood", "Poultry", "Dairy", "Other"] as const;
const urgencies = ["Low", "Medium", "High"] as const;

interface Props {
  onSuccess?: () => void;
  editListing?: SurplusListing | null;
  trigger?: React.ReactNode;
}

const defaultForm = {
  product_name: "",
  category: "Vegetables" as string,
  quantity_kg: "",
  original_price: "",
  discounted_price: "",
  urgency_level: "Medium" as string,
  location_label: "",
  location_lat: null as number | null,
  location_lng: null as number | null,
  transportation_available: false,
  expiry_date: null as Date | null,
  image_url: null as string | null,
};

const AddListingModal = ({ onSuccess, editListing, trigger }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [priceError, setPriceError] = useState("");
  const [form, setForm] = useState(defaultForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const isEdit = !!editListing;

  const openModal = () => {
    if (editListing) {
      setForm({
        product_name: editListing.product_name,
        category: editListing.category,
        quantity_kg: String(editListing.quantity_kg),
        original_price: String(editListing.original_price),
        discounted_price: String(editListing.discounted_price),
        urgency_level: editListing.urgency_level,
        location_label: editListing.location_label || "",
        location_lat: editListing.location_lat || null,
        location_lng: editListing.location_lng || null,
        transportation_available: editListing.transportation_available || false,
        expiry_date: editListing.expiry_date ? new Date(editListing.expiry_date) : null,
        image_url: editListing.image_url || null,
      });
      setImagePreview(editListing.image_url || null);
    } else {
      setForm(defaultForm);
      setImagePreview(null);
    }
    setImageFile(null);
    setPriceError("");
    setOpen(true);
  };

  const update = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (key === "discounted_price" || key === "original_price") {
      setPriceError("");
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm((f) => ({ ...f, image_url: null }));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return form.image_url;
    setUploading(true);
    try {
      const ext = imageFile.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("listing-images").upload(path, imageFile);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("listing-images").getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err: any) {
      toast.error("Image upload failed: " + err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      const addr = data.address;
      const area = addr?.suburb || addr?.town || addr?.city || addr?.county || addr?.state_district || "";
      const state = addr?.state || "";
      if (area && state) return `${area}, ${state}`;
      if (area) return area;
      if (state) return state;
      return data.display_name?.split(",").slice(0, 2).join(",").trim() || `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
    } catch {
      return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
    }
  };

  const requestGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const areaName = await reverseGeocode(latitude, longitude);
        setForm((f) => ({
          ...f,
          location_lat: latitude,
          location_lng: longitude,
          location_label: areaName,
        }));
        setGpsLoading(false);
        toast.success(`Location: ${areaName}`);
      },
      () => {
        setGpsLoading(false);
        toast.error("Could not get location");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const origPrice = parseFloat(form.original_price);
    const discPrice = parseFloat(form.discounted_price);

    if (discPrice > origPrice) {
      setPriceError("Discounted price cannot be more than original price");
      return;
    }
    if (discPrice === origPrice) {
      setPriceError("Discounted price should be less than original price");
      return;
    }

    setLoading(true);
    try {
      const imageUrl = await uploadImage();

      const payload = {
        product_name: form.product_name.trim(),
        category: form.category,
        quantity_kg: parseFloat(form.quantity_kg),
        original_price: origPrice,
        discounted_price: discPrice,
        urgency_level: form.urgency_level,
        location_label: form.location_label || null,
        location_lat: form.location_lat,
        location_lng: form.location_lng,
        transportation_available: form.transportation_available,
        expiry_date: form.expiry_date ? format(form.expiry_date, "yyyy-MM-dd") : null,
        image_url: imageUrl,
      } as any;

      if (isEdit && editListing) {
        const { error } = await supabase
          .from("surplus_listings")
          .update(payload)
          .eq("id", editListing.id);
        if (error) throw error;
        toast.success("Listing updated!");
      } else {
        const { error } = await supabase.from("surplus_listings").insert({
          ...payload,
          supplier_id: user?.id ?? null,
        });
        if (error) throw error;
        toast.success("Listing posted successfully!");
      }

      setOpen(false);
      setForm(defaultForm);
      setImageFile(null);
      setImagePreview(null);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {trigger ? (
        <span onClick={openModal}>{trigger}</span>
      ) : (
        <Button onClick={openModal} className="gap-2">
          <Plus className="h-4 w-4" /> Post Surplus Food
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card border-border/50 sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{isEdit ? "Edit Listing" : "Post Surplus Food"}</DialogTitle>
            <DialogDescription>{isEdit ? "Update your listing details" : "List your surplus produce for buyers across Malaysia"}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Photo upload */}
            <div>
              <label className="text-sm font-medium mb-1 block">Product Photo</label>
              {imagePreview ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border/50">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={removeImage} className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-destructive/80 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-24 rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer transition-colors bg-muted/20">
                  <ImagePlus className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Click to upload (max 5MB)</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                </label>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Product Name</label>
              <Input value={form.product_name} onChange={(e) => update("product_name", e.target.value)} required placeholder="e.g. Ugly Tomatoes" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Quantity (kg)</label>
                <Input type="number" min="0" step="0.1" value={form.quantity_kg} onChange={(e) => update("quantity_kg", e.target.value)} required placeholder="500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Original Price (RM/kg)</label>
                <Input type="number" min="0" step="0.01" value={form.original_price} onChange={(e) => update("original_price", e.target.value)} required placeholder="4.20" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Discounted Price (RM/kg)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discounted_price}
                  onChange={(e) => update("discounted_price", e.target.value)}
                  required
                  placeholder="2.80"
                  className={priceError ? "border-destructive" : ""}
                />
              </div>
            </div>
            {priceError && (
              <p className="text-xs text-destructive -mt-2">{priceError}</p>
            )}

            {/* Expiry date */}
            <div>
              <label className="text-sm font-medium mb-1 block">Expiry Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !form.expiry_date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.expiry_date ? format(form.expiry_date, "PPP") : "Select expiry date (optional)"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.expiry_date ?? undefined}
                    onSelect={(date) => setForm((f) => ({ ...f, expiry_date: date ?? null }))}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium mb-1 block">Location</label>
              <div className="flex gap-2">
                <Input
                  value={form.location_label}
                  onChange={(e) => update("location_label", e.target.value)}
                  placeholder="e.g. Cameron Highlands, Pahang"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={requestGPS} disabled={gpsLoading} className="gap-1 shrink-0">
                  <Navigation className="h-3.5 w-3.5" />
                  {gpsLoading ? "..." : "GPS"}
                </Button>
              </div>
              {form.location_lat && (
                <p className="text-xs text-muted-foreground mt-1">📍 {form.location_lat.toFixed(4)}, {form.location_lng?.toFixed(4)}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Urgency</label>
              <div className="flex gap-2">
                {urgencies.map((u) => (
                  <Button
                    key={u}
                    type="button"
                    variant={form.urgency_level === u ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => update("urgency_level", u)}
                  >
                    {u === "High" ? "⚡" : u === "Medium" ? "⏳" : "📦"} {u}
                  </Button>
                ))}
              </div>
            </div>

            {/* Transportation toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="transport-toggle" className="text-sm font-medium cursor-pointer">Transportation Available</Label>
              </div>
              <Switch
                id="transport-toggle"
                checked={form.transportation_available}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, transportation_available: checked }))}
              />
            </div>

            {/* Processing fee notice */}
            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
              <p className="text-xs text-muted-foreground">💰 A <span className="font-semibold text-foreground">1% processing fee</span> will be charged on total revenue per transaction.</p>
              <p className="text-[11px] text-muted-foreground/70">Join as a member to have all processing fees waived.</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading || uploading}>
                {uploading ? "Uploading..." : loading ? (isEdit ? "Saving..." : "Posting...") : (isEdit ? "Save Changes" : "Post Listing")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddListingModal;
