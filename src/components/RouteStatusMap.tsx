import { MapPin, CloudRain, AlertTriangle, Truck, Clock, CheckCircle, ArrowRight, Shield } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

type RouteStatus = "clear" | "rain-delay" | "traffic-delay" | "severe";

interface Route {
  id: string;
  from: string;
  to: string;
  distance: string;
  eta: string;
  status: RouteStatus;
  delay?: string;
  reason?: string;
  risk: number; // 0-100
  cargoType: string;
}

const routes: Route[] = [
  { id: "r1", from: "Kota Bharu", to: "K. Terengganu", distance: "165 km", eta: "2.5h", status: "rain-delay", delay: "+45 min", reason: "Heavy rain in Kelantan", risk: 65, cargoType: "Fruits" },
  { id: "r2", from: "Kota Kinabalu", to: "Sandakan", distance: "320 km", eta: "5.2h", status: "severe", delay: "+2h", reason: "Flooding on coastal road", risk: 90, cargoType: "Vegetables" },
  { id: "r3", from: "Kuching", to: "Sibu", distance: "450 km", eta: "6.0h", status: "traffic-delay", delay: "+30 min", reason: "Road works near Sarikei", risk: 40, cargoType: "Mixed" },
  { id: "r4", from: "Ipoh", to: "Penang", distance: "170 km", eta: "2.8h", status: "clear", risk: 10, cargoType: "Meat" },
  { id: "r5", from: "KL", to: "Seremban", distance: "70 km", eta: "1.0h", status: "clear", risk: 5, cargoType: "Dairy" },
  { id: "r6", from: "JB", to: "Melaka", distance: "220 km", eta: "3.0h", status: "rain-delay", delay: "+20 min", reason: "Light rain on highway", risk: 30, cargoType: "Fruits" },
];

const statusConfig: Record<RouteStatus, { color: string; bg: string; icon: typeof CheckCircle; label: string }> = {
  clear: { color: "text-primary", bg: "bg-primary/10", icon: CheckCircle, label: "Clear" },
  "rain-delay": { color: "text-blue-400", bg: "bg-blue-500/10", icon: CloudRain, label: "Rain Delay" },
  "traffic-delay": { color: "text-secondary", bg: "bg-secondary/10", icon: Clock, label: "Traffic" },
  severe: { color: "text-destructive", bg: "bg-destructive/10", icon: AlertTriangle, label: "Severe" },
};

type FilterStatus = "all" | RouteStatus;

const RouteStatusMap = () => {
  const [filter, setFilter] = useState<FilterStatus>("all");

  const filtered = filter === "all" ? routes : routes.filter((r) => r.status === filter);
  const delayed = routes.filter((r) => r.status !== "clear").length;
  const avgRisk = Math.round(routes.reduce((s, r) => s + r.risk, 0) / routes.length);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 h-full">
      <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
        <Truck className="h-5 w-5 text-primary" /> Route Status
      </h3>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <div className="text-lg font-bold">{routes.length}</div>
          <div className="text-[10px] text-muted-foreground">Total Routes</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-destructive">{delayed}</div>
          <div className="text-[10px] text-muted-foreground">Disrupted</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Shield className="h-3.5 w-3.5 text-secondary" />
            <span className="text-lg font-bold">{avgRisk}%</span>
          </div>
          <div className="text-[10px] text-muted-foreground">Avg Risk</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap mb-4">
        {(["all", "severe", "rain-delay", "traffic-delay", "clear"] as FilterStatus[]).map((f) => {
          const label = f === "all" ? "All" : statusConfig[f as RouteStatus].label;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Route list */}
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {filtered.map((r) => {
          const cfg = statusConfig[r.status];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-3 rounded-lg border border-border/30 ${cfg.bg}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${cfg.color} shrink-0`} />
                  <span className="text-sm font-medium">{r.from}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium">{r.to}</span>
                </div>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{r.distance} · ETA {r.eta}{r.delay && <span className="text-destructive font-medium"> ({r.delay})</span>}</span>
                <span className="text-[10px]">📦 {r.cargoType}</span>
              </div>
              {r.reason && <p className="text-[11px] text-muted-foreground mt-1 italic">{r.reason}</p>}
              {/* Risk bar */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-8">Risk</span>
                <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${r.risk > 70 ? "bg-destructive" : r.risk > 30 ? "bg-secondary" : "bg-primary"}`}
                    style={{ width: `${r.risk}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium w-6 text-right">{r.risk}%</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default RouteStatusMap;
