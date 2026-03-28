import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Cloud, Sun, CloudRain, CloudLightning, Thermometer, Wind,
  Truck, MapPin, TrendingUp, TrendingDown,
  Package, Leaf, ArrowLeft, BarChart3, RefreshCw, Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData, type DashboardData } from "@/services/dashboardData";
import { useState } from "react";

const routeData = [
  { route: "CH→KL", distance: "205km", time: "3.5h", status: "clear", savings: "12%" },
  { route: "Ipoh→PG", distance: "170km", time: "2.8h", status: "rain", savings: "8%" },
  { route: "JB→ML", distance: "320km", time: "4.2h", status: "clear", savings: "18%" },
  { route: "KB→KT", distance: "165km", time: "2.5h", status: "clear", savings: "10%" },
];

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`glass-card p-5 ${className}`}>{children}</div>
);

const WeatherIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "rain": return <CloudRain className="h-5 w-5 text-secondary" />;
    case "thunder": return <CloudLightning className="h-5 w-5 text-destructive" />;
    case "cloud": return <Cloud className="h-5 w-5 text-muted-foreground" />;
    default: return <Sun className="h-5 w-5 text-secondary" />;
  }
};

const Dashboard = () => {
  const [lastRefresh, setLastRefresh] = useState<string>("");

  const { data, isLoading, isError, refetch, isFetching } = useQuery<DashboardData>({
    queryKey: ["dashboardData"],
    queryFn: fetchDashboardData,
    staleTime: 24 * 60 * 60 * 1000, // 1 day
    refetchInterval: 24 * 60 * 60 * 1000, // auto-refresh every 1 day
    refetchOnWindowFocus: false,
  });

  const handleRefresh = () => {
    refetch();
    setLastRefresh(new Date().toLocaleTimeString("en-MY"));
  };

  const supplyDemand = data?.supplyDemand ?? [];
  const surplusListings = data?.surplusListings ?? [];
  const weatherInsights = data?.weatherInsights ?? [];
  const totalListings = data?.totalListings ?? 0;
  const activeRoutes = data?.activeRoutes ?? 0;

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
              <span className="text-muted-foreground text-sm">/ Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isFetching}
              className="gap-2"
            >
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh Data
            </Button>
            <Button variant="outline" size="sm">Supplier View</Button>
            <Button size="sm">Buyer View</Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold mb-1">Market Overview</h1>
          <p className="text-muted-foreground">
            Real-time supply chain intelligence for Malaysia
            {data?.lastUpdated && (
              <span className="ml-2 text-xs text-primary">
                · Last updated: {new Date(data.lastUpdated).toLocaleString("en-MY")}
              </span>
            )}
            {lastRefresh && (
              <span className="ml-2 text-xs text-primary">· Refreshed at {lastRefresh}</span>
            )}
          </p>
        </motion.div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Fetching live data from data.gov.my…</span>
          </div>
        )}

        {isError && (
          <div className="p-6 rounded-lg border border-destructive/50 bg-destructive/10 mb-8 text-center">
            <p className="text-destructive font-medium">Failed to fetch live data.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Quick stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Crop Listings", value: String(totalListings), icon: Package, change: "" },
                { label: "Routes Active", value: String(activeRoutes), icon: Truck, change: "" },
                { label: "Crops Tracked", value: String(supplyDemand.length), icon: BarChart3, change: "" },
                { label: "Weather Zones", value: String(weatherInsights.length), icon: Thermometer, change: "" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                      {stat.change && (
                        <span className="text-xs text-primary font-medium">{stat.change}</span>
                      )}
                    </div>
                    <div className="font-display text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              {/* Supply vs Demand chart */}
              <Card className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" /> Supply vs Demand by Crop (KT)
                  </h3>
                  <span className="text-xs text-muted-foreground">data.gov.my</span>
                </div>
                {supplyDemand.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={supplyDemand} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(160 15% 16%)" />
                      <XAxis dataKey="crop" tick={{ fill: "hsl(150 10% 55%)", fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                      <YAxis tick={{ fill: "hsl(150 10% 55%)", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(160 18% 10%)",
                          border: "1px solid hsl(160 15% 16%)",
                          borderRadius: "8px",
                          color: "hsl(150 15% 92%)",
                        }}
                      />
                      <Bar dataKey="supply" fill="hsl(152 60% 42%)" radius={[4, 4, 0, 0]} name="Supply (KT)" />
                      <Bar dataKey="demand" fill="hsl(40 80% 50%)" radius={[4, 4, 0, 0]} name="Demand (KT)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm py-10 text-center">No crop data available.</p>
                )}
              </Card>

              {/* Price changes — derived from supply/demand gap */}
              <Card>
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Supply Gap Indicators
                </h3>
                <div className="space-y-4">
                  {supplyDemand.slice(0, 5).map((item) => {
                    const gap = item.supply - item.demand;
                    const pct = item.demand > 0 ? ((gap / item.demand) * 100) : 0;
                    return (
                      <div key={item.crop} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{item.crop}</div>
                          <div className="text-xs text-muted-foreground">{item.supply} KT supply</div>
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${pct < 0 ? "text-destructive" : "text-primary"}`}>
                          {pct < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                          {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Weather */}
              <Card>
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-primary" /> Weather Forecast
                </h3>
                <div className="space-y-3">
                  {weatherInsights.length > 0 ? weatherInsights.map((w) => (
                    <div key={w.region} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <WeatherIcon type={w.iconType} />
                        <div>
                          <div className="text-sm font-medium">{w.region}</div>
                          <div className="text-xs text-muted-foreground">{w.condition} · {w.temp}</div>
                        </div>
                      </div>
                      <span className="text-xs text-accent-foreground bg-accent px-2 py-1 rounded-md">{w.impact}</span>
                    </div>
                  )) : (
                    <p className="text-muted-foreground text-sm py-4 text-center">No weather data available.</p>
                  )}
                </div>
              </Card>

              {/* Routes */}
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

            {/* Surplus listings */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" /> Live Surplus Listings
                </h3>
                <span className="text-xs text-muted-foreground">Source: data.gov.my crops_district_production</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-left">
                      <th className="pb-3 font-medium">Product</th>
                      <th className="pb-3 font-medium">Quantity</th>
                      <th className="pb-3 font-medium">Producer Region</th>
                      <th className="pb-3 font-medium">State</th>
                      <th className="pb-3 font-medium">Urgency</th>
                      <th className="pb-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {surplusListings.length > 0 ? surplusListings.map((listing) => (
                      <tr key={`${listing.product}-${listing.state}`} className="border-b border-border/50 last:border-0">
                        <td className="py-3 font-medium">{listing.product}</td>
                        <td className="py-3 text-muted-foreground">{listing.qty}</td>
                        <td className="py-3 text-muted-foreground">{listing.supplier}</td>
                        <td className="py-3 text-muted-foreground">{listing.state}</td>
                        <td className="py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            listing.urgency === "high"
                              ? "bg-destructive/10 text-destructive"
                              : listing.urgency === "medium"
                              ? "bg-secondary/10 text-secondary"
                              : "bg-primary/10 text-primary"
                          }`}>
                            {listing.urgency}
                          </span>
                        </td>
                        <td className="py-3">
                          <Button size="sm" variant="outline">Bid</Button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No surplus data available.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
