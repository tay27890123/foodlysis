import { useState } from "react";
import { Map, CloudRain, Thermometer, Wind, Eye, AlertTriangle, CheckCircle, Clock, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type RouteStatus = "clear" | "rain-delay" | "traffic-delay" | "severe";

interface MapRoute {
  id: string;
  from: string;
  to: string;
  distance: string;
  eta: string;
  status: RouteStatus;
  delay?: string;
  reason?: string;
  fromPos: { x: number; y: number };
  toPos: { x: number; y: number };
}

interface WeatherPin {
  id: string;
  city: string;
  temp: number;
  humidity: number;
  wind: number;
  condition: "sunny" | "cloudy" | "rainy" | "storm";
  pos: { x: number; y: number };
}

const routes: MapRoute[] = [
  { id: "r1", from: "Kota Bharu", to: "K. Terengganu", distance: "165 km", eta: "2.5h", status: "rain-delay", delay: "+45 min", reason: "Heavy rain", fromPos: { x: 72, y: 15 }, toPos: { x: 70, y: 28 } },
  { id: "r2", from: "Kota Kinabalu", to: "Sandakan", distance: "320 km", eta: "5.2h", status: "severe", delay: "+2h", reason: "Flooding", fromPos: { x: 28, y: 52 }, toPos: { x: 58, y: 45 } },
  { id: "r3", from: "Kuching", to: "Sibu", distance: "450 km", eta: "6.0h", status: "traffic-delay", delay: "+30 min", reason: "Road works", fromPos: { x: 10, y: 70 }, toPos: { x: 32, y: 62 } },
  { id: "r4", from: "Ipoh", to: "Penang", distance: "170 km", eta: "2.8h", status: "clear", fromPos: { x: 38, y: 25 }, toPos: { x: 34, y: 14 } },
  { id: "r5", from: "KL", to: "Seremban", distance: "70 km", eta: "1.0h", status: "clear", fromPos: { x: 42, y: 36 }, toPos: { x: 44, y: 42 } },
  { id: "r6", from: "JB", to: "Melaka", distance: "220 km", eta: "3.0h", status: "rain-delay", delay: "+20 min", reason: "Light rain", fromPos: { x: 48, y: 56 }, toPos: { x: 44, y: 46 } },
];

const weatherPins: WeatherPin[] = [
  { id: "w1", city: "Kuala Lumpur", temp: 31, humidity: 78, wind: 12, condition: "cloudy", pos: { x: 42, y: 36 } },
  { id: "w2", city: "Penang", temp: 30, humidity: 72, wind: 15, condition: "sunny", pos: { x: 34, y: 14 } },
  { id: "w3", city: "Kota Bharu", temp: 27, humidity: 92, wind: 25, condition: "storm", pos: { x: 72, y: 15 } },
  { id: "w4", city: "Kota Kinabalu", temp: 29, humidity: 85, wind: 18, condition: "rainy", pos: { x: 28, y: 52 } },
  { id: "w5", city: "Kuching", temp: 30, humidity: 80, wind: 10, condition: "cloudy", pos: { x: 10, y: 70 } },
  { id: "w6", city: "Johor Bahru", temp: 32, humidity: 75, wind: 8, condition: "sunny", pos: { x: 48, y: 56 } },
];

const statusColors: Record<RouteStatus, { stroke: string; dot: string; label: string }> = {
  clear: { stroke: "hsl(152 60% 42%)", dot: "bg-primary", label: "Clear" },
  "rain-delay": { stroke: "hsl(200 70% 50%)", dot: "bg-blue-500", label: "Rain Delay" },
  "traffic-delay": { stroke: "hsl(40 80% 50%)", dot: "bg-secondary", label: "Traffic" },
  severe: { stroke: "hsl(0 72% 51%)", dot: "bg-destructive", label: "Severe" },
};

const conditionIcons: Record<string, { icon: string; color: string }> = {
  sunny: { icon: "☀️", color: "text-yellow-400" },
  cloudy: { icon: "⛅", color: "text-muted-foreground" },
  rainy: { icon: "🌧️", color: "text-blue-400" },
  storm: { icon: "⛈️", color: "text-destructive" },
};

type MapLayer = "routes" | "weather";

const SmartRouteMap = () => {
  const [activeLayer, setActiveLayer] = useState<MapLayer>("routes");
  const [selectedRoute, setSelectedRoute] = useState<MapRoute | null>(null);
  const [selectedWeather, setSelectedWeather] = useState<WeatherPin | null>(null);

  const activeRoutes = routes.filter((r) => r.status !== "clear");
  const clearRoutes = routes.filter((r) => r.status === "clear");

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" /> Interactive Route & Weather Map
        </h3>
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => { setActiveLayer("routes"); setSelectedWeather(null); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeLayer === "routes" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Truck className="h-3 w-3 inline mr-1" /> Routes
          </button>
          <button
            onClick={() => { setActiveLayer("weather"); setSelectedRoute(null); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeLayer === "weather" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <CloudRain className="h-3 w-3 inline mr-1" /> Weather
          </button>
        </div>
      </div>

      <div className="relative w-full aspect-[2.2/1] rounded-xl bg-muted/20 border border-border/50 overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, hsl(152 60% 42%) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        {/* Peninsula & Borneo outlines (stylized) */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Peninsula Malaysia outline */}
          <path d="M 30 8 Q 32 12, 36 14 Q 40 18, 42 24 Q 44 28, 44 32 Q 46 36, 46 40 Q 48 44, 48 48 Q 50 52, 50 56 Q 48 58, 46 56 Q 44 52, 42 48 Q 40 44, 38 40 Q 36 36, 34 32 Q 32 28, 30 24 Q 28 18, 30 8 Z"
            fill="hsl(152 60% 42% / 0.08)" stroke="hsl(152 60% 42% / 0.2)" strokeWidth="0.3" />
          {/* Borneo outline */}
          <path d="M 5 58 Q 10 52, 18 48 Q 26 44, 34 42 Q 42 40, 50 42 Q 58 44, 64 48 Q 68 52, 66 58 Q 62 64, 56 68 Q 48 72, 40 74 Q 30 76, 20 74 Q 12 70, 8 64 Q 5 60, 5 58 Z"
            fill="hsl(152 60% 42% / 0.08)" stroke="hsl(152 60% 42% / 0.2)" strokeWidth="0.3" />
          {/* Labels */}
          <text x="38" y="35" fill="hsl(152 60% 42% / 0.3)" fontSize="2.5" fontWeight="600" textAnchor="middle">Peninsular Malaysia</text>
          <text x="35" y="60" fill="hsl(152 60% 42% / 0.3)" fontSize="2.5" fontWeight="600" textAnchor="middle">Borneo</text>
        </svg>

        {/* Route lines */}
        <svg className="absolute inset-0 w-full h-full">
          {routes.map((r) => {
            const cfg = statusColors[r.status];
            const isActive = activeLayer === "routes";
            const isSelected = selectedRoute?.id === r.id;
            return (
              <g key={r.id}>
                <line
                  x1={`${r.fromPos.x}%`} y1={`${r.fromPos.y}%`}
                  x2={`${r.toPos.x}%`} y2={`${r.toPos.y}%`}
                  stroke={cfg.stroke}
                  strokeWidth={isSelected ? "3" : "1.5"}
                  strokeDasharray={r.status !== "clear" ? "8 4" : "none"}
                  opacity={isActive ? (isSelected ? 1 : 0.6) : 0.15}
                  className="transition-all duration-300 cursor-pointer"
                  onClick={() => { setSelectedRoute(r); setActiveLayer("routes"); }}
                />
                {/* Animated dot on delayed routes */}
                {r.status !== "clear" && isActive && (
                  <circle r="3" fill={cfg.stroke} opacity="0.8">
                    <animateMotion
                      dur="3s"
                      repeatCount="indefinite"
                      path={`M ${r.fromPos.x},${r.fromPos.y} L ${r.toPos.x},${r.toPos.y}`}
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* Route endpoints */}
        {activeLayer === "routes" && routes.map((r) => {
          const cfg = statusColors[r.status];
          return (
            <div key={r.id}>
              {[{ pos: r.fromPos, label: r.from }, { pos: r.toPos, label: r.to }].map((point, i) => (
                <div
                  key={i}
                  className="absolute cursor-pointer group"
                  style={{ left: `${point.pos.x}%`, top: `${point.pos.y}%`, transform: "translate(-50%, -50%)" }}
                  onClick={() => setSelectedRoute(r)}
                >
                  <div className={`h-3 w-3 rounded-full ${cfg.dot} ring-2 ring-background shadow-lg group-hover:scale-125 transition-transform`} />
                  <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground whitespace-nowrap font-medium opacity-80">{point.label}</span>
                </div>
              ))}
            </div>
          );
        })}

        {/* Weather pins */}
        {activeLayer === "weather" && weatherPins.map((w) => {
          const cond = conditionIcons[w.condition];
          const isSelected = selectedWeather?.id === w.id;
          return (
            <div
              key={w.id}
              className="absolute cursor-pointer group"
              style={{ left: `${w.pos.x}%`, top: `${w.pos.y}%`, transform: "translate(-50%, -50%)" }}
              onClick={() => setSelectedWeather(w)}
            >
              <div className={`flex flex-col items-center transition-transform ${isSelected ? "scale-125" : "group-hover:scale-110"}`}>
                <span className="text-lg leading-none">{cond.icon}</span>
                <span className="text-[9px] font-bold text-foreground mt-0.5">{w.temp}°</span>
                <span className="text-[7px] text-muted-foreground whitespace-nowrap">{w.city}</span>
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-2 left-2 flex gap-3 bg-background/80 backdrop-blur-sm rounded-md px-3 py-1.5 text-[10px]">
          {activeLayer === "routes" ? (
            Object.entries(statusColors).map(([key, cfg]) => (
              <span key={key} className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                <span className="text-muted-foreground">{cfg.label}</span>
              </span>
            ))
          ) : (
            Object.entries(conditionIcons).map(([key, cfg]) => (
              <span key={key} className="flex items-center gap-1">
                <span className="text-xs">{cfg.icon}</span>
                <span className="text-muted-foreground capitalize">{key}</span>
              </span>
            ))
          )}
        </div>

        {/* Stats overlay */}
        <div className="absolute top-2 right-2 flex gap-2">
          <div className="bg-background/80 backdrop-blur-sm rounded-md px-2.5 py-1.5 text-[10px] border border-border/30">
            <span className="text-destructive font-semibold">{activeRoutes.length}</span>
            <span className="text-muted-foreground ml-1">Disrupted</span>
          </div>
          <div className="bg-background/80 backdrop-blur-sm rounded-md px-2.5 py-1.5 text-[10px] border border-border/30">
            <span className="text-primary font-semibold">{clearRoutes.length}</span>
            <span className="text-muted-foreground ml-1">Clear</span>
          </div>
        </div>
      </div>

      {/* Detail panels */}
      <AnimatePresence mode="wait">
        {selectedRoute && activeLayer === "routes" && (
          <motion.div
            key={selectedRoute.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {selectedRoute.status === "clear" ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : selectedRoute.status === "severe" ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Clock className="h-4 w-4 text-secondary" />
                  )}
                  {selectedRoute.from} → {selectedRoute.to}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedRoute.distance} · ETA {selectedRoute.eta}
                  {selectedRoute.delay && <span className="text-destructive font-medium"> ({selectedRoute.delay})</span>}
                </p>
                {selectedRoute.reason && (
                  <p className="text-xs text-muted-foreground mt-0.5">Reason: {selectedRoute.reason}</p>
                )}
              </div>
              <button onClick={() => setSelectedRoute(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>
          </motion.div>
        )}

        {selectedWeather && activeLayer === "weather" && (
          <motion.div
            key={selectedWeather.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-lg">{conditionIcons[selectedWeather.condition].icon}</span>
                  {selectedWeather.city}
                </div>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Thermometer className="h-3 w-3" /> {selectedWeather.temp}°C</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {selectedWeather.humidity}% humidity</span>
                  <span className="flex items-center gap-1"><Wind className="h-3 w-3" /> {selectedWeather.wind} km/h</span>
                </div>
              </div>
              <button onClick={() => setSelectedWeather(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartRouteMap;
