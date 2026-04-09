import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { MapPin, BarChart3, DollarSign, Loader2, Info, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MalaysiaMap, { statusColors, type StateData, type StateStatus, type ChoroplethColors } from "@/components/MalaysiaMap";
import { useIsMobile } from "@/hooks/use-mobile";

// ── Types ───────────────────────────────────────────────────────────────────────
interface PriceCatcherItem {
  date: string;
  premise: string;
  premise_type: string;
  state: string;
  district: string;
  item: string;
  item_group: string;
  item_category: string;
  unit: string;
  price: number;
}

interface StatePrice {
  id: string;
  name: string;
  avgPrice: number;
  itemCount: number;
  cheapest: string;
  expensive: string;
  status: StateStatus;
  items: { name: string; avg: number }[];
}

const STATE_ID_MAP: Record<string, { id: string; name: string }> = {
  "Perlis": { id: "perlis", name: "Perlis" },
  "Kedah": { id: "kedah", name: "Kedah" },
  "Pulau Pinang": { id: "penang", name: "Penang" },
  "Perak": { id: "perak", name: "Perak" },
  "Kelantan": { id: "kelantan", name: "Kelantan" },
  "Terengganu": { id: "terengganu", name: "Terengganu" },
  "Pahang": { id: "pahang", name: "Pahang" },
  "Selangor": { id: "selangor", name: "Selangor" },
  "W.P. Kuala Lumpur": { id: "kl", name: "KL" },
  "Negeri Sembilan": { id: "negeriSembilan", name: "N. Sembilan" },
  "Melaka": { id: "melaka", name: "Melaka" },
  "Johor": { id: "johor", name: "Johor" },
  "Sabah": { id: "sabah", name: "Sabah" },
  "Sarawak": { id: "sarawak", name: "Sarawak" },
  "W.P. Labuan": { id: "labuan", name: "Labuan" },
  "W.P. Putrajaya": { id: "putrajaya", name: "Putrajaya" },
};

// ── Fetch real OpenDOSM price data ──────────────────────────────────────────────
async function fetchPriceData(): Promise<StatePrice[]> {
  const res = await fetch(
    "https://api.data.gov.my/data-catalogue?id=pricecatcher_item&limit=2000&sort=-date"
  );
  if (!res.ok) throw new Error("Failed to fetch price data");
  const data: PriceCatcherItem[] = await res.json();

  // Group by state
  const byState = new Map<string, PriceCatcherItem[]>();
  data.forEach((item) => {
    if (!byState.has(item.state)) byState.set(item.state, []);
    byState.get(item.state)!.push(item);
  });

  const results: StatePrice[] = [];
  const allAvgs: number[] = [];

  byState.forEach((items, stateName) => {
    const mapping = STATE_ID_MAP[stateName];
    if (!mapping) return;

    // Average price per item
    const itemPrices = new Map<string, number[]>();
    items.forEach((i) => {
      if (!itemPrices.has(i.item)) itemPrices.set(i.item, []);
      itemPrices.get(i.item)!.push(i.price);
    });

    const itemAvgs = [...itemPrices.entries()].map(([name, prices]) => ({
      name,
      avg: prices.reduce((s, p) => s + p, 0) / prices.length,
    }));

    const totalAvg = items.reduce((s, i) => s + i.price, 0) / items.length;
    allAvgs.push(totalAvg);

    const sorted = [...itemAvgs].sort((a, b) => a.avg - b.avg);
    results.push({
      id: mapping.id,
      name: mapping.name,
      avgPrice: totalAvg,
      itemCount: itemPrices.size,
      cheapest: sorted[0]?.name || "—",
      expensive: sorted[sorted.length - 1]?.name || "—",
      status: "balanced", // will be computed below
      items: sorted.slice(0, 5),
    });
  });

  // Classify status by price level
  if (allAvgs.length > 0) {
    const median = [...allAvgs].sort((a, b) => a - b)[Math.floor(allAvgs.length / 2)];
    results.forEach((s) => {
      if (s.avgPrice < median * 0.85) s.status = "surplus";
      else if (s.avgPrice < median * 1.05) s.status = "balanced";
      else if (s.avgPrice < median * 1.2) s.status = "warning";
      else s.status = "shortage";
    });
  }

  return results;
}

// ── Fallback simulated data ─────────────────────────────────────────────────────
const FALLBACK_DATA: StatePrice[] = [
  { id: "perlis", name: "Perlis", avgPrice: 3.2, itemCount: 45, cheapest: "Kangkung", expensive: "Chili Padi", status: "surplus", items: [] },
  { id: "kedah", name: "Kedah", avgPrice: 3.0, itemCount: 62, cheapest: "Rice", expensive: "Chicken", status: "surplus", items: [] },
  { id: "penang", name: "Penang", avgPrice: 4.8, itemCount: 80, cheapest: "Kangkung", expensive: "Beef", status: "warning", items: [] },
  { id: "perak", name: "Perak", avgPrice: 3.5, itemCount: 70, cheapest: "Tomato", expensive: "Chili", status: "balanced", items: [] },
  { id: "kelantan", name: "Kelantan", avgPrice: 4.2, itemCount: 55, cheapest: "Rice", expensive: "Seafood", status: "warning", items: [] },
  { id: "terengganu", name: "Terengganu", avgPrice: 3.8, itemCount: 48, cheapest: "Fish", expensive: "Chicken", status: "balanced", items: [] },
  { id: "pahang", name: "Pahang", avgPrice: 3.3, itemCount: 65, cheapest: "Durian", expensive: "Beef", status: "surplus", items: [] },
  { id: "selangor", name: "Selangor", avgPrice: 5.1, itemCount: 90, cheapest: "Cabbage", expensive: "Lamb", status: "shortage", items: [] },
  { id: "kl", name: "KL", avgPrice: 5.5, itemCount: 95, cheapest: "Eggs", expensive: "Imported Beef", status: "shortage", items: [] },
  { id: "negeriSembilan", name: "N. Sembilan", avgPrice: 3.6, itemCount: 50, cheapest: "Pineapple", expensive: "Chicken", status: "balanced", items: [] },
  { id: "melaka", name: "Melaka", avgPrice: 3.7, itemCount: 45, cheapest: "Fish", expensive: "Prawn", status: "balanced", items: [] },
  { id: "johor", name: "Johor", avgPrice: 3.9, itemCount: 75, cheapest: "Palm Oil", expensive: "Beef", status: "balanced", items: [] },
  { id: "sabah", name: "Sabah", avgPrice: 4.5, itemCount: 60, cheapest: "Rice", expensive: "Chicken", status: "warning", items: [] },
  { id: "sarawak", name: "Sarawak", avgPrice: 3.4, itemCount: 58, cheapest: "Pepper", expensive: "Beef", status: "surplus", items: [] },
  { id: "labuan", name: "Labuan", avgPrice: 5.0, itemCount: 30, cheapest: "Fish", expensive: "Vegetables", status: "shortage", items: [] },
];

// ── Legend Component ────────────────────────────────────────────────────────────
const Legend = () => (
  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
    <span className="font-medium text-foreground">Price Level:</span>
    {([
      { label: "Low (Affordable)", color: "bg-[hsl(152_60%_42%)]" },
      { label: "Moderate", color: "bg-[hsl(80_50%_45%)]" },
      { label: "High", color: "bg-[hsl(40_70%_50%)]" },
      { label: "Very High", color: "bg-[hsl(0_65%_50%)]" },
    ]).map(l => (
      <span key={l.label} className="flex items-center gap-1.5">
        <span className={`h-3 w-3 rounded-sm ${l.color}`} /> {l.label}
      </span>
    ))}
  </div>
);

// ── State Detail Panel ──────────────────────────────────────────────────────────
const StateDetail = ({ state }: { state: StatePrice | null }) => {
  if (!state) return (
    <div className="glass-card p-6 text-center text-muted-foreground">
      <MapPin className="h-8 w-8 mx-auto mb-2 text-primary/30" />
      <p className="text-sm">Click a state on the map to see price details</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={state.id} className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">{state.name}</h3>
        <Badge variant="outline" className={`text-xs`}>
          {statusColors[state.status].label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Avg Price</p>
          <p className="font-display text-xl font-bold text-primary">RM {state.avgPrice.toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Items Tracked</p>
          <p className="font-display text-xl font-bold">{state.itemCount}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Price Range</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-primary">🟢 Cheapest: {state.cheapest}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-destructive">🔴 Most Expensive: {state.expensive}</span>
        </div>
      </div>

      {state.items.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Top Items by Price</p>
          <div className="space-y-1.5">
            {state.items.map(item => (
              <div key={item.name} className="flex items-center justify-between text-sm rounded-md bg-muted/20 px-3 py-1.5">
                <span className="truncate">{item.name}</span>
                <span className="font-medium text-primary">RM {item.avg.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ── Main Page ───────────────────────────────────────────────────────────────────
const FoodDataMap = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const { data: stateData, isLoading, error } = useQuery({
    queryKey: ["openDOSM_prices"],
    queryFn: fetchPriceData,
    staleTime: 10 * 60_000,
    retry: 1,
  });

  const priceData = stateData && stateData.length > 0 ? stateData : FALLBACK_DATA;
  const usingFallback = !stateData || stateData.length === 0;

  const mapStateData: StateData[] = useMemo(
    () => priceData.map(s => ({
      id: s.id,
      name: s.name,
      status: s.status,
      production: Math.round(1000 / s.avgPrice),
      demand: 100,
      mainCrops: [s.cheapest],
      notes: `Avg RM${s.avgPrice.toFixed(2)}/item`,
    })),
    [priceData],
  );

  const choroplethColors = useMemo<Record<string, ChoroplethColors>>(() => {
    const values = priceData.map(s => s.avgPrice);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const map: Record<string, ChoroplethColors> = {};
    priceData.forEach(s => {
      const t = max === min ? 0.5 : (s.avgPrice - min) / (max - min);
      const hue = 152 - t * 152; // green (low price) → red (high price)
      map[s.id] = {
        fill: `hsl(${hue} 60% 32% / 0.5)`,
        stroke: `hsl(${hue} 60% 50% / 0.9)`,
      };
    });
    return map;
  }, [priceData]);

  const tooltipContent = (id: string) => {
    const s = priceData.find(p => p.id === id);
    return s ? `RM ${s.avgPrice.toFixed(2)} avg · ${s.itemCount} items` : null;
  };

  const selected = priceData.find(s => s.id === selectedId) || null;

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20 px-4 pb-8 max-w-[1600px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-3">
            <MapPin className="h-7 w-7 text-primary" /> Food Data Map
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real price data from OpenDOSM PriceCatcher — states colored by price level
          </p>
          {usingFallback && (
            <div className="mt-2 flex items-center gap-2 text-xs text-secondary">
              <AlertTriangle className="h-3.5 w-3.5" />
              Using simulated data — API may be unavailable
            </div>
          )}
        </motion.div>

        {/* Legend */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="mb-5 glass-card p-3">
          <Legend />
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Fetching price data from OpenDOSM…</span>
          </div>
        ) : isMobile ? (
          <div className="space-y-4">
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-2">
                <MalaysiaMap
                  stateData={mapStateData}
                  onStateClick={(s) => setSelectedId(s.id)}
                  selectedState={selectedId}
                  choroplethColors={choroplethColors}
                  tooltipContent={tooltipContent}
                />
              </CardContent>
            </Card>
            <StateDetail state={selected} />
          </div>
        ) : (
          <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 360px" }}>
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
              <Card className="border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-3">
                  <MalaysiaMap
                    stateData={mapStateData}
                    onStateClick={(s) => setSelectedId(s.id)}
                    selectedState={selectedId}
                    choroplethColors={choroplethColors}
                    tooltipContent={tooltipContent}
                  />
                </CardContent>
              </Card>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <Legend />
                <span className="text-[10px] text-muted-foreground/40 italic">Source: OpenDOSM PriceCatcher API</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <StateDetail state={selected} />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodDataMap;
