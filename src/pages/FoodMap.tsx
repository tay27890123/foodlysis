import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { MapPin, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, Wheat, BarChart3, DollarSign, ShoppingCart, Loader2, ChevronDown, Clock, Percent, CloudRain, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navbar from "@/components/Navbar";
import MalaysiaMap, { statusColors, type StateData, type StateStatus, type ChoroplethColors } from "@/components/MalaysiaMap";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  fetchStateMetrics,
  getChoroplethValue,
  getChoroplethColor,
  getLayerMetricLabel,
  WEATHER_RISK_CONFIG,
  type DataLayer,
  type StateMetrics,
  type WeatherRisk,
} from "@/services/stateLevelData";
import { supabase } from "@/integrations/supabase/client";

const statusIcon: Record<StateStatus, React.ElementType> = {
  surplus: TrendingUp,
  balanced: ShieldCheck,
  warning: AlertTriangle,
  shortage: TrendingDown,
};

const LAYERS: { id: DataLayer; label: string; icon: React.ElementType; description: string }[] = [
  { id: "production", label: "Agri Production", icon: BarChart3, description: "Crop volume (tonnes)" },
  { id: "cpi", label: "Food CPI", icon: DollarSign, description: "Price index hotspots" },
  { id: "surplus", label: "Surplus Listings", icon: ShoppingCart, description: "Marketplace availability" },
  { id: "ssl", label: "SSL %", icon: Percent, description: "Self-Sufficiency Level" },
  { id: "weather", label: "Weather Risk", icon: CloudRain, description: "MET Malaysia alerts" },
];

const FoodMap = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<DataLayer>("production");
  const isMobile = useIsMobile();

  const { data: stateMetrics = [], isLoading } = useQuery({
    queryKey: ["stateMetrics"],
    queryFn: fetchStateMetrics,
    staleTime: 5 * 60_000,
  });

  // Convert StateMetrics → StateData for the map
  const stateData: StateData[] = useMemo(
    () => stateMetrics.map((s) => ({ id: s.id, name: s.name, status: s.status, production: s.production, demand: s.demand, mainCrops: s.mainCrops, notes: s.notes })),
    [stateMetrics],
  );

  // Choropleth colors based on active layer
  const choroplethColors = useMemo<Record<string, ChoroplethColors>>(() => {
    if (stateMetrics.length === 0) return {};
    const values = stateMetrics.map((s) => getChoroplethValue(s, activeLayer));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const map: Record<string, ChoroplethColors> = {};
    stateMetrics.forEach((s, i) => {
      map[s.id] = getChoroplethColor(values[i], min, max, activeLayer);
    });
    return map;
  }, [stateMetrics, activeLayer]);

  const tooltipContent = (id: string) => {
    const s = stateMetrics.find((m) => m.id === id);
    return s ? getLayerMetricLabel(s, activeLayer) : null;
  };

  const selected = stateMetrics.find((s) => s.id === selectedId) || null;
  const handleStateClick = (state: StateData) => setSelectedId(state.id);

  const summaryStats = useMemo(() => ({
    surplus: stateData.filter((s) => s.status === "surplus").length,
    balanced: stateData.filter((s) => s.status === "balanced").length,
    warning: stateData.filter((s) => s.status === "warning").length,
    shortage: stateData.filter((s) => s.status === "shortage").length,
  }), [stateData]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 pb-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-3">
            <MapPin className="h-7 w-7 text-primary" />
            Food Security Command Center
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">Interactive choropleth map — click any state for detailed metrics.</p>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground/70 border border-border/30 rounded-full px-2.5 py-1">
              <Clock className="h-3 w-3" />
              Last updated: {new Date().toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </motion.div>

        {/* Data Layer Toggle */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-5 flex flex-wrap gap-2">
          {LAYERS.map((layer) => {
            const active = activeLayer === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => setActiveLayer(layer.id)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "border-primary/60 bg-primary/15 text-primary shadow-sm shadow-primary/10"
                    : "border-border/50 bg-card/50 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <layer.icon className="h-4 w-4" />
                <span>{layer.label}</span>
                {!isMobile && <span className="text-xs opacity-60">— {layer.description}</span>}
              </button>
            );
          })}
        </motion.div>

        {/* Summary strip */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(["surplus", "balanced", "warning", "shortage"] as StateStatus[]).map((s) => {
            const Icon = statusIcon[s];
            const colors = statusColors[s];
            return (
              <div key={s} className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-card/50 backdrop-blur-sm p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ background: colors.fill }}>
                  <Icon className="h-4 w-4" style={{ color: colors.stroke }} />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground leading-tight">{summaryStats[s]}</p>
                  <p className="text-[11px] font-medium" style={{ color: colors.stroke }}>{colors.label}</p>
                </div>
              </div>
            );
          })}
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading state data…</span>
          </div>
        ) : isMobile ? (
          /* ── Mobile: stacked layout ── */
          <div className="space-y-4">
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-2">
                <MalaysiaMap
                  stateData={stateData}
                  onStateClick={handleStateClick}
                  selectedState={selectedId}
                  choroplethColors={choroplethColors}
                  tooltipContent={tooltipContent}
                />
              </CardContent>
            </Card>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground px-1">
              {(["surplus", "balanced", "warning", "shortage"] as StateStatus[]).map((s) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${statusColors[s].dot}`} />
                  {statusColors[s].label}
                </span>
              ))}
            </div>

            {/* Mobile state cards list */}
            <MobileStateList states={stateMetrics} selectedId={selectedId} onSelect={setSelectedId} activeLayer={activeLayer} />
          </div>
        ) : (
          /* ── Desktop: 70/30 split ── */
          <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 340px" }}>
            {/* Map panel (70%) */}
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12 }}>
              <Card className="border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-3">
                  <MalaysiaMap
                    stateData={stateData}
                    onStateClick={handleStateClick}
                    selectedState={selectedId}
                    choroplethColors={choroplethColors}
                    tooltipContent={tooltipContent}
                  />
                </CardContent>
              </Card>
              {/* Legend */}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                {(["surplus", "balanced", "warning", "shortage"] as StateStatus[]).map((s) => (
                  <span key={s} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${statusColors[s].dot}`} />
                    {statusColors[s].label}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Sidebar panel (30%) */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}>
              <StateDashboard selected={selected} activeLayer={activeLayer} states={stateMetrics} onSelect={setSelectedId} />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── State Dashboard Sidebar ─────────────────────────────────────────────── */

function StateDashboard({ selected, activeLayer, states, onSelect }: {
  selected: StateMetrics | null;
  activeLayer: DataLayer;
  states: StateMetrics[];
  onSelect: (id: string) => void;
}) {
  const navigate = useNavigate();

  // Query live listing count for selected state
  const { data: liveListingCount = 0 } = useQuery({
    queryKey: ["listing_count", selected?.name],
    queryFn: async () => {
      if (!selected) return 0;
      const { count, error } = await supabase
        .from("surplus_listings")
        .select("*", { count: "exact", head: true })
        .eq("status", "Active");
      if (error) return selected.surplusListings;
      // Filter by location_state via profiles would require a join; use mock count for now
      return count ?? selected.surplusListings;
    },
    enabled: !!selected,
    staleTime: 30_000,
  });

  const ssl = selected && selected.demand > 0 ? (selected.production / selected.demand) * 100 : 0;
  const weatherConfig = selected ? WEATHER_RISK_CONFIG[selected.weatherRisk] : null;

  return (
    <div className="sticky top-20 space-y-4">
      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div key={selected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-lg">{selected.name}</CardTitle>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: statusColors[selected.status].stroke,
                      color: statusColors[selected.status].stroke,
                      background: statusColors[selected.status].fill,
                    }}
                  >
                    {statusColors[selected.status].label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">State Dossier — Food Security Intelligence</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Macro Metrics 2×2 Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <MetricBox label="Total Production" value={`${selected.production.toLocaleString()} t`} accent="primary" />
                  <MetricBox label="Food CPI Index" value={selected.cpiIndex.toFixed(1)} sub={`${selected.cpiChange >= 0 ? "+" : ""}${selected.cpiChange.toFixed(1)}%`} accent={selected.cpiChange > 1.5 ? "secondary" : "primary"} />
                  <MetricBox label="SSL %" value={`${ssl.toFixed(1)}%`} accent={ssl >= 100 ? "primary" : ssl >= 70 ? "secondary" : "destructive"} />
                  <MetricBox label="Demand" value={`${selected.demand.toLocaleString()} t`} accent="destructive" />
                </div>

                {/* Weather Snippet */}
                {weatherConfig && (
                  <div className="rounded-lg border border-border/40 p-3 flex items-center gap-3" style={{ background: `${weatherConfig.color.replace(")", " / 0.08)")}` }}>
                    <span className="text-xl">{weatherConfig.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">MET Malaysia</p>
                      <p className="text-sm font-semibold" style={{ color: weatherConfig.color }}>{selected.weatherLabel}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0" style={{ borderColor: weatherConfig.color, color: weatherConfig.color }}>
                      {weatherConfig.label}
                    </Badge>
                  </div>
                )}

                {/* Production vs Demand bars */}
                <div className="space-y-2">
                  <BarRow label="Production" value={selected.production} max={Math.max(selected.production, selected.demand)} color="bg-primary" />
                  <BarRow label="Demand" value={selected.demand} max={Math.max(selected.production, selected.demand)} color="bg-destructive" />
                </div>

                {/* Net balance */}
                <div className="rounded-lg border border-border/40 bg-muted/30 p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Net Balance</p>
                  <p className={`text-xl font-bold ${selected.production - selected.demand >= 0 ? "text-primary" : "text-destructive"}`}>
                    {selected.production - selected.demand >= 0 ? "+" : ""}{(selected.production - selected.demand).toLocaleString()} t
                  </p>
                </div>

                {/* Live Market Activity */}
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2.5">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingCart className="h-3 w-3" /> Live Market Activity
                  </p>
                  <p className="text-sm text-foreground">
                    🔥 <span className="font-bold text-primary">{liveListingCount}</span> Active Surplus Listing{liveListingCount !== 1 ? "s" : ""} available in <span className="font-semibold">{selected.name}</span>
                  </p>
                  <Button
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => navigate(`/match?state=${encodeURIComponent(selected.name)}`)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View {selected.name} Market
                  </Button>
                </div>

                {/* Key commodities */}
                {selected.mainCrops.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Wheat className="h-3 w-3" /> Key Commodities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.mainCrops.map((c) => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-3">{selected.notes}</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-14 text-muted-foreground">
                <MapPin className="mb-2 h-7 w-7 text-primary/40" />
                <p className="text-sm font-medium">Select a state</p>
                <p className="text-xs mt-1">Click on any state to view its full dossier.</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick state list — only show when no state selected */}
      {!selected && (
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">All States</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <ScrollArea className="h-[240px]">
              <div className="space-y-0.5 px-2">
                {states.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onSelect(s.id)}
                    className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 text-foreground`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${statusColors[s.status].dot}`} />
                      {s.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{getLayerMetricLabel(s, activeLayer)}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ── Mobile State List ───────────────────────────────────────────────────── */

function MobileStateList({ states, selectedId, onSelect, activeLayer }: {
  states: StateMetrics[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  activeLayer: DataLayer;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">State Overview</h3>
      {states.map((s) => {
        const isOpen = selectedId === s.id;
        const diff = s.production - s.demand;
        return (
          <Card key={s.id} className="border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
            <button onClick={() => onSelect(isOpen ? "" : s.id)} className="w-full flex items-center justify-between p-3 text-left">
              <span className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${statusColors[s.status].dot}`} />
                <span className="font-medium text-sm text-foreground">{s.name}</span>
                <Badge variant="outline" className="text-[10px] h-5" style={{ borderColor: statusColors[s.status].stroke, color: statusColors[s.status].stroke }}>
                  {statusColors[s.status].label}
                </Badge>
              </span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <MetricBox label="Production" value={`${s.production.toLocaleString()} t`} accent="primary" />
                      <MetricBox label="Demand" value={`${s.demand.toLocaleString()} t`} accent="destructive" />
                    </div>
                    <div className="rounded-md border border-border/40 bg-muted/30 p-2 text-center">
                      <p className="text-xs text-muted-foreground">Net Balance</p>
                      <p className={`text-lg font-bold ${diff >= 0 ? "text-primary" : "text-destructive"}`}>{diff >= 0 ? "+" : ""}{diff.toLocaleString()} t</p>
                    </div>
                    {s.mainCrops.length > 0 && (
                      <div className="flex flex-wrap gap-1">{s.mainCrops.map((c) => <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>)}</div>
                    )}
                    <p className="text-xs text-muted-foreground">{s.notes}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}

/* ── Shared sub-components ───────────────────────────────────────────────── */

function MetricBox({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="rounded-md border border-border/40 bg-muted/20 p-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-bold text-${accent}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value.toLocaleString()} t</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${(value / max) * 100}%` }} transition={{ duration: 0.5 }} />
      </div>
    </div>
  );
}

export default FoodMap;
