import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Cloud, Sun, CloudRain, Thermometer, Wind,
  Truck, MapPin, TrendingUp, TrendingDown,
  Package, Leaf, ArrowLeft, BarChart3, RefreshCw, Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import {
  useCropProduction,
  useWeatherForecast,
  useRefreshAll,
  groupByCropType,
  toSurplusListings,
  toWeatherInsights,
} from "@/hooks/useLiveData";

const routeData = [
  { route: "CH→KL", distance: "205km", time: "3.5h", status: "clear", savings: "12%" },
  { route: "Ipoh→PG", distance: "170km", time: "2.8h", status: "rain", savings: "8%" },
  { route: "JB→ML", distance: "320km", time: "4.2h", status: "clear", savings: "18%" },
  { route: "KB→KT", distance: "165km", time: "2.5h", status: "clear", savings: "10%" },
];

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`glass-card p-5 ${className}`}>{children}</div>
);

const Dashboard = () => {
  const cropQuery = useCropProduction();
  const weatherQuery = useWeatherForecast();
  const refreshAll = useRefreshAll();

  const isLoading = cropQuery.isLoading || weatherQuery.isLoading;
  const isRefetching = cropQuery.isRefetching || weatherQuery.isRefetching;

  // Transformed data
  const cropSummary = cropQuery.data ? groupByCropType(cropQuery.data) : [];
  const surplusListings = cropQuery.data ? toSurplusListings(cropQuery.data) : [];
  const weatherInsights = weatherQuery.data ? toWeatherInsights(weatherQuery.data) : [];

  // Chart data: top 8 crops by production
  const chartData = cropSummary.slice(0, 8).map((c) => ({
    name: c.label.length > 12 ? c.label.slice(0, 12) + "…" : c.label,
    production: Math.round(c.totalProduction / 1000),
    area: Math.round(c.totalArea / 1000),
  }));

  // Stats
  const totalProduction = cropSummary.reduce((s, c) => s + c.totalProduction, 0);
  const totalCrops = cropSummary.length;
  const rainyLocations = weatherInsights.filter((w) => w.isRain).length;

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
              className="gap-2"
              onClick={refreshAll}
              disabled={isRefetching}
            >
              {isRefetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
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
            Live data from data.gov.my — auto-refreshes daily (weather) &amp; weekly (crops)
          </p>
        </motion.div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Production", value: isLoading ? "…" : `${(totalProduction / 1e6).toFixed(1)}M t`, icon: Package, change: "" },
            { label: "Crop Types", value: isLoading ? "…" : String(totalCrops), icon: Leaf, change: "" },
            { label: "Weather Alerts", value: isLoading ? "…" : `${rainyLocations} rain`, icon: CloudRain, change: rainyLocations > 2 ? "⚠" : "" },
            { label: "Locations", value: isLoading ? "…" : String(weatherInsights.length), icon: MapPin, change: "" },
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
                    <span className="text-xs text-secondary font-medium">{stat.change}</span>
                  )}
                </div>
                <div className="font-display text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Supply vs Demand chart → now grouped crop production */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Production by Crop Type (×1000 t)
              </h3>
              <span className="text-xs text-muted-foreground">
                {cropQuery.dataUpdatedAt
                  ? `Updated ${new Date(cropQuery.dataUpdatedAt).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })}`
                  : "Loading…"}
              </span>
            </div>
            {cropQuery.isLoading ? (
              <div className="flex items-center justify-center h-[240px] text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Fetching crop data…
              </div>
            ) : cropQuery.isError ? (
              <div className="flex items-center justify-center h-[240px] text-destructive text-sm">
                Failed to load crop data. Click Refresh to retry.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--card-foreground))",
                    }}
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString()}K tonnes`,
                      name === "production" ? "Production" : "Planted Area",
                    ]}
                  />
                  <Bar dataKey="production" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="area" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Top crops quick list */}
          <Card>
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Top Crops
            </h3>
            <div className="space-y-4">
              {cropSummary.slice(0, 5).map((crop) => (
                <div key={crop.crop_type} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{crop.label}</div>
                    <div className="text-xs text-muted-foreground">{crop.totalArea.toLocaleString()} ha</div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-primary">
                    <TrendingUp className="h-3 w-3" />
                    {(crop.totalProduction / 1000).toFixed(0)}K t
                  </div>
                </div>
              ))}
              {cropSummary.length === 0 && !cropQuery.isLoading && (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Weather */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <Cloud className="h-4 w-4 text-primary" /> Weather Forecast
              </h3>
              <span className="text-xs text-muted-foreground">
                {weatherQuery.dataUpdatedAt
                  ? `Updated ${new Date(weatherQuery.dataUpdatedAt).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })}`
                  : ""}
              </span>
            </div>
            {weatherQuery.isLoading ? (
              <div className="flex items-center justify-center h-[180px] text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Fetching weather…
              </div>
            ) : weatherQuery.isError ? (
              <div className="text-sm text-destructive">Failed to load weather data.</div>
            ) : (
              <div className="space-y-3">
                {weatherInsights.map((w) => (
                  <div key={w.location} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      {w.isRain ? (
                        <CloudRain className="h-5 w-5 text-secondary" />
                      ) : (
                        <Sun className="h-5 w-5 text-secondary" />
                      )}
                      <div>
                        <div className="text-sm font-medium">{w.location}</div>
                        <div className="text-xs text-muted-foreground">{w.condition} · {w.temp}</div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-md ${
                      w.isRain ? "bg-secondary/10 text-secondary" : "bg-accent text-accent-foreground"
                    }`}>
                      {w.impact}
                    </span>
                  </div>
                ))}
              </div>
            )}
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

        {/* Surplus listings — bound to FetchCropProduction */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Crop Production Listings (Live)
            </h3>
            <span className="text-xs text-muted-foreground">{surplusListings.length} records</span>
          </div>
          {cropQuery.isLoading ? (
            <div className="flex items-center justify-center h-[100px] text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-left">
                    <th className="pb-3 font-medium">Crop</th>
                    <th className="pb-3 font-medium">State</th>
                    <th className="pb-3 font-medium">District</th>
                    <th className="pb-3 font-medium">Production</th>
                    <th className="pb-3 font-medium">Area</th>
                  </tr>
                </thead>
                <tbody>
                  {surplusListings.map((listing, i) => (
                    <tr key={`${listing.product}-${listing.district}-${i}`} className="border-b border-border/50 last:border-0">
                      <td className="py-3 font-medium">{listing.product}</td>
                      <td className="py-3 text-muted-foreground">{listing.state}</td>
                      <td className="py-3 text-muted-foreground">{listing.district}</td>
                      <td className="py-3">{listing.qty}</td>
                      <td className="py-3 text-muted-foreground">{listing.area}</td>
                    </tr>
                  ))}
                  {surplusListings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">No production data available</td>
                    </tr>
                  )}
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
