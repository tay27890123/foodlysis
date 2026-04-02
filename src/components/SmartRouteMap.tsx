import { useState } from "react";
import { Map, CloudRain, Thermometer, Wind, Eye, AlertTriangle, CheckCircle, Clock, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMapZoomPan } from "@/hooks/useMapZoomPan";
import ZoomControls from "@/components/ZoomControls";

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

// Positions calibrated to a proper Malaysia map layout
// Peninsula on the right, Borneo on the left, proper aspect ratio
const routes: MapRoute[] = [
  { id: "r1", from: "Kota Bharu", to: "K. Terengganu", distance: "165 km", eta: "2.5h", status: "rain-delay", delay: "+45 min", reason: "Heavy rain", fromPos: { x: 78, y: 18 }, toPos: { x: 76, y: 32 } },
  { id: "r2", from: "Kota Kinabalu", to: "Sandakan", distance: "320 km", eta: "5.2h", status: "severe", delay: "+2h", reason: "Flooding", fromPos: { x: 18, y: 38 }, toPos: { x: 38, y: 30 } },
  { id: "r3", from: "Kuching", to: "Sibu", distance: "450 km", eta: "6.0h", status: "traffic-delay", delay: "+30 min", reason: "Road works", fromPos: { x: 10, y: 62 }, toPos: { x: 26, y: 52 } },
  { id: "r4", from: "Ipoh", to: "Penang", distance: "170 km", eta: "2.8h", status: "clear", fromPos: { x: 64, y: 35 }, toPos: { x: 60, y: 20 } },
  { id: "r5", from: "KL", to: "Seremban", distance: "70 km", eta: "1.0h", status: "clear", fromPos: { x: 66, y: 46 }, toPos: { x: 68, y: 54 } },
  { id: "r6", from: "JB", to: "Melaka", distance: "220 km", eta: "3.0h", status: "rain-delay", delay: "+20 min", reason: "Light rain", fromPos: { x: 70, y: 68 }, toPos: { x: 67, y: 58 } },
];

const weatherPins: WeatherPin[] = [
  { id: "w1", city: "Kuala Lumpur", temp: 31, humidity: 78, wind: 12, condition: "cloudy", pos: { x: 66, y: 46 } },
  { id: "w2", city: "Penang", temp: 30, humidity: 72, wind: 15, condition: "sunny", pos: { x: 60, y: 20 } },
  { id: "w3", city: "Kota Bharu", temp: 27, humidity: 92, wind: 25, condition: "storm", pos: { x: 78, y: 18 } },
  { id: "w4", city: "Kota Kinabalu", temp: 29, humidity: 85, wind: 18, condition: "rainy", pos: { x: 18, y: 38 } },
  { id: "w5", city: "Kuching", temp: 30, humidity: 80, wind: 10, condition: "cloudy", pos: { x: 10, y: 62 } },
  { id: "w6", city: "Johor Bahru", temp: 32, humidity: 75, wind: 8, condition: "sunny", pos: { x: 70, y: 68 } },
];

const statusConfig: Record<RouteStatus, { color: string; bg: string; label: string }> = {
  clear: { color: "hsl(152 60% 42%)", bg: "bg-primary", label: "Clear" },
  "rain-delay": { color: "hsl(200 70% 50%)", bg: "bg-blue-500", label: "Rain Delay" },
  "traffic-delay": { color: "hsl(40 80% 50%)", bg: "bg-yellow-500", label: "Traffic" },
  severe: { color: "hsl(0 72% 51%)", bg: "bg-red-500", label: "Severe" },
};

const conditionIcons: Record<string, { icon: string }> = {
  sunny: { icon: "☀️" },
  cloudy: { icon: "⛅" },
  rainy: { icon: "🌧️" },
  storm: { icon: "⛈️" },
};

type MapLayer = "routes" | "weather";

const SmartRouteMap = () => {
  const [activeLayer, setActiveLayer] = useState<MapLayer>("routes");
  const [selectedRoute, setSelectedRoute] = useState<MapRoute | null>(null);
  const [selectedWeather, setSelectedWeather] = useState<WeatherPin | null>(null);
  const { state: zoomState, containerProps, transformStyle, zoomIn, zoomOut, reset } = useMapZoomPan(1, 4);

  const activeRoutes = routes.filter((r) => r.status !== "clear");
  const clearRoutes = routes.filter((r) => r.status === "clear");

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold flex items-center gap-2 text-base">
          <Map className="h-5 w-5 text-primary" /> Interactive Route & Weather Map
        </h3>
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => { setActiveLayer("routes"); setSelectedWeather(null); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeLayer === "routes" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Truck className="h-3.5 w-3.5 inline mr-1" /> Routes
          </button>
          <button
            onClick={() => { setActiveLayer("weather"); setSelectedRoute(null); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeLayer === "weather" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <CloudRain className="h-3.5 w-3.5 inline mr-1" /> Weather
          </button>
        </div>
      </div>

      {/* Map container */}
      <div className="relative w-full rounded-xl bg-muted/10 border border-border/40 overflow-hidden" style={{ aspectRatio: "2.2 / 1" }}>
        <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={reset} scale={zoomState.scale} />
        <div {...containerProps} className="absolute inset-0 overflow-hidden select-none">
          <div style={transformStyle} className="w-full h-full relative">
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        {/* SVG Map */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 80" preserveAspectRatio="xMidYMid meet">
          {/* Sea labels */}
          <text x="44" y="50" fill="hsl(200 40% 50% / 0.15)" fontSize="3.5" fontWeight="700" textAnchor="middle" fontStyle="italic">South China Sea</text>

          {/* ---- Peninsula Malaysia ---- */}
          <path
            d="M 56 12 C 58 14, 62 16, 63 18 C 65 22, 66 26, 67 30 C 68 34, 69 38, 69 42 C 70 46, 70 50, 70 54 C 71 58, 72 62, 72 66 C 72 70, 71 72, 70 72 C 68 72, 66 70, 65 68 C 63 64, 62 60, 62 56 C 61 52, 60 48, 60 44 C 59 40, 58 36, 57 32 C 56 28, 55 24, 55 20 C 55 16, 55 14, 56 12 Z"
            fill="hsl(152 40% 30% / 0.12)"
            stroke="hsl(152 50% 40% / 0.35)"
            strokeWidth="0.4"
          />
          <text x="64" y="44" fill="hsl(152 40% 50% / 0.25)" fontSize="2" fontWeight="600" textAnchor="middle">Peninsular</text>
          <text x="64" y="47" fill="hsl(152 40% 50% / 0.25)" fontSize="2" fontWeight="600" textAnchor="middle">Malaysia</text>

          {/* ---- Borneo (Sabah & Sarawak) ---- */}
          <path
            d="M 4 56 C 6 52, 10 48, 14 44 C 18 40, 22 36, 26 34 C 30 32, 34 30, 38 30 C 42 30, 44 32, 42 36 C 40 40, 36 44, 34 48 C 32 52, 28 56, 24 60 C 20 64, 16 66, 12 66 C 8 66, 5 62, 4 56 Z"
            fill="hsl(152 40% 30% / 0.12)"
            stroke="hsl(152 50% 40% / 0.35)"
            strokeWidth="0.4"
          />
          <text x="22" y="50" fill="hsl(152 40% 50% / 0.25)" fontSize="2" fontWeight="600" textAnchor="middle">East Malaysia</text>
          <text x="22" y="53" fill="hsl(152 40% 50% / 0.25)" fontSize="1.6" fontWeight="500" textAnchor="middle">(Sabah & Sarawak)</text>

          {/* Route lines */}
          {routes.map((r) => {
            const cfg = statusConfig[r.status];
            const isActive = activeLayer === "routes";
            const isSelected = selectedRoute?.id === r.id;
            return (
              <g key={r.id} className="cursor-pointer" onClick={() => { setSelectedRoute(r); setActiveLayer("routes"); }}>
                {/* Glow for selected */}
                {isSelected && (
                  <line
                    x1={r.fromPos.x} y1={r.fromPos.y}
                    x2={r.toPos.x} y2={r.toPos.y}
                    stroke={cfg.color}
                    strokeWidth="4"
                    opacity="0.2"
                    strokeLinecap="round"
                  />
                )}
                <line
                  x1={r.fromPos.x} y1={r.fromPos.y}
                  x2={r.toPos.x} y2={r.toPos.y}
                  stroke={cfg.color}
                  strokeWidth={isSelected ? "1.2" : "0.7"}
                  strokeDasharray={r.status !== "clear" ? "3 2" : "none"}
                  opacity={isActive ? (isSelected ? 1 : 0.5) : 0.12}
                  strokeLinecap="round"
                />
                {/* Animated dot */}
                {r.status !== "clear" && isActive && (
                  <circle r="1.2" fill={cfg.color} opacity="0.9">
                    <animateMotion
                      dur="4s"
                      repeatCount="indefinite"
                      path={`M ${r.fromPos.x},${r.fromPos.y} L ${r.toPos.x},${r.toPos.y}`}
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* City pins - Routes layer */}
        {activeLayer === "routes" && routes.map((r) => {
          const cfg = statusConfig[r.status];
          const isSelected = selectedRoute?.id === r.id;
          return (
            <div key={r.id}>
              {[{ pos: r.fromPos, label: r.from }, { pos: r.toPos, label: r.to }].map((point, i) => (
                <div
                  key={`${r.id}-${i}`}
                  className="absolute cursor-pointer group z-10"
                  style={{ left: `${point.pos.x}%`, top: `${point.pos.y * (100 / 80)}%`, transform: "translate(-50%, -50%)" }}
                  onClick={() => setSelectedRoute(r)}
                >
                  <div className={`h-3 w-3 rounded-full ${cfg.bg} ring-2 ring-background shadow-md transition-transform ${isSelected ? "scale-150" : "group-hover:scale-125"}`} />
                  <span className={`absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap font-semibold transition-opacity ${isSelected ? "text-[10px] text-foreground opacity-100" : "text-[9px] text-muted-foreground opacity-70 group-hover:opacity-100"}`}>
                    {point.label}
                  </span>
                </div>
              ))}
            </div>
          );
        })}

        {/* City pins - Weather layer */}
        {activeLayer === "weather" && weatherPins.map((w) => {
          const cond = conditionIcons[w.condition];
          const isSelected = selectedWeather?.id === w.id;
          return (
            <div
              key={w.id}
              className="absolute cursor-pointer group z-10"
              style={{ left: `${w.pos.x}%`, top: `${w.pos.y * (100 / 80)}%`, transform: "translate(-50%, -50%)" }}
              onClick={() => setSelectedWeather(w)}
            >
              <div className={`flex flex-col items-center transition-transform ${isSelected ? "scale-125" : "group-hover:scale-110"}`}>
                <div className={`rounded-full px-1.5 py-0.5 backdrop-blur-sm ${isSelected ? "bg-muted/60 ring-1 ring-primary/40" : "bg-muted/30"}`}>
                  <span className="text-base leading-none">{cond.icon}</span>
                  <span className="text-[10px] font-bold text-foreground ml-0.5">{w.temp}°</span>
                </div>
                <span className={`text-[9px] mt-0.5 whitespace-nowrap font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>{w.city}</span>
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-2 left-2 flex gap-3 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-[10px] border border-border/20">
          {activeLayer === "routes"
            ? Object.entries(statusConfig).map(([key, cfg]) => (
                <span key={key} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${cfg.bg}`} />
                  <span className="text-muted-foreground font-medium">{cfg.label}</span>
                </span>
              ))
            : Object.entries(conditionIcons).map(([key, cfg]) => (
                <span key={key} className="flex items-center gap-1">
                  <span className="text-sm">{cfg.icon}</span>
                  <span className="text-muted-foreground capitalize font-medium">{key}</span>
                </span>
              ))
          }
        </div>

        {/* Stats overlay */}
        <div className="absolute top-2 right-2 flex gap-2">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-[11px] border border-border/20 font-medium">
            <span className="text-destructive font-bold">{activeRoutes.length}</span>
            <span className="text-muted-foreground ml-1">Disrupted</span>
          </div>
          <div className="bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-[11px] border border-border/20 font-medium">
            <span className="text-primary font-bold">{clearRoutes.length}</span>
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
                    <Clock className="h-4 w-4 text-yellow-500" />
                  )}
                  {selectedRoute.from} → {selectedRoute.to}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedRoute.distance} · ETA {selectedRoute.eta}
                  {selectedRoute.delay && <span className="text-destructive font-semibold"> ({selectedRoute.delay})</span>}
                </p>
                {selectedRoute.reason && (
                  <p className="text-xs text-muted-foreground mt-0.5">Reason: {selectedRoute.reason}</p>
                )}
              </div>
              <button onClick={() => setSelectedRoute(null)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1">✕</button>
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
              <button onClick={() => setSelectedWeather(null)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartRouteMap;
