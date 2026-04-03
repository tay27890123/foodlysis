import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Navigation, Pencil, Truck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { SurplusListing } from "@/hooks/useSurplusListings";

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
};

const AddListingModal = ({ onSuccess, editListing, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [priceError, setPriceError] = useState("");
  const [form, setForm] = useState(defaultForm);

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
        location_label: (editListing as any).location_label || "",
        location_lat: (editListing as any).location_lat || null,
        location_lng: (editListing as any).location_lng || null,
      });
    } else {
      setForm(defaultForm);
    }
    setPriceError("");
    setOpen(true);
  };

  const update = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (key === "discounted_price" || key === "original_price") {
      setPriceError("");
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
      // Return area-level name for privacy: suburb/town/city + state
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
          supplier_id: "00000000-0000-0000-0000-000000000000",
        });
        if (error) throw error;
        toast.success("Listing posted successfully!");
      }

      setOpen(false);
      setForm(defaultForm);
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
        <DialogContent className="glass-card border-border/50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{isEdit ? "Edit Listing" : "Post Surplus Food"}</DialogTitle>
            <DialogDescription>{isEdit ? "Update your listing details" : "List your surplus produce for buyers across Malaysia"}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? (isEdit ? "Saving..." : "Posting...") : (isEdit ? "Save Changes" : "Post Listing")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddListingModal;
