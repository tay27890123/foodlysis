import { useState, useMemo } from "react";
import { Map, CloudRain, Thermometer, Wind, Eye, AlertTriangle, CheckCircle, Clock, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";
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
  fromCoords: [number, number]; // [lng, lat]
  toCoords: [number, number];
}

interface WeatherPin {
  id: string;
  city: string;
  temp: number;
  humidity: number;
  wind: number;
  condition: "sunny" | "cloudy" | "rainy" | "storm";
  coords: [number, number]; // [lng, lat]
}

const routes: MapRoute[] = [
  { id: "r1", from: "Kota Bharu", to: "K. Terengganu", distance: "165 km", eta: "2.5h", status: "rain-delay", delay: "+45 min", reason: "Heavy rain", fromCoords: [102.24, 6.12], toCoords: [103.13, 5.31] },
  { id: "r2", from: "Kota Kinabalu", to: "Sandakan", distance: "320 km", eta: "5.2h", status: "severe", delay: "+2h", reason: "Flooding", fromCoords: [116.07, 5.98], toCoords: [118.07, 5.84] },
  { id: "r3", from: "Kuching", to: "Sibu", distance: "450 km", eta: "6.0h", status: "traffic-delay", delay: "+30 min", reason: "Road works", fromCoords: [110.35, 1.55], toCoords: [111.83, 2.30] },
  { id: "r4", from: "Ipoh", to: "Penang", distance: "170 km", eta: "2.8h", status: "clear", fromCoords: [101.09, 4.60], toCoords: [100.33, 5.41] },
  { id: "r5", from: "KL", to: "Seremban", distance: "70 km", eta: "1.0h", status: "clear", fromCoords: [101.69, 3.14], toCoords: [101.94, 2.73] },
  { id: "r6", from: "JB", to: "Melaka", distance: "220 km", eta: "3.0h", status: "rain-delay", delay: "+20 min", reason: "Light rain", fromCoords: [103.76, 1.49], toCoords: [102.25, 2.19] },
];

const weatherPins: WeatherPin[] = [
  { id: "w1", city: "Kuala Lumpur", temp: 31, humidity: 78, wind: 12, condition: "cloudy", coords: [101.69, 3.14] },
  { id: "w2", city: "Penang", temp: 30, humidity: 72, wind: 15, condition: "sunny", coords: [100.33, 5.41] },
  { id: "w3", city: "Kota Bharu", temp: 27, humidity: 92, wind: 25, condition: "storm", coords: [102.24, 6.12] },
  { id: "w4", city: "Kota Kinabalu", temp: 29, humidity: 85, wind: 18, condition: "rainy", coords: [116.07, 5.98] },
  { id: "w5", city: "Kuching", temp: 30, humidity: 80, wind: 10, condition: "cloudy", coords: [110.35, 1.55] },
  { id: "w6", city: "Johor Bahru", temp: 32, humidity: 75, wind: 8, condition: "sunny", coords: [103.76, 1.49] },
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

const TOPO_URL = "/malaysia-states.topo.json";

const HC_KEY_TO_ID: Record<string, string> = {
  "my-pl": "perlis", "my-kh": "kedah", "my-pg": "penang", "my-pk": "perak",
  "my-kn": "kelantan", "my-te": "terengganu", "my-ph": "pahang", "my-sl": "selangor",
  "my-kl": "kl", "my-pj": "putrajaya", "my-ns": "negeriSembilan", "my-me": "melaka",
  "my-jh": "johor", "my-sa": "sabah", "my-sk": "sarawak", "my-la": "labuan",
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
      <div className="relative w-full rounded-xl bg-muted/10 border border-border/40 overflow-hidden" style={{ aspectRatio: "2.4 / 1" }}>
        <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={reset} scale={zoomState.scale} />
        <div {...containerProps} className="absolute inset-0 overflow-hidden select-none">
          <div style={transformStyle} className="w-full h-full">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 2800, center: [109.5, 3.8] }}
              width={900}
              height={380}
              style={{ width: "100%", height: "100%" }}
            >
              {/* State geometries */}
              <Geographies geography={TOPO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const hcKey = geo.properties?.["hc-key"];
                    const id = hcKey ? HC_KEY_TO_ID[hcKey] : null;
                    if (!id) return null;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        style={{
                          default: {
                            fill: "hsl(152 30% 14%)",
                            stroke: "hsl(152 50% 30% / 0.6)",
                            strokeWidth: 0.5,
                            outline: "none",
                          },
                          hover: {
                            fill: "hsl(152 30% 20%)",
                            stroke: "hsl(152 50% 40% / 0.8)",
                            strokeWidth: 0.8,
                            outline: "none",
                          },
                          pressed: {
                            fill: "hsl(152 30% 14%)",
                            stroke: "hsl(152 50% 30% / 0.6)",
                            strokeWidth: 0.5,
                            outline: "none",
                          },
                        }}
                      />
                    );
                  })
                }
              </Geographies>

              {/* Route lines */}
              {routes.map((r) => {
                const cfg = statusConfig[r.status];
                const isActive = activeLayer === "routes";
                const isSelected = selectedRoute?.id === r.id;
                return (
                  <g key={r.id} className="cursor-pointer" onClick={() => { setSelectedRoute(r); setActiveLayer("routes"); }}>
                    {isSelected && (
                      <Line
                        from={r.fromCoords}
                        to={r.toCoords}
                        stroke={cfg.color}
                        strokeWidth={5}
                        strokeOpacity={0.25}
                        strokeLinecap="round"
                      />
                    )}
                    <Line
                      from={r.fromCoords}
                      to={r.toCoords}
                      stroke={cfg.color}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      strokeDasharray={r.status !== "clear" ? "6 4" : undefined}
                      strokeOpacity={isActive ? (isSelected ? 1 : 0.6) : 0.15}
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}

              {/* Route city markers */}
              {activeLayer === "routes" && routes.map((r) => {
                const cfg = statusConfig[r.status];
                const isSelected = selectedRoute?.id === r.id;
                return [
                  { coords: r.fromCoords, label: r.from, key: `${r.id}-from` },
                  { coords: r.toCoords, label: r.to, key: `${r.id}-to` },
                ].map((point) => (
                  <Marker key={point.key} coordinates={point.coords}>
                    <circle
                      r={isSelected ? 5 : 3.5}
                      fill={cfg.color}
                      stroke="hsl(var(--background))"
                      strokeWidth={1.5}
                      className="cursor-pointer"
                      onClick={() => setSelectedRoute(r)}
                    />
                    <text
                      textAnchor="middle"
                      y={isSelected ? -9 : -7}
                      fill="hsl(var(--foreground))"
                      fontSize={isSelected ? 7 : 5.5}
                      fontWeight={isSelected ? 700 : 500}
                      className="pointer-events-none select-none"
                      style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                    >
                      {point.label}
                    </text>
                  </Marker>
                ));
              })}

              {/* Weather markers */}
              {activeLayer === "weather" && weatherPins.map((w) => {
                const cond = conditionIcons[w.condition];
                const isSelected = selectedWeather?.id === w.id;
                return (
                  <Marker key={w.id} coordinates={w.coords}>
                    <g
                      className="cursor-pointer"
                      onClick={() => setSelectedWeather(w)}
                      transform={isSelected ? "scale(1.3)" : ""}
                    >
                      <circle r={14} fill="hsl(var(--muted) / 0.6)" stroke={isSelected ? "hsl(var(--primary) / 0.6)" : "transparent"} strokeWidth={1.5} />
                      <text textAnchor="middle" dominantBaseline="central" fontSize={12} y={-2}>
                        {cond.icon}
                      </text>
                      <text textAnchor="middle" y={10} fill="hsl(var(--foreground))" fontSize={6} fontWeight={700}>
                        {w.temp}°
                      </text>
                    </g>
                    <text
                      textAnchor="middle"
                      y={22}
                      fill={isSelected ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))"}
                      fontSize={5.5}
                      fontWeight={isSelected ? 600 : 400}
                      className="pointer-events-none select-none"
                      style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                    >
                      {w.city}
                    </text>
                  </Marker>
                );
              })}
            </ComposableMap>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-2 left-2 z-20 flex gap-3 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-[10px] border border-border/20">
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
        <div className="absolute top-2 right-2 z-20 flex gap-2">
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
