import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, TrendingUp, TrendingDown, AlertTriangle, Wheat, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import MalaysiaMap, { statusColors, type StateData, type StateStatus } from "@/components/MalaysiaMap";

const stateData: StateData[] = [
  { id: "perlis", name: "Perlis", status: "balanced", production: 320, demand: 300, mainCrops: ["Rice", "Sugar Cane"], notes: "Stable rice output this quarter." },
  { id: "kedah", name: "Kedah", status: "surplus", production: 4800, demand: 2900, mainCrops: ["Rice", "Rubber"], notes: "Major rice bowl – surplus exported to deficit states." },
  { id: "penang", name: "Penang", status: "shortage", production: 280, demand: 1200, mainCrops: ["Vegetables"], notes: "High urban demand outstrips local production." },
  { id: "perak", name: "Perak", status: "surplus", production: 3600, demand: 2800, mainCrops: ["Palm Oil", "Vegetables", "Fruits"], notes: "Strong palm oil and vegetable output." },
  { id: "kelantan", name: "Kelantan", status: "warning", production: 1800, demand: 2100, mainCrops: ["Rice", "Tobacco"], notes: "Flood risk affecting monsoon rice crop." },
  { id: "terengganu", name: "Terengganu", status: "warning", production: 1200, demand: 1500, mainCrops: ["Fish", "Rice"], notes: "East coast monsoon disrupting supply chains." },
  { id: "pahang", name: "Pahang", status: "surplus", production: 4200, demand: 2400, mainCrops: ["Palm Oil", "Durian", "Rubber"], notes: "Large agricultural base with durian export boom." },
  { id: "selangor", name: "Selangor", status: "shortage", production: 1500, demand: 5800, mainCrops: ["Vegetables", "Poultry"], notes: "Densely populated – relies heavily on inter-state supply." },
  { id: "kl", name: "KL", status: "shortage", production: 50, demand: 3200, mainCrops: [], notes: "Fully dependent on imports from neighbouring states." },
  { id: "negeriSembilan", name: "N. Sembilan", status: "balanced", production: 1800, demand: 1600, mainCrops: ["Palm Oil", "Rubber"], notes: "Self-sufficient with moderate palm oil contribution." },
  { id: "melaka", name: "Melaka", status: "balanced", production: 800, demand: 750, mainCrops: ["Pineapple", "Fish"], notes: "Tourism-driven demand met by local produce." },
  { id: "johor", name: "Johor", status: "surplus", production: 5200, demand: 3800, mainCrops: ["Palm Oil", "Pineapple", "Poultry"], notes: "Major exporter to Singapore and beyond." },
  { id: "sabah", name: "Sabah", status: "warning", production: 3800, demand: 3500, mainCrops: ["Palm Oil", "Cocoa", "Rice"], notes: "Logistics costs and infrastructure gaps create pockets of shortage." },
  { id: "sarawak", name: "Sarawak", status: "surplus", production: 4100, demand: 2600, mainCrops: ["Palm Oil", "Pepper", "Rice"], notes: "Largest state with strong agri output and low density." },
  { id: "labuan", name: "Labuan", status: "shortage", production: 30, demand: 120, mainCrops: [], notes: "Island territory – fully import-dependent." },
];

const summaryStats = {
  surplus: stateData.filter((s) => s.status === "surplus").length,
  balanced: stateData.filter((s) => s.status === "balanced").length,
  warning: stateData.filter((s) => s.status === "warning").length,
  shortage: stateData.filter((s) => s.status === "shortage").length,
};

const statusIcon: Record<StateStatus, React.ElementType> = {
  surplus: TrendingUp,
  balanced: ShieldCheck,
  warning: AlertTriangle,
  shortage: TrendingDown,
};

const FoodMap = () => {
  const [selected, setSelected] = useState<StateData | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/insights">
            <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" /> Insights
            </Button>
          </Link>
          <h1 className="font-display text-3xl font-bold flex items-center gap-3">
            <MapPin className="h-8 w-8 text-primary" />
            Food Security Command Center
          </h1>
          <p className="mt-2 text-muted-foreground">Interactive state-level view of Malaysia's food production balance.</p>
        </motion.div>

        {/* Summary strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {(["surplus", "balanced", "warning", "shortage"] as StateStatus[]).map((s) => {
            const Icon = statusIcon[s];
            const colors = statusColors[s];
            return (
              <Card key={s} className="border-border/40 bg-card/60 backdrop-blur-sm">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: colors.fill }}>
                    <Icon className="h-5 w-5" style={{ color: colors.stroke }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{summaryStats[s]}</p>
                    <p className="text-xs font-medium" style={{ color: colors.stroke }}>{colors.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* Map + detail panel */}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-2 sm:p-4">
                <MalaysiaMap
                  stateData={stateData}
                  onStateClick={setSelected}
                  selectedState={selected?.id}
                />
              </CardContent>
            </Card>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              {(["surplus", "balanced", "warning", "shortage"] as StateStatus[]).map((s) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusColors[s].dot}`} />
                  {statusColors[s].label}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Detail panel */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            {selected ? (
              <Card className="sticky top-24 border-border/40 bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display text-lg">{selected.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className="border"
                      style={{
                        borderColor: statusColors[selected.status].stroke,
                        color: statusColors[selected.status].stroke,
                        background: statusColors[selected.status].fill,
                      }}
                    >
                      {statusColors[selected.status].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Production vs Demand bars */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Production</span>
                        <span className="font-medium text-primary">{selected.production.toLocaleString()} t</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (selected.production / Math.max(selected.production, selected.demand)) * 100)}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Demand</span>
                        <span className="font-medium text-destructive">{selected.demand.toLocaleString()} t</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-destructive"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (selected.demand / Math.max(selected.production, selected.demand)) * 100)}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="rounded-lg border border-border/40 bg-muted/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Net Balance</p>
                    <p className={`text-xl font-bold ${selected.production - selected.demand >= 0 ? "text-primary" : "text-destructive"}`}>
                      {selected.production - selected.demand >= 0 ? "+" : ""}
                      {(selected.production - selected.demand).toLocaleString()} t
                    </p>
                  </div>

                  {/* Crops */}
                  {selected.mainCrops.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <Wheat className="h-3 w-3" /> Key Commodities
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.mainCrops.map((c) => (
                          <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-4">
                    {selected.notes}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="sticky top-24 border-border/40 bg-card/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <MapPin className="mb-3 h-8 w-8 text-primary/40" />
                  <p className="text-sm font-medium">Select a state</p>
                  <p className="text-xs mt-1">Click on any state to view food security details.</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FoodMap;
