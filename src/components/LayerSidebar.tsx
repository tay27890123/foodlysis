import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, Wheat, ShoppingCart, ExternalLink, Droplets, Thermometer, Wind } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { statusColors } from "@/components/MalaysiaMap";
import {
  FOOD_CATEGORIES,
  WEATHER_RISK_CONFIG,
  getLayerMetricLabel,
  type DataLayer,
  type StateMetrics,
  type FoodCategory,
  type CategoryData,
} from "@/services/stateLevelData";

const DEFAULT_CAT: CategoryData = { production: 0, demand: 0, cpiIndex: 100, cpiChange: 0, ssl: 0 };

function safeCategories(state: StateMetrics): Record<FoodCategory, CategoryData> {
  if (!state.categories) {
    const empty = {} as Record<FoodCategory, CategoryData>;
    for (const c of FOOD_CATEGORIES) empty[c.id] = DEFAULT_CAT;
    return empty;
  }
  return state.categories;
}
import { supabase } from "@/integrations/supabase/client";

interface LayerSidebarProps {
  selected: StateMetrics | null;
  activeLayer: DataLayer;
  states: StateMetrics[];
  onSelect: (id: string) => void;
}

export default function LayerSidebar({ selected, activeLayer, states, onSelect }: LayerSidebarProps) {
  if (!selected) {
    return (
      <div className="sticky top-20 space-y-4">
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-14 text-muted-foreground">
            <MapPin className="mb-2 h-7 w-7 text-primary/40" />
            <p className="text-sm font-medium">Select a state</p>
            <p className="text-xs mt-1">Click on any state to explore data.</p>
          </CardContent>
        </Card>
        <StateList states={states} onSelect={onSelect} activeLayer={activeLayer} />
      </div>
    );
  }

  return (
    <div className="sticky top-20 space-y-4">
      <AnimatePresence mode="wait">
        <motion.div key={`${selected.id}-${activeLayer}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          {activeLayer === "foodSupply" && <FoodSupplyPanel state={selected} />}
          {activeLayer === "cpi" && <CPIPanel state={selected} />}
          {activeLayer === "ppi" && <PPIPanel state={selected} />}
          {activeLayer === "ssl" && <SSLPanel state={selected} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ── Food Supply Panel ──────────────────────────────────────────────────── */

function FoodSupplyPanel({ state }: { state: StateMetrics }) {
  const totalProd = state.production;
  const totalDem = state.demand;
  const diff = totalProd - totalDem;

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg">{state.name}</CardTitle>
          <StatusBadge status={state.status} />
        </div>
        <p className="text-xs text-muted-foreground">Food Supply Breakdown by Category</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <MiniMetric label="Supply" value={`${totalProd.toLocaleString()}t`} color="text-primary" />
          <MiniMetric label="Demand" value={`${totalDem.toLocaleString()}t`} color="text-destructive" />
          <MiniMetric label="Net" value={`${diff >= 0 ? "+" : ""}${diff.toLocaleString()}t`} color={diff >= 0 ? "text-primary" : "text-destructive"} />
        </div>

        {/* Category breakdown */}
        <div className="space-y-1.5">
          {FOOD_CATEGORIES.map((cat) => {
            const d = safeCategories(state)[cat.id];
            const ratio = d.demand > 0 ? d.production / d.demand : 1;
            const status = ratio >= 1.2 ? "Surplus" : ratio >= 0.8 ? "Balanced" : "Deficit";
            const statusColor = ratio >= 1.2 ? "text-primary" : ratio >= 0.8 ? "text-blue-400" : "text-destructive";
            return (
              <div key={cat.id} className="rounded-md border border-border/30 bg-muted/20 p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    <span>{cat.icon}</span> {cat.label}
                  </span>
                  <span className={`text-[10px] font-bold ${statusColor}`}>{status}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
                  <div className="h-full bg-primary/70 rounded-l-full" style={{ width: `${Math.min((d.production / Math.max(d.production, d.demand)) * 100, 100)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                  <span>Supply: {d.production.toLocaleString()} kg</span>
                  <span>Demand: {d.demand.toLocaleString()} kg</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Key commodities */}
        {state.mainCrops.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Wheat className="h-3 w-3" /> Top Commodities</p>
            <div className="flex flex-wrap gap-1">{state.mainCrops.map((c) => <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>)}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── CPI Panel ──────────────────────────────────────────────────────────── */

function CPIPanel({ state }: { state: StateMetrics }) {
  // Sort categories by CPI change (worst first)
  const sorted = [...FOOD_CATEGORIES].sort((a, b) => safeCategories(state)[b.id].cpiChange - safeCategories(state)[a.id].cpiChange);

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg">{state.name}</CardTitle>
          <Badge variant="outline" className="text-xs border-secondary/60 text-secondary">CPI {state.cpiIndex.toFixed(1)}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Food Consumer Price Index — Category Breakdown</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Aggregate CPI */}
        <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-center">
          <p className="text-xs text-muted-foreground">Aggregate Food CPI</p>
          <p className="text-2xl font-bold text-foreground">{state.cpiIndex.toFixed(1)}</p>
          <p className={`text-sm font-semibold ${state.cpiChange > 0 ? "text-destructive" : "text-primary"}`}>
            {state.cpiChange >= 0 ? "▲" : "▼"} {Math.abs(state.cpiChange).toFixed(1)}% MoM
          </p>
        </div>

        {/* Per-category CPI */}
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Price Pressure by Category</p>
          {sorted.map((cat) => {
            const d = safeCategories(state)[cat.id];
            const isUp = d.cpiChange > 0;
            return (
              <div key={cat.id} className="flex items-center justify-between rounded-md border border-border/30 bg-muted/20 px-2.5 py-1.5">
                <span className="text-xs flex items-center gap-1.5">
                  <span>{cat.icon}</span> {cat.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{d.cpiIndex.toFixed(1)}</span>
                  <span className={`text-xs font-bold min-w-[48px] text-right ${isUp ? "text-destructive" : "text-primary"}`}>
                    {isUp ? "▲" : "▼"}{Math.abs(d.cpiChange).toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Insight */}
        <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-2.5">
          <p className="text-xs text-secondary font-semibold mb-0.5">💡 Price Alert</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {state.cpiChange > 1.5
              ? `${state.name} is experiencing above-average food inflation. ${sorted[0].label} showing highest pressure at +${safeCategories(state)[sorted[0].id].cpiChange.toFixed(1)}% MoM.`
              : `Food prices in ${state.name} remain stable. Overall inflation within acceptable range.`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── PPI Panel ──────────────────────────────────────────────────────────── */

function PPIPanel({ state }: { state: StateMetrics }) {
  // Simulate PPI per category based on CPI with offsets
  const ppiCategories = FOOD_CATEGORIES.map((cat) => {
    const d = safeCategories(state)[cat.id];
    // PPI is typically lower than CPI; simulate realistic offsets
    const ppiOffset: Record<FoodCategory, number> = {
      crops: -15.2, livestock: -10.5, fisheries: -12.8, dairy: -8.3, fruitsVeg: -14.0, processed: -6.5
    };
    const changeOffset: Record<FoodCategory, number> = {
      crops: 0.5, livestock: -0.3, fisheries: 0.8, dairy: -0.2, fruitsVeg: 1.2, processed: -0.4
    };
    const ppi = +(d.cpiIndex + ppiOffset[cat.id]).toFixed(1);
    const ppiChange = +(d.cpiChange + changeOffset[cat.id]).toFixed(1);
    const margin = +(d.cpiIndex - ppi).toFixed(1);
    return { ...cat, ppi, ppiChange, margin };
  }).sort((a, b) => b.ppiChange - a.ppiChange);

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg">{state.name}</CardTitle>
          <Badge variant="outline" className="text-xs border-blue-400/60 text-blue-400">PPI {state.ppiIndex.toFixed(1)}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Food Producer Price Index — Farm-gate price trends</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Aggregate PPI */}
        <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-center">
          <p className="text-xs text-muted-foreground">Aggregate Food PPI</p>
          <p className="text-2xl font-bold text-foreground">{state.ppiIndex.toFixed(1)}</p>
          <p className={`text-sm font-semibold ${state.ppiChange > 0 ? "text-destructive" : "text-primary"}`}>
            {state.ppiChange >= 0 ? "▲" : "▼"} {Math.abs(state.ppiChange).toFixed(1)}% MoM
          </p>
        </div>

        {/* CPI vs PPI comparison */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-border/30 bg-muted/20 p-2 text-center">
            <p className="text-[10px] text-muted-foreground">CPI (Consumer)</p>
            <p className="text-sm font-bold text-foreground">{state.cpiIndex.toFixed(1)}</p>
          </div>
          <div className="rounded-md border border-border/30 bg-muted/20 p-2 text-center">
            <p className="text-[10px] text-muted-foreground">PPI (Producer)</p>
            <p className="text-sm font-bold text-blue-400">{state.ppiIndex.toFixed(1)}</p>
          </div>
          <div className="col-span-2 rounded-md border border-border/30 bg-muted/20 p-2 text-center">
            <p className="text-[10px] text-muted-foreground">CPI-PPI Spread (Middleman Margin)</p>
            <p className="text-sm font-bold text-secondary">{(state.cpiIndex - state.ppiIndex).toFixed(1)} pts</p>
          </div>
        </div>

        {/* Per-category PPI */}
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Producer Price by Category</p>
          {ppiCategories.map((cat) => {
            const isUp = cat.ppiChange > 0;
            return (
              <div key={cat.id} className="flex items-center justify-between rounded-md border border-border/30 bg-muted/20 px-2.5 py-1.5">
                <span className="text-xs flex items-center gap-1.5">
                  <span>{cat.icon}</span> {cat.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{cat.ppi.toFixed(1)}</span>
                  <span className={`text-xs font-bold min-w-[48px] text-right ${isUp ? "text-destructive" : "text-primary"}`}>
                    {isUp ? "▲" : "▼"}{Math.abs(cat.ppiChange).toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Insight */}
        <div className="rounded-lg border border-blue-400/30 bg-blue-400/5 p-2.5">
          <p className="text-xs text-blue-400 font-semibold mb-0.5">🏭 Producer Insight</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {state.ppiChange > 1.5
              ? `Producer costs in ${state.name} are rising sharply (+${state.ppiChange.toFixed(1)}% MoM). This may lead to consumer price increases in the coming weeks.`
              : state.ppiChange < -0.5
              ? `Farm-gate prices in ${state.name} are declining — favorable for buyers. CPI-PPI spread of ${(state.cpiIndex - state.ppiIndex).toFixed(1)} pts suggests room for consumer price reduction.`
              : `Producer prices in ${state.name} remain stable. CPI-PPI spread of ${(state.cpiIndex - state.ppiIndex).toFixed(1)} pts indicates normal market conditions.`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── SSL Panel ──────────────────────────────────────────────────────────── */

function SSLPanel({ state }: { state: StateMetrics }) {
  const overallSSL = state.demand > 0 ? (state.production / state.demand) * 100 : 0;
  const sorted = [...FOOD_CATEGORIES].sort((a, b) => safeCategories(state)[a.id].ssl - safeCategories(state)[b.id].ssl);
  const critical = sorted.filter((c) => safeCategories(state)[c.id].ssl < 80);

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg">{state.name}</CardTitle>
          <Badge variant="outline" className={`text-xs ${overallSSL >= 100 ? "border-primary/60 text-primary" : overallSSL >= 70 ? "border-secondary/60 text-secondary" : "border-destructive/60 text-destructive"}`}>
            SSL {overallSSL.toFixed(0)}%
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">Self-Sufficiency Level — How much food is locally produced</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall gauge */}
        <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Overall Self-Sufficiency</span>
            <span className={`font-bold ${overallSSL >= 100 ? "text-primary" : overallSSL >= 70 ? "text-secondary" : "text-destructive"}`}>{overallSSL.toFixed(1)}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden relative">
            <motion.div
              className={`h-full rounded-full ${overallSSL >= 100 ? "bg-primary" : overallSSL >= 70 ? "bg-secondary" : "bg-destructive"}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(overallSSL, 100)}%` }}
              transition={{ duration: 0.6 }}
            />
            {/* 100% marker */}
            <div className="absolute top-0 h-full w-px bg-foreground/30" style={{ left: "100%" }} />
          </div>
        </div>

        {/* Per-category SSL */}
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">SSL by Food Category</p>
          {FOOD_CATEGORIES.map((cat) => {
            const ssl = safeCategories(state)[cat.id].ssl;
            const color = ssl >= 100 ? "bg-primary" : ssl >= 70 ? "bg-secondary" : "bg-destructive";
            const textColor = ssl >= 100 ? "text-primary" : ssl >= 70 ? "text-secondary" : "text-destructive";
            return (
              <div key={cat.id} className="rounded-md border border-border/30 bg-muted/20 p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs flex items-center gap-1">{cat.icon} {cat.label}</span>
                  <span className={`text-xs font-bold ${textColor}`}>{ssl.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${Math.min(ssl, 100)}%` }} transition={{ duration: 0.5 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Critical alert */}
        {critical.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5">
            <p className="text-xs text-destructive font-semibold mb-0.5 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Import Dependent</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {critical.map((c) => c.label).join(", ")} {critical.length === 1 ? "is" : "are"} below 80% self-sufficiency — relying on imports to meet demand.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Weather Panel ──────────────────────────────────────────────────────── */

function WeatherPanel({ state }: { state: StateMetrics }) {
  const config = WEATHER_RISK_CONFIG[state.weatherRisk];

  // Impact on food categories
  const impactMap: Record<string, { cat: FoodCategory; impact: string; severity: "high" | "medium" | "low" }[]> = {
    danger: [
      { cat: "crops", impact: "Flooding destroys crops; harvesting halted", severity: "high" },
      { cat: "fisheries", impact: "Fishing vessels grounded; supply disrupted", severity: "high" },
      { cat: "livestock", impact: "Feed transport disrupted", severity: "medium" },
      { cat: "fruitsVeg", impact: "Perishables spoilage risk increased", severity: "high" },
    ],
    warning: [
      { cat: "crops", impact: "Delayed harvesting expected", severity: "medium" },
      { cat: "fisheries", impact: "Reduced fishing activity", severity: "medium" },
      { cat: "fruitsVeg", impact: "Quality degradation risk", severity: "medium" },
    ],
    advisory: [
      { cat: "crops", impact: "Monitor soil moisture levels", severity: "low" },
      { cat: "fisheries", impact: "Slight disruption possible", severity: "low" },
    ],
    normal: [],
  };

  const impacts = impactMap[state.weatherRisk] || [];
  const sevColors = { high: "text-destructive", medium: "text-secondary", low: "text-blue-400" };

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg">{state.name}</CardTitle>
          <Badge variant="outline" className="text-xs" style={{ borderColor: config.color, color: config.color }}>
            {config.icon} {config.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">MET Malaysia Weather Assessment</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Weather status card */}
        <div className="rounded-lg border p-4 text-center" style={{ borderColor: `${config.color}40`, background: `${config.color}08` }}>
          <span className="text-4xl block mb-2">{config.icon}</span>
          <p className="text-lg font-bold" style={{ color: config.color }}>{state.weatherLabel}</p>
          <p className="text-xs text-muted-foreground mt-1">Current alert level: <span className="font-semibold" style={{ color: config.color }}>{config.label}</span></p>
        </div>

        {/* Quick metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md border border-border/30 bg-muted/20 p-2 text-center">
            <Thermometer className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-0.5" />
            <p className="text-xs font-bold text-foreground">32°C</p>
            <p className="text-[10px] text-muted-foreground">Temp</p>
          </div>
          <div className="rounded-md border border-border/30 bg-muted/20 p-2 text-center">
            <Droplets className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-0.5" />
            <p className="text-xs font-bold text-foreground">{state.weatherRisk === "danger" ? "95" : state.weatherRisk === "warning" ? "82" : "68"}%</p>
            <p className="text-[10px] text-muted-foreground">Humidity</p>
          </div>
          <div className="rounded-md border border-border/30 bg-muted/20 p-2 text-center">
            <Wind className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-0.5" />
            <p className="text-xs font-bold text-foreground">{state.weatherRisk === "danger" ? "45" : state.weatherRisk === "warning" ? "30" : "12"} km/h</p>
            <p className="text-[10px] text-muted-foreground">Wind</p>
          </div>
        </div>

        {/* Supply chain impact */}
        {impacts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">⚠️ Supply Chain Impact</p>
            {impacts.map((imp) => {
              const cat = FOOD_CATEGORIES.find((c) => c.id === imp.cat)!;
              return (
                <div key={imp.cat} className="flex items-start gap-2 rounded-md border border-border/30 bg-muted/20 p-2">
                  <span className="text-sm mt-0.5">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{cat.label}</p>
                    <p className="text-[10px] text-muted-foreground">{imp.impact}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${sevColors[imp.severity]}`}>{imp.severity}</span>
                </div>
              );
            })}
          </div>
        )}

        {impacts.length === 0 && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
            <p className="text-xs text-primary font-semibold">✅ No weather disruptions</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Supply chains operating normally across all food categories.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Surplus Panel ──────────────────────────────────────────────────────── */

function SurplusPanel({ state }: { state: StateMetrics }) {
  const navigate = useNavigate();

  const { data: liveListingCount = 0 } = useQuery({
    queryKey: ["listing_count", state.name],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("surplus_listings")
        .select("*", { count: "exact", head: true })
        .eq("status", "Active");
      if (error) return state.surplusListings;
      return count ?? state.surplusListings;
    },
    staleTime: 30_000,
  });

  // Mock category distribution for surplus
  const catDist = [
    { cat: "fruitsVeg" as FoodCategory, pct: 35 },
    { cat: "crops" as FoodCategory, pct: 25 },
    { cat: "fisheries" as FoodCategory, pct: 18 },
    { cat: "livestock" as FoodCategory, pct: 12 },
    { cat: "dairy" as FoodCategory, pct: 6 },
    { cat: "processed" as FoodCategory, pct: 4 },
  ];

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg">{state.name}</CardTitle>
          <StatusBadge status={state.status} />
        </div>
        <p className="text-xs text-muted-foreground">Live Marketplace — Surplus Food Listings</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Big number */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
          <p className="text-3xl font-bold text-primary">{liveListingCount}</p>
          <p className="text-xs text-muted-foreground">Active Surplus Listings</p>
          <p className="text-[10px] text-muted-foreground mt-1">Mock listings: {state.surplusListings} | Est. value: RM {(state.surplusListings * 450).toLocaleString()}</p>
        </div>

        {/* Category distribution */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">Surplus by Category</p>
          <div className="flex h-3 rounded-full overflow-hidden border border-border/30">
            {catDist.map((cd) => {
              const cat = FOOD_CATEGORIES.find((c) => c.id === cd.cat)!;
              return <div key={cd.cat} className="h-full" style={{ width: `${cd.pct}%`, background: cat.color }} title={`${cat.label}: ${cd.pct}%`} />;
            })}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
            {catDist.map((cd) => {
              const cat = FOOD_CATEGORIES.find((c) => c.id === cd.cat)!;
              return (
                <span key={cd.cat} className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: cat.color }} />
                  {cat.label} {cd.pct}%
                </span>
              );
            })}
          </div>
        </div>

        {/* Marketplace stats */}
        <div className="grid grid-cols-2 gap-2">
          <MiniMetric label="Avg Discount" value="32%" color="text-primary" />
          <MiniMetric label="Avg Quantity" value="85 kg" color="text-foreground" />
          <MiniMetric label="High Urgency" value={`${Math.round(state.surplusListings * 0.3)}`} color="text-destructive" />
          <MiniMetric label="This Week" value={`+${Math.round(state.surplusListings * 0.4)}`} color="text-primary" />
        </div>

        {/* CTA */}
        <Button size="sm" className="w-full gap-2" onClick={() => navigate(`/match?state=${encodeURIComponent(state.name)}`)}>
          <ExternalLink className="h-3.5 w-3.5" />
          View {state.name} Market
        </Button>
      </CardContent>
    </Card>
  );
}

/* ── State list (no selection) ──────────────────────────────────────────── */

function StateList({ states, onSelect, activeLayer }: { states: StateMetrics[]; onSelect: (id: string) => void; activeLayer: DataLayer }) {
  return (
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
                className="w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 text-foreground"
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
  );
}

/* ── Shared sub-components ──────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const colors = statusColors[status as keyof typeof statusColors];
  if (!colors) return null;
  return (
    <Badge variant="outline" style={{ borderColor: colors.stroke, color: colors.stroke, background: colors.fill }}>
      {colors.label}
    </Badge>
  );
}

function MiniMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-md border border-border/30 bg-muted/20 p-2 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}
