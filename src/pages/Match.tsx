import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowLeft, Leaf, Search, Filter, MapPin, Weight,
  Tag, Clock, ChevronDown, ShoppingCart
} from "lucide-react";
import { useState } from "react";

const listings = [
  { id: 1, product: "Cameron Highland Tomatoes", weight: "2.5 MT", originalPrice: 4.20, discountPrice: 2.80, location: "Tanah Rata, Pahang", supplier: "Tanah Rata Farm Co.", freshness: "3 days", category: "Vegetables", discount: 33 },
  { id: 2, product: "Organic Kangkung", weight: "1.2 MT", originalPrice: 5.00, discountPrice: 3.50, location: "Shah Alam, Selangor", supplier: "Shah Alam Greens", freshness: "2 days", category: "Leafy Greens", discount: 30 },
  { id: 3, product: "Red Dragon Fruit", weight: "3.0 MT", originalPrice: 12.00, discountPrice: 8.00, location: "Batu Pahat, Johor", supplier: "Batu Pahat Orchard", freshness: "5 days", category: "Fruits", discount: 33 },
  { id: 4, product: "Round Cabbage", weight: "4.1 MT", originalPrice: 3.20, discountPrice: 1.90, location: "Kundasang, Sabah", supplier: "Kundasang Valley Farm", freshness: "4 days", category: "Vegetables", discount: 41 },
  { id: 5, product: "Chili Padi (Red)", weight: "0.8 MT", originalPrice: 22.00, discountPrice: 14.50, location: "Kota Bharu, Kelantan", supplier: "Kelantan Spice Growers", freshness: "6 days", category: "Spices", discount: 34 },
  { id: 6, product: "Butterhead Lettuce", weight: "0.6 MT", originalPrice: 8.50, discountPrice: 5.20, location: "Lojing, Kelantan", supplier: "Highland Lettuce Co.", freshness: "2 days", category: "Leafy Greens", discount: 39 },
  { id: 7, product: "Sweet Corn", weight: "2.0 MT", originalPrice: 3.00, discountPrice: 1.80, location: "Seremban, N. Sembilan", supplier: "Nilai Agro Farm", freshness: "4 days", category: "Vegetables", discount: 40 },
  { id: 8, product: "Musang King Durian", weight: "1.5 MT", originalPrice: 65.00, discountPrice: 45.00, location: "Raub, Pahang", supplier: "Raub Durian Estate", freshness: "3 days", category: "Fruits", discount: 31 },
];

const categories = ["All", "Vegetables", "Fruits", "Leafy Greens", "Spices"];

const Match = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = listings.filter((l) => {
    const matchCategory = activeCategory === "All" || l.category === activeCategory;
    const matchSearch = l.product.toLowerCase().includes(search.toLowerCase()) ||
      l.location.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-primary" />
              <span className="font-display font-bold">PanganLink</span>
              <span className="text-muted-foreground text-sm">/ Match</span>
            </div>
          </div>
          <Button size="sm" className="gap-2">
            <ShoppingCart className="h-4 w-4" /> My Bids (0)
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">Find Surplus</h1>
          <p className="text-muted-foreground">Browse available surplus produce from verified suppliers across Malaysia</p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search product or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-6">{filtered.length} listings available</p>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card overflow-hidden group hover:border-primary/40 transition-all"
            >
              {/* Discount badge */}
              <div className="relative h-2 bg-gradient-to-r from-primary/60 to-primary/20">
                <span className="absolute top-2 right-3 bg-secondary text-secondary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  -{item.discount}%
                </span>
              </div>

              <div className="p-5 pt-6">
                <div className="mb-4">
                  <h3 className="font-display font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                    {item.product}
                  </h3>
                  <p className="text-xs text-muted-foreground">{item.supplier}</p>
                </div>

                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate">{item.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Weight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{item.weight}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{item.freshness} left</span>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <span className="text-xs text-muted-foreground line-through">
                      RM {item.originalPrice.toFixed(2)}/kg
                    </span>
                    <div className="font-display text-xl font-bold text-primary">
                      RM {item.discountPrice.toFixed(2)}
                      <span className="text-xs font-normal text-muted-foreground">/kg</span>
                    </div>
                  </div>
                  <Tag className="h-4 w-4 text-secondary" />
                </div>

                <Button size="sm" className="w-full">Place Bid</Button>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="font-display text-lg">No listings match your search</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Match;
