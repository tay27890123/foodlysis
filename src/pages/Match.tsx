import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Leaf, ArrowLeft, Search, MapPin, Weight,
  Tag, SlidersHorizontal, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Category = "All" | "Vegetables" | "Fruits" | "Grains" | "Seafood" | "Poultry";
type Location = "All" | "Cameron Highlands" | "Kuala Lumpur" | "Johor Bahru" | "Kelantan" | "Penang" | "Ipoh";

interface Listing {
  id: number;
  product: string;
  category: Category;
  weight: string;
  originalPrice: string;
  discountedPrice: string;
  discount: number;
  supplier: string;
  location: Location;
  freshUntil: string;
  urgency: "high" | "medium" | "low";
}

const listings: Listing[] = [
  { id: 1, product: "Cherry Tomatoes", category: "Vegetables", weight: "2.5 MT", originalPrice: "RM 4.20/kg", discountedPrice: "RM 2.80/kg", discount: 33, supplier: "Tanah Rata Farm", location: "Cameron Highlands", freshUntil: "2 days", urgency: "high" },
  { id: 2, product: "Kangkung", category: "Vegetables", weight: "1.2 MT", originalPrice: "RM 5.00/kg", discountedPrice: "RM 3.50/kg", discount: 30, supplier: "Shah Alam Greens", location: "Kuala Lumpur", freshUntil: "1 day", urgency: "high" },
  { id: 3, product: "Dragon Fruit", category: "Fruits", weight: "3.0 MT", originalPrice: "RM 12.00/kg", discountedPrice: "RM 8.00/kg", discount: 33, supplier: "Batu Pahat Orchard", location: "Johor Bahru", freshUntil: "5 days", urgency: "low" },
  { id: 4, product: "Cabbage", category: "Vegetables", weight: "4.1 MT", originalPrice: "RM 3.00/kg", discountedPrice: "RM 1.90/kg", discount: 37, supplier: "Kundasang Valley", location: "Cameron Highlands", freshUntil: "3 days", urgency: "medium" },
  { id: 5, product: "Banana (Pisang Berangan)", category: "Fruits", weight: "1.8 MT", originalPrice: "RM 6.00/kg", discountedPrice: "RM 3.80/kg", discount: 37, supplier: "Pahang Fruits Co.", location: "Kuala Lumpur", freshUntil: "2 days", urgency: "high" },
  { id: 6, product: "Red Chili", category: "Vegetables", weight: "0.8 MT", originalPrice: "RM 18.00/kg", discountedPrice: "RM 14.50/kg", discount: 19, supplier: "Taman Negara Spice", location: "Kelantan", freshUntil: "4 days", urgency: "low" },
  { id: 7, product: "White Rice (Grade A)", category: "Grains", weight: "10.0 MT", originalPrice: "RM 3.20/kg", discountedPrice: "RM 2.60/kg", discount: 19, supplier: "Kedah Rice Mill", location: "Penang", freshUntil: "30 days", urgency: "low" },
  { id: 8, product: "Tiger Prawns", category: "Seafood", weight: "0.5 MT", originalPrice: "RM 45.00/kg", discountedPrice: "RM 32.00/kg", discount: 29, supplier: "Kukup Fishery", location: "Johor Bahru", freshUntil: "1 day", urgency: "high" },
  { id: 9, product: "Spinach (Bayam)", category: "Vegetables", weight: "0.9 MT", originalPrice: "RM 4.50/kg", discountedPrice: "RM 2.90/kg", discount: 36, supplier: "Green Acres KL", location: "Kuala Lumpur", freshUntil: "1 day", urgency: "high" },
  { id: 10, product: "Papaya", category: "Fruits", weight: "2.2 MT", originalPrice: "RM 3.50/kg", discountedPrice: "RM 2.10/kg", discount: 40, supplier: "Raub Plantations", location: "Kuala Lumpur", freshUntil: "3 days", urgency: "medium" },
  { id: 11, product: "Free-range Chicken", category: "Poultry", weight: "1.0 MT", originalPrice: "RM 14.00/kg", discountedPrice: "RM 10.50/kg", discount: 25, supplier: "Semenyih Poultry", location: "Kuala Lumpur", freshUntil: "1 day", urgency: "high" },
  { id: 12, product: "Sweet Corn", category: "Vegetables", weight: "1.5 MT", originalPrice: "RM 2.80/kg", discountedPrice: "RM 1.80/kg", discount: 36, supplier: "Ipoh Valley Farm", location: "Ipoh", freshUntil: "4 days", urgency: "medium" },
];

const categories: Category[] = ["All", "Vegetables", "Fruits", "Grains", "Seafood", "Poultry"];
const locations: Location[] = ["All", "Cameron Highlands", "Kuala Lumpur", "Johor Bahru", "Kelantan", "Penang", "Ipoh"];

const urgencyStyles = {
  high: "bg-destructive/15 text-destructive border-destructive/20",
  medium: "bg-secondary/15 text-secondary border-secondary/20",
  low: "bg-primary/15 text-primary border-primary/20",
};

const SurplusCard = ({ listing, index }: { listing: Listing; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.04, duration: 0.35 }}
    className="glass-card group hover:border-primary/40 transition-all duration-300 flex flex-col"
  >
    {/* Header strip */}
    <div className="flex items-center justify-between px-5 pt-4 pb-2">
      <Badge variant="outline" className={`text-[11px] font-medium ${urgencyStyles[listing.urgency]}`}>
        {listing.urgency === "high" ? "⚡ Urgent" : listing.urgency === "medium" ? "⏳ Moderate" : "📦 Flexible"}
      </Badge>
      <span className="text-xs text-muted-foreground">Fresh: {listing.freshUntil}</span>
    </div>

    {/* Body */}
    <div className="px-5 pb-4 flex-1 flex flex-col">
      <h3 className="font-display text-lg font-semibold mt-1 mb-1 group-hover:text-primary transition-colors">
        {listing.product}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">{listing.supplier}</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Weight className="h-3.5 w-3.5 shrink-0" />
          <span>{listing.weight}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{listing.location}</span>
        </div>
      </div>

      {/* Pricing */}
      <div className="mt-auto pt-4 border-t border-border/50 flex items-end justify-between">
        <div>
          <span className="text-xs text-muted-foreground line-through">{listing.originalPrice}</span>
          <div className="font-display text-xl font-bold text-primary">{listing.discountedPrice}</div>
        </div>
        <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">
          -{listing.discount}%
        </Badge>
      </div>
    </div>

    {/* Action */}
    <div className="px-5 pb-5">
      <Button className="w-full" size="sm">
        <Tag className="h-3.5 w-3.5 mr-2" /> Place Bid
      </Button>
    </div>
  </motion.div>
);

const Match = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [location, setLocation] = useState<Location>("All");

  const filtered = listings.filter((l) => {
    const matchSearch = l.product.toLowerCase().includes(search.toLowerCase()) ||
      l.supplier.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || l.category === category;
    const matchLocation = location === "All" || l.location === location;
    return matchSearch && matchCategory && matchLocation;
  });

  const hasFilters = search || category !== "All" || location !== "All";

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setLocation("All");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-primary" />
              <span className="font-display font-bold">PanganLink</span>
              <span className="text-muted-foreground text-sm">/ Match</span>
            </div>
          </div>
          <Link to="/dashboard">
            <Button variant="outline" size="sm">Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="container py-8">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">Surplus Marketplace</h1>
          <p className="text-muted-foreground">Browse discounted surplus food from verified suppliers across Malaysia</p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-4 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products or suppliers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/60"
              />
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground hidden md:block" />
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(cat)}
                  className="text-xs h-8"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Location filter */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {locations.map((loc) => (
              <Button
                key={loc}
                variant={location === loc ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setLocation(loc)}
                className="text-xs h-7"
              >
                {loc}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Active filters & count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filtered.length}</span> listing{filtered.length !== 1 ? "s" : ""}
          </p>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1">
              <X className="h-3 w-3" /> Clear filters
            </Button>
          )}
        </div>

        {/* Cards grid */}
        <AnimatePresence mode="wait">
          {filtered.length > 0 ? (
            <motion.div
              key={`${category}-${location}-${search}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {filtered.map((listing, i) => (
                <SurplusCard key={listing.id} listing={listing} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold mb-1">No listings found</h3>
              <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters or search terms</p>
              <Button variant="outline" size="sm" onClick={clearFilters}>Clear all filters</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Match;
