import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { MapPin, BarChart3, DollarSign, ShoppingCart, Loader2, ChevronDown, Clock, Percent, CloudRain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MalaysiaMap, { statusColors, type StateData, type StateStatus, type ChoroplethColors } from "@/components/MalaysiaMap";
import LayerSidebar from "@/components/LayerSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  fetchStateMetrics,
  getChoroplethValue,
  getChoroplethColor,
  getLayerMetricLabel,
  getLayerSummaryCards,
  FOOD_CATEGORIES,
  type DataLayer,
  type StateMetrics,
} from "@/services/stateLevelData";

const statusIcon: Record<StateStatus, React.ElementType> = {
  surplus: BarChart3,
  balanced: BarChart3,
  warning: BarChart3,
  shortage: BarChart3,
};

const LAYERS: { id: DataLayer; label: string; icon: React.ElementType; description: string }[] = [
  { id: "foodSupply", label: "Food Supply", icon: BarChart3, description: "Full supply-demand by category" },
  { id: "cpi", label: "Food CPI", icon: DollarSign, description: "Price index & inflation" },
  { id: "ssl", label: "SSL %", icon: Percent, description: "Self-Sufficiency Level" },
  { id: "weather", label: "Weather Risk", icon: CloudRain, description: "MET Malaysia alerts" },
  { id: "surplus", label: "Surplus Listings", icon: ShoppingCart, description: "Marketplace activity" },
];

const FoodMap = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<DataLayer>("foodSupply");
  const isMobile = useIsMobile();

  const { data: stateMetrics = [], isLoading } = useQuery({
    queryKey: ["stateMetrics"],
    queryFn: fetchStateMetrics,
    staleTime: 5 * 60_000,
  });

  const stateData: StateData[] = useMemo(
    () => stateMetrics.map((s) => ({ id: s.id, name: s.name, status: s.status, production: s.production, demand: s.demand, mainCrops: s.mainCrops, notes: s.notes })),
    [stateMetrics],
  );

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

  const summaryCards = useMemo(() => getLayerSummaryCards(stateMetrics, activeLayer), [stateMetrics, activeLayer]);

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20 px-4 pb-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-3">
            <MapPin className="h-7 w-7 text-primary" />
            Food Security Command Center
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">Interactive food supply intelligence — click any state for category-level analysis.</p>
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
                onClick={() => { setActiveLayer(layer.id); setSelectedId(null); }}
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

        {/* Summary strip — layer-aware */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} key={activeLayer} className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {summaryCards.map((card) => (
            <div key={card.key} className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-card/50 backdrop-blur-sm p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ background: card.fill }}>
                <span className="text-sm">{card.icon}</span>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground leading-tight">{card.count}</p>
                <p className="text-[11px] font-medium" style={{ color: card.stroke }}>{card.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading state data…</span>
          </div>
        ) : isMobile ? (
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
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground px-1">
              {(["surplus", "balanced", "warning", "shortage"] as StateStatus[]).map((s) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${statusColors[s].dot}`} />
                  {statusColors[s].label}
                </span>
              ))}
            </div>
            {/* Mobile: show sidebar content below map */}
            <LayerSidebar selected={selected} activeLayer={activeLayer} states={stateMetrics} onSelect={setSelectedId} />
          </div>
        ) : (
          <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 360px" }}>
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
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                {(["surplus", "balanced", "warning", "shortage"] as StateStatus[]).map((s) => (
                  <span key={s} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${statusColors[s].dot}`} />
                    {statusColors[s].label}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}>
              <LayerSidebar selected={selected} activeLayer={activeLayer} states={stateMetrics} onSelect={setSelectedId} />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodMap;
