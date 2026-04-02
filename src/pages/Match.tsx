import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Leaf, ArrowLeft, Search, MapPin, Weight,
  Tag, SlidersHorizontal, X, Package, Navigation, ShoppingCart, Store,
  Pencil, Trash2, MoreVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSurplusListings, type SurplusListing } from "@/hooks/useSurplusListings";
import { useUserLocation, haversineDistance } from "@/hooks/useUserLocation";
import AddListingModal from "@/components/AddListingModal";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Category = "All" | "Vegetables" | "Fruits" | "Grains" | "Seafood" | "Poultry" | "Dairy" | "Other";

const categories: Category[] = ["All", "Vegetables", "Fruits", "Grains", "Seafood", "Poultry", "Dairy", "Other"];

const urgencyStyles: Record<string, string> = {
  High: "bg-destructive/15 text-destructive border-destructive/20",
  Medium: "bg-secondary/15 text-secondary border-secondary/20",
  Low: "bg-primary/15 text-primary border-primary/20",
};

interface SurplusCardProps {
  listing: SurplusListing;
  index: number;
  distance?: number | null;
}

const SurplusCard = ({ listing, index, distance }: SurplusCardProps) => {
  const discount = listing.original_price > 0
    ? Math.round((1 - listing.discounted_price / listing.original_price) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="glass-card group hover:border-primary/40 transition-all duration-300 flex flex-col"
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <Badge variant="outline" className={`text-[11px] font-medium ${urgencyStyles[listing.urgency_level] ?? ""}`}>
          {listing.urgency_level === "High" ? "⚡ Urgent" : listing.urgency_level === "Medium" ? "⏳ Moderate" : "📦 Flexible"}
        </Badge>
        <span className="text-xs text-muted-foreground">{listing.category}</span>
      </div>

      <div className="px-5 pb-4 flex-1 flex flex-col">
        <h3 className="font-display text-lg font-semibold mt-1 mb-1 group-hover:text-primary transition-colors">
          {listing.product_name}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">{listing.profiles?.business_name ?? "Unknown Supplier"}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Weight className="h-3.5 w-3.5 shrink-0" />
            <span>{listing.quantity_kg.toLocaleString()} kg</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{(listing as any).location_label || listing.profiles?.location_state || "—"}</span>
          </div>
        </div>

        {distance != null && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Navigation className="h-3 w-3 shrink-0" />
            <span>{distance < 1 ? `${Math.round(distance * 1000)} m away` : `${distance.toFixed(1)} km away`}</span>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-border/50 flex items-end justify-between">
          <div>
            <span className="text-xs text-muted-foreground line-through">RM {listing.original_price.toFixed(2)}/kg</span>
            <div className="font-display text-xl font-bold text-primary">RM {listing.discounted_price.toFixed(2)}/kg</div>
          </div>
          {discount > 0 && (
            <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">-{discount}%</Badge>
          )}
        </div>
      </div>

      <div className="px-5 pb-5">
        <Button className="w-full" size="sm">
          <Tag className="h-3.5 w-3.5 mr-2" /> Place Bid
        </Button>
      </div>
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
      const lat = (l as any).location_lat as number | null;
      const lng = (l as any).location_lng as number | null;
      let dist: number | null = null;
      if (userLocation && lat && lng) {
        dist = haversineDistance(userLocation.lat, userLocation.lng, lat, lng);
      }
      return { ...l, _distance: dist };
    });
  }, [listings, userLocation]);

  const filtered = listingsWithDistance.filter((l) => {
    const matchSearch = l.product_name.toLowerCase().includes(search.toLowerCase()) ||
      (l.profiles?.business_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || l.category === category;
    const matchState = !stateFilter || ((l as any).location_label || l.profiles?.location_state || "").toLowerCase().includes(stateFilter.toLowerCase());
    return matchSearch && matchCategory && matchState;
  });

  // Sort by distance if GPS is available
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
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products, suppliers, or locations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-background/60" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={userLocation ? "default" : "outline"}
            size="sm"
            className="text-xs h-8 gap-1"
            onClick={requestLocation}
            disabled={gpsLoading}
          >
            <Navigation className="h-3.5 w-3.5" />
            {gpsLoading ? "Locating..." : userLocation ? "Nearby" : "Use GPS"}
          </Button>
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground hidden md:block" />
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
                <SurplusCard key={listing.id} listing={listing} index={i} distance={listing._distance} />
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
          <TabsList className="grid w-full max-w-xs grid-cols-2 mb-6">
            <TabsTrigger value="buy" className="gap-2">
              <ShoppingCart className="h-4 w-4" /> Buy
            </TabsTrigger>
            <TabsTrigger value="sell" className="gap-2">
              <Store className="h-4 w-4" /> Sell
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

              {/* Show user's own listings below */}
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
