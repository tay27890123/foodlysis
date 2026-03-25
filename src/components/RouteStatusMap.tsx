import { MapPin, CloudRain, AlertTriangle, Truck, Clock, CheckCircle } from "lucide-react";
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
  coords: { fromX: number; fromY: number; toX: number; toY: number };
}

const routes: Route[] = [
  { id: "r1", from: "Kota Bharu", to: "Kuala Terengganu", distance: "165 km", eta: "2.5h", status: "rain-delay", delay: "+45 min", reason: "Heavy rain in Kelantan", coords: { fromX: 72, fromY: 18, toX: 68, toY: 32 } },
  { id: "r2", from: "Kota Kinabalu", to: "Sandakan", distance: "320 km", eta: "5.2h", status: "severe", delay: "+2h", reason: "Flooding on coastal road", coords: { fromX: 30, fromY: 55, toX: 60, toY: 48 } },
  { id: "r3", from: "Kuching", to: "Sibu", distance: "450 km", eta: "6.0h", status: "traffic-delay", delay: "+30 min", reason: "Road works near Sarikei", coords: { fromX: 12, fromY: 72, toX: 35, toY: 65 } },
  { id: "r4", from: "Ipoh", to: "Penang", distance: "170 km", eta: "2.8h", status: "clear", coords: { fromX: 38, fromY: 28, toX: 34, toY: 18 } },
  { id: "r5", from: "KL", to: "Cameron H.", distance: "205 km", eta: "3.5h", status: "clear", coords: { fromX: 42, fromY: 38, toX: 40, toY: 26 } },
  { id: "r6", from: "JB", to: "Melaka", distance: "220 km", eta: "3.0h", status: "rain-delay", delay: "+20 min", reason: "Light rain on highway", coords: { fromX: 48, fromY: 58, toX: 44, toY: 48 } },
];

const statusConfig: Record<RouteStatus, { color: string; icon: typeof CheckCircle; label: string; dotClass: string }> = {
  clear: { color: "text-primary", icon: CheckCircle, label: "Clear", dotClass: "bg-primary" },
  "rain-delay": { color: "text-secondary", icon: CloudRain, label: "Rain Delay", dotClass: "bg-secondary" },
  "traffic-delay": { color: "text-secondary", icon: Clock, label: "Traffic", dotClass: "bg-secondary" },
  severe: { color: "text-destructive", icon: AlertTriangle, label: "Severe", dotClass: "bg-destructive" },
};

const RouteStatusMap = () => {
  const delayed = routes.filter((r) => r.status !== "clear");
  const clear = routes.filter((r) => r.status === "clear");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-5"
    >
      <h3 className="font-display font-semibold mb-5 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" /> Route Status Map
      </h3>

      {/* Visual map */}
      <div className="relative w-full aspect-[16/9] rounded-lg bg-muted/20 border border-border/50 mb-5 overflow-hidden">
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, hsl(152 60% 42%) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

        {/* Routes as lines */}
        <svg className="absolute inset-0 w-full h-full">
          {routes.map((r) => {
            const cfg = statusConfig[r.status];
            const strokeColor = r.status === "clear" ? "hsl(152 60% 42% / 0.4)" : r.status === "severe" ? "hsl(0 72% 51% / 0.7)" : "hsl(40 80% 50% / 0.6)";
            return (
              <line
                key={r.id}
                x1={`${r.coords.fromX}%`} y1={`${r.coords.fromY}%`}
                x2={`${r.coords.toX}%`} y2={`${r.coords.toY}%`}
                stroke={strokeColor} strokeWidth="2" strokeDasharray={r.status !== "clear" ? "6 4" : "none"}
              />
            );
          })}
        </svg>

        {/* Route endpoints */}
        {routes.map((r) => {
          const cfg = statusConfig[r.status];
          return (
            <div key={r.id}>
              <div className="absolute" style={{ left: `${r.coords.fromX}%`, top: `${r.coords.fromY}%`, transform: "translate(-50%, -50%)" }}>
                <div className={`h-3 w-3 rounded-full ${cfg.dotClass} ring-2 ring-background shadow-lg`} />
                <span className="absolute top-3.5 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground whitespace-nowrap font-medium">{r.from}</span>
              </div>
              <div className="absolute" style={{ left: `${r.coords.toX}%`, top: `${r.coords.toY}%`, transform: "translate(-50%, -50%)" }}>
                <div className={`h-3 w-3 rounded-full ${cfg.dotClass} ring-2 ring-background shadow-lg`} />
                <span className="absolute top-3.5 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground whitespace-nowrap font-medium">{r.to}</span>
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-2 right-2 flex gap-3 bg-background/80 backdrop-blur-sm rounded-md px-3 py-1.5 text-[10px]">
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${cfg.dotClass}`} />
              <span className="text-muted-foreground">{cfg.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Delayed routes list */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-destructive mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Delays ({delayed.length})
        </h4>
        <div className="space-y-2">
          {delayed.map((r) => {
            const cfg = statusConfig[r.status];
            const Icon = cfg.icon;
            return (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${cfg.color} shrink-0`} />
                  <div>
                    <div className="text-sm font-medium">{r.from} → {r.to}</div>
                    <div className="text-xs text-muted-foreground">{r.reason}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${cfg.color}`}>{r.delay}</div>
                  <div className="text-xs text-muted-foreground">{r.distance} · {r.eta}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clear routes */}
      <h4 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
        <Truck className="h-4 w-4" /> Clear ({clear.length})
      </h4>
      <div className="space-y-2">
        {clear.map((r) => (
          <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-primary shrink-0" />
              <div className="text-sm font-medium">{r.from} → {r.to}</div>
            </div>
            <div className="text-xs text-muted-foreground">{r.distance} · {r.eta}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default RouteStatusMap;
