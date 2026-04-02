import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Cloud, Sun, CloudRain, Thermometer, Wind,
  Truck, MapPin, TrendingUp, TrendingDown,
  Package, Leaf, ArrowLeft, BarChart3, LogIn
} from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useSurplusListings } from "@/hooks/useSurplusListings";
import AddListingModal from "@/components/AddListingModal";
import { useQueryClient } from "@tanstack/react-query";

const supplyData = [
  { day: "Mon", supply: 420, demand: 380 },
  { day: "Tue", supply: 380, demand: 400 },
  { day: "Wed", supply: 510, demand: 450 },
  { day: "Thu", supply: 460, demand: 470 },
  { day: "Fri", supply: 550, demand: 520 },
  { day: "Sat", supply: 620, demand: 600 },
  { day: "Sun", supply: 340, demand: 300 },
];

const routeData = [
  { route: "CH→KL", distance: "205km", time: "3.5h", status: "clear", savings: "12%" },
  { route: "Ipoh→PG", distance: "170km", time: "2.8h", status: "rain", savings: "8%" },
  { route: "JB→ML", distance: "320km", time: "4.2h", status: "clear", savings: "18%" },
  { route: "KB→KT", distance: "165km", time: "2.5h", status: "clear", savings: "10%" },
];

const weatherForecast = [
  { region: "Cameron Highlands", temp: "22°C", condition: "Cloudy", icon: Cloud, impact: "Normal harvest" },
  { region: "Kuala Lumpur", temp: "33°C", condition: "Sunny", icon: Sun, impact: "High demand" },
  { region: "Kelantan", temp: "29°C", condition: "Heavy Rain", icon: CloudRain, impact: "Delayed supply" },
  { region: "Johor Bahru", temp: "31°C", condition: "Sunny", icon: Sun, impact: "Optimal routes" },
];

const priceChanges = [
  { item: "Tomatoes", change: -8, price: "RM 2.80" },
  { item: "Chili Padi", change: 15, price: "RM 14.50" },
  { item: "Kangkung", change: -3, price: "RM 3.50" },
  { item: "Cabbage", change: -12, price: "RM 1.90" },
];

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`glass-card p-5 ${className}`}>{children}</div>
);

const urgencyStyles: Record<string, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-secondary/10 text-secondary",
  Low: "bg-primary/10 text-primary",
};

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { data: listings, isLoading } = useSurplusListings();
  const queryClient = useQueryClient();

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
              <span className="font-display font-bold">Foodlysis</span>
              <span className="text-muted-foreground text-sm">/ Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {profile && (
                  <Badge variant="outline" className="text-xs">
                    {profile.role === "supplier" ? "🌾" : "🛒"} {profile.business_name}
                  </Badge>
                )}
                {profile?.role === "supplier" && (
                  <AddListingModal onSuccess={() => queryClient.invalidateQueries({ queryKey: ["surplus_listings"] })} />
                )}
                <Button variant="outline" size="sm" onClick={signOut}>Sign Out</Button>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" /> Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">Market Overview</h1>
          <p className="text-muted-foreground">Real-time supply chain intelligence for Peninsular Malaysia</p>
        </motion.div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Listings", value: listings?.length?.toString() ?? "0", icon: Package, change: "" },
            { label: "Routes Active", value: "28", icon: Truck, change: "+5%" },
            { label: "Avg Temp", value: "31°C", icon: Thermometer, change: "" },
            { label: "Wind (KL)", value: "12 km/h", icon: Wind, change: "" },
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

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Supply vs Demand (MT)
              </h3>
              <span className="text-xs text-muted-foreground">This week</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={supplyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(160 15% 16%)" />
                <XAxis dataKey="day" tick={{ fill: "hsl(150 10% 55%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(150 10% 55%)", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(160 18% 10%)", border: "1px solid hsl(160 15% 16%)", borderRadius: "8px", color: "hsl(150 15% 92%)" }} />
                <Area type="monotone" dataKey="supply" stroke="hsl(152 60% 42%)" fill="hsl(152 60% 42% / 0.2)" strokeWidth={2} />
                <Area type="monotone" dataKey="demand" stroke="hsl(40 80% 50%)" fill="hsl(40 80% 50% / 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Price Movement
            </h3>
            <div className="space-y-4">
              {priceChanges.map((item) => (
                <div key={item.item} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{item.item}</div>
                    <div className="text-xs text-muted-foreground">{item.price}/kg</div>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${item.change > 0 ? "text-destructive" : "text-primary"}`}>
                    {item.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {item.change > 0 ? "+" : ""}{item.change}%
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <Cloud className="h-4 w-4 text-primary" /> Weather Insights
            </h3>
            <div className="space-y-3">
              {weatherForecast.map((w) => (
                <div key={w.region} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <w.icon className="h-5 w-5 text-secondary" />
                    <div>
                      <div className="text-sm font-medium">{w.region}</div>
                      <div className="text-xs text-muted-foreground">{w.condition} · {w.temp}</div>
                    </div>
                  </div>
                  <span className="text-xs text-accent-foreground bg-accent px-2 py-1 rounded-md">{w.impact}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Active Routes
            </h3>
            <div className="space-y-3">
              {routeData.map((r) => (
                <div key={r.route} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{r.route}</div>
                      <div className="text-xs text-muted-foreground">{r.distance} · {r.time}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-primary">{r.savings} saved</div>
                    <div className={`text-xs ${r.status === "rain" ? "text-secondary" : "text-muted-foreground"}`}>
                      {r.status === "rain" ? "⚠ Rain" : "✓ Clear"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

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
              {!user && (
                <Link to="/auth">
                  <Button size="sm">Sign in to post</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-left">
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">Quantity</th>
                    <th className="pb-3 font-medium">Supplier</th>
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
                        <td className="py-3 text-muted-foreground">{(listing.quantity_kg / 1000).toFixed(1)} MT</td>
                        <td className="py-3 text-muted-foreground">{listing.profiles?.business_name ?? "Unknown"}</td>
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
