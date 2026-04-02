import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Navigation } from "lucide-react";
import { toast } from "sonner";

const categories = ["Vegetables", "Fruits", "Grains", "Seafood", "Poultry", "Dairy", "Other"] as const;
const urgencies = ["Low", "Medium", "High"] as const;

interface Props {
  onSuccess?: () => void;
}

const AddListingModal = ({ onSuccess }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [form, setForm] = useState({
    product_name: "",
    category: "Vegetables" as string,
    quantity_kg: "",
    original_price: "",
    discounted_price: "",
    urgency_level: "Medium" as string,
    location_label: "",
    location_lat: null as number | null,
    location_lng: null as number | null,
  });

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const requestGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          location_lat: pos.coords.latitude,
          location_lng: pos.coords.longitude,
          location_label: f.location_label || `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
        }));
        setGpsLoading(false);
        toast.success("Location captured!");
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
    setLoading(true);
    try {
      const { error } = await supabase.from("surplus_listings").insert({
        supplier_id: "00000000-0000-0000-0000-000000000000",
        product_name: form.product_name,
        category: form.category,
        quantity_kg: parseFloat(form.quantity_kg),
        original_price: parseFloat(form.original_price),
        discounted_price: parseFloat(form.discounted_price),
        urgency_level: form.urgency_level,
        location_label: form.location_label || null,
        location_lat: form.location_lat,
        location_lng: form.location_lng,
      } as any);
      if (error) throw error;
      toast.success("Listing posted successfully!");
      setOpen(false);
      setForm({ product_name: "", category: "Vegetables", quantity_kg: "", original_price: "", discounted_price: "", urgency_level: "Medium", location_label: "", location_lat: null, location_lng: null });
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" /> Post Surplus Food
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card border-border/50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Post Surplus Food</DialogTitle>
            <DialogDescription>List your surplus produce for buyers across Malaysia</DialogDescription>
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
                <Input type="number" min="0" step="0.01" value={form.discounted_price} onChange={(e) => update("discounted_price", e.target.value)} required placeholder="2.80" />
              </div>
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Posting..." : "Post Listing"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddListingModal;
