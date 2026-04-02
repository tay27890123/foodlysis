import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const categories = ["Vegetables", "Fruits", "Grains", "Seafood", "Poultry", "Dairy", "Other"] as const;
const urgencies = ["Low", "Medium", "High"] as const;

interface Props {
  onSuccess?: () => void;
}

const AddListingModal = ({ onSuccess }: Props) => {
  const [open, setOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    product_name: "",
    category: "Vegetables" as string,
    quantity_kg: "",
    original_price: "",
    discounted_price: "",
    urgency_level: "Medium" as string,
  });

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    if (profile?.role !== "supplier") {
      toast.error("Only suppliers can post listings");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("surplus_listings").insert({
        supplier_id: user.id,
        product_name: form.product_name,
        category: form.category,
        quantity_kg: parseFloat(form.quantity_kg),
        original_price: parseFloat(form.original_price),
        discounted_price: parseFloat(form.discounted_price),
        urgency_level: form.urgency_level,
      });
      if (error) throw error;
      toast.success("Listing posted successfully!");
      setOpen(false);
      setForm({ product_name: "", category: "Vegetables", quantity_kg: "", original_price: "", discounted_price: "", urgency_level: "Medium" });
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
