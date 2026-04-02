import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package, Leaf, BarChart3, ShoppingCart, Store,
  TrendingUp, TrendingDown, Recycle, Apple, Beef, Carrot,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
  ComposedChart, Line, Scatter, Legend,
} from "recharts";
import { useSurplusListings } from "@/hooks/useSurplusListings";
import { useMemo } from "react";

const supplyData = [
  { day: "Mon", supply: 420, demand: 380 },
  { day: "Tue", supply: 380, demand: 400 },
  { day: "Wed", supply: 510, demand: 450 },
  { day: "Thu", supply: 460, demand: 470 },
  { day: "Fri", supply: 550, demand: 520 },
  { day: "Sat", supply: 620, demand: 600 },
  { day: "Sun", supply: 340, demand: 300 },
];

const foodWasteReduced = [
  { category: "Fruits", saved: 1240, icon: "🍎", color: "hsl(0 70% 55%)" },
  { category: "Vegetables", saved: 980, icon: "🥬", color: "hsl(130 55% 45%)" },
  { category: "Meat & Poultry", saved: 560, icon: "🥩", color: "hsl(15 70% 50%)" },
  { category: "Seafood", saved: 420, icon: "🐟", color: "hsl(200 60% 50%)" },
  { category: "Dairy & Eggs", saved: 310, icon: "🥛", color: "hsl(45 80% 55%)" },
];

const leastBought = [
  { item: "Bitter Gourd", listings: 12, sold: 2, ratio: 17 },
  { item: "Cempedak", listings: 8, sold: 1, ratio: 13 },
  { item: "Duck Eggs", listings: 15, sold: 3, ratio: 20 },
  { item: "Petai", listings: 10, sold: 2, ratio: 20 },
  { item: "Jering", listings: 6, sold: 1, ratio: 17 },
];

// Price boxplot data: min sell, mean sell, max sell, mean buy
const priceBoxplot = [
  { food: "Rice", minSell: 2.5, meanSell: 3.2, maxSell: 4.1, meanBuy: 2.8 },
  { food: "Chicken", minSell: 8.0, meanSell: 9.5, maxSell: 12.0, meanBuy: 8.8 },
  { food: "Kangkung", minSell: 2.0, meanSell: 3.5, maxSell: 5.0, meanBuy: 2.8 },
  { food: "Tomato", minSell: 2.2, meanSell: 2.8, maxSell: 4.5, meanBuy: 2.4 },
  { food: "Chili", minSell: 8.0, meanSell: 14.5, maxSell: 22.0, meanBuy: 12.0 },
  { food: "Cabbage", minSell: 1.2, meanSell: 1.9, maxSell: 3.0, meanBuy: 1.5 },
];

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`glass-card p-5 ${className}`}>{children}</div>
);

const urgencyStyles: Record<string, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-secondary/10 text-secondary",
  Low: "bg-primary/10 text-primary",
};

// Custom boxplot-like bar for price range
const PriceRangeBar = ({ data }: { data: typeof priceBoxplot }) => (
  <div className="space-y-3">
    {data.map((item) => {
      const max = Math.max(...data.map(d => d.maxSell)) + 2;
      const minPct = (item.minSell / max) * 100;
      const meanPct = (item.meanSell / max) * 100;
      const maxPct = (item.maxSell / max) * 100;
      const buyPct = (item.meanBuy / max) * 100;
      return (
        <div key={item.food} className="flex items-center gap-3">
          <span className="text-xs font-medium w-16 text-right shrink-0">{item.food}</span>
          <div className="relative flex-1 h-6 rounded bg-muted/30">
            {/* Range bar (min to max sell) */}
            <div
              className="absolute top-1 h-4 rounded bg-primary/30"
              style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
            />
            {/* Mean sell marker */}
            <div
              className="absolute top-0 w-0.5 h-6 bg-primary"
              style={{ left: `${meanPct}%` }}
              title={`Mean Sell: RM${item.meanSell}`}
            />
            {/* Buy price marker */}
            <div
              className="absolute top-0 w-0.5 h-6 bg-secondary"
              style={{ left: `${buyPct}%` }}
              title={`Mean Buy: RM${item.meanBuy}`}
            />
          </div>
          <div className="text-[10px] text-muted-foreground shrink-0 w-28 text-right">
            <span className="text-primary">RM{item.meanSell}</span>
            {" / "}
            <span className="text-secondary">RM{item.meanBuy}</span>
          </div>
        </div>
      );
    })}
    <div className="flex items-center gap-4 text-[10px] text-muted-foreground mt-2 justify-end">
      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" /> Sell Price</span>
      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary inline-block" /> Buy Price</span>
      <span className="flex items-center gap-1"><span className="w-6 h-2 rounded bg-primary/30 inline-block" /> Sell Range</span>
    </div>
  </div>
);

const Dashboard = () => {
  const { data: listings, isLoading } = useSurplusListings();

  const sellCount = useMemo(() => listings?.length ?? 0, [listings]);
  // Mock buy count — in a real app this would be a separate query
  const buyCount = useMemo(() => Math.max(0, (listings?.length ?? 0) - 1), [listings]);

  const foodSaved = useMemo(() => {
    if (!listings || listings.length === 0) return [];
    const map: Record<string, number> = {};
    listings.forEach((l) => {
      map[l.category] = (map[l.category] || 0) + l.quantity_kg;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, kg]) => ({ category: cat, kg }));
  }, [listings]);

  return (
    <div className="min-h-screen bg-background pt-20">
      <main className="container py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">Market Overview</h1>
          <p className="text-muted-foreground">Real-time supply chain intelligence for Peninsular Malaysia</p>
        </motion.div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Listing (Sell)", value: sellCount.toString(), icon: Store, change: "" },
            { label: "Active Listing (Buy)", value: buyCount.toString(), icon: ShoppingCart, change: "" },
            { label: "Food Saved", value: `${((listings?.reduce((s, l) => s + l.quantity_kg, 0) ?? 0)).toLocaleString()} kg`, icon: Recycle, change: "" },
            { label: "Total Waste Reduced", value: `${(foodWasteReduced.reduce((s, f) => s + f.saved, 0) / 1000).toFixed(1)} tonnes`, icon: Leaf, change: "" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                  {stat.change && <span className="text-xs text-primary font-medium">{stat.change}</span>}
                </div>
                <div className="font-display text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Row 1: Supply vs Demand + Food Waste Reduced */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Supply vs Demand (kg)
              </h3>
              <span className="text-xs text-muted-foreground">This week</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={supplyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(160 15% 16%)" />
                <XAxis dataKey="day" tick={{ fill: "hsl(150 10% 55%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(150 10% 55%)", fontSize: 12 }} unit=" kg" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(160 18% 10%)", border: "1px solid hsl(160 15% 16%)", borderRadius: "8px", color: "hsl(150 15% 92%)" }} />
                <Area type="monotone" dataKey="supply" stroke="hsl(152 60% 42%)" fill="hsl(152 60% 42% / 0.2)" strokeWidth={2} />
                <Area type="monotone" dataKey="demand" stroke="hsl(40 80% 50%)" fill="hsl(40 80% 50% / 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Food Waste Reduced by Category */}
          <Card>
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <Recycle className="h-4 w-4 text-primary" /> Food Waste Reduced
            </h3>
            <div className="space-y-3">
              {foodWasteReduced.map((item) => {
                const maxSaved = Math.max(...foodWasteReduced.map(f => f.saved));
                const pct = (item.saved / maxSaved) * 100;
                return (
                  <div key={item.category}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <span>{item.icon}</span>
                        <span className="font-medium">{item.category}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{item.saved.toLocaleString()} kg</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Row 2: What Food is Saved + Least Bought */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* What Food is Saved */}
          <Card>
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <Leaf className="h-4 w-4 text-primary" /> What Food is Saved?
            </h3>
            {foodSaved.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No listings yet — post surplus to start saving food!</p>
            ) : (
              <div className="space-y-3">
                {foodSaved.map((item, i) => (
                  <div key={item.category} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-primary">#{i + 1}</span>
                      <span className="text-sm font-medium">{item.category}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">{item.kg.toLocaleString()} kg</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Least Bought */}
          <Card>
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" /> Least Bought Items
            </h3>
            <div className="space-y-3">
              {leastBought.map((item) => (
                <div key={item.item} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <div className="text-sm font-medium">{item.item}</div>
                    <div className="text-xs text-muted-foreground">{item.listings} listed · {item.sold} sold</div>
                  </div>
                  <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10">
                    {item.ratio}% sold
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Row 3: Price Boxplot */}
        <Card className="mb-8">
          <h3 className="font-display font-semibold mb-1 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Common Price per Food (RM/kg)
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Range shows min–max selling price. Lines mark mean sell price <span className="text-primary">(green)</span> and mean buy price <span className="text-secondary">(yellow)</span>.
          </p>
          <PriceRangeBar data={priceBoxplot} />
        </Card>

        {/* Surplus listings from DB */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Live Surplus Listings
            </h3>
            <Link to="/match">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading listings...</div>
          ) : !listings || listings.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold mb-1">No active surplus listings right now</h3>
              <p className="text-sm text-muted-foreground mb-4">Be the first to list!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-left">
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">Quantity</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Price</th>
                    <th className="pb-3 font-medium">Urgency</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {listings.slice(0, 5).map((listing) => {
                    const discount = listing.original_price > 0
                      ? Math.round((1 - listing.discounted_price / listing.original_price) * 100)
                      : 0;
                    return (
                      <tr key={listing.id} className="border-b border-border/50 last:border-0">
                        <td className="py-3 font-medium">{listing.product_name}</td>
                        <td className="py-3 text-muted-foreground">{listing.quantity_kg.toLocaleString()} kg</td>
                        <td className="py-3 text-muted-foreground">{listing.category}</td>
                        <td className="py-3">
                          <span className="text-xs text-muted-foreground line-through mr-1">RM {listing.original_price.toFixed(2)}</span>
                          <span className="text-primary font-medium">RM {listing.discounted_price.toFixed(2)}/kg</span>
                          {discount > 0 && (
                            <Badge className="ml-2 bg-primary/15 text-primary border-primary/30 text-[10px]">-{discount}%</Badge>
                          )}
                        </td>
                        <td className="py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${urgencyStyles[listing.urgency_level] ?? ""}`}>
                            {listing.urgency_level}
                          </span>
                        </td>
                        <td className="py-3">
                          <Button size="sm" variant="outline">Bid</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
