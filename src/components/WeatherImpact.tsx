import { CloudRain, Thermometer, Droplets, AlertTriangle, Sun, CloudLightning } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";

const regions = {
  kelantan: {
    label: "Kelantan",
    forecast: [
      { day: "Mon", precip: 42, temp: 29, humidity: 82 },
      { day: "Tue", precip: 68, temp: 27, humidity: 88 },
      { day: "Wed", precip: 85, temp: 25, humidity: 95 },
      { day: "Thu", precip: 72, temp: 26, humidity: 90 },
      { day: "Fri", precip: 35, temp: 28, humidity: 80 },
      { day: "Sat", precip: 20, temp: 30, humidity: 72 },
      { day: "Sun", precip: 55, temp: 27, humidity: 85 },
    ],
    alert: { message: "Heavy rainfall expected Wed–Thu. Flood risk in low-lying areas.", severity: "high" as const },
    condition: "Rainy",
    icon: CloudRain,
  },
  sabah: {
    label: "Sabah",
    forecast: [
      { day: "Mon", precip: 30, temp: 31, humidity: 75 },
      { day: "Tue", precip: 25, temp: 32, humidity: 70 },
      { day: "Wed", precip: 90, temp: 26, humidity: 94 },
      { day: "Thu", precip: 78, temp: 27, humidity: 90 },
      { day: "Fri", precip: 60, temp: 28, humidity: 82 },
      { day: "Sat", precip: 45, temp: 29, humidity: 78 },
      { day: "Sun", precip: 38, temp: 30, humidity: 74 },
    ],
    alert: { message: "Thunderstorms Wed. Expect route disruptions on east coast.", severity: "high" as const },
    condition: "Stormy",
    icon: CloudLightning,
  },
  kl: {
    label: "Kuala Lumpur",
    forecast: [
      { day: "Mon", precip: 10, temp: 33, humidity: 65 },
      { day: "Tue", precip: 15, temp: 32, humidity: 68 },
      { day: "Wed", precip: 20, temp: 31, humidity: 70 },
      { day: "Thu", precip: 5, temp: 34, humidity: 60 },
      { day: "Fri", precip: 8, temp: 33, humidity: 62 },
      { day: "Sat", precip: 12, temp: 32, humidity: 66 },
      { day: "Sun", precip: 18, temp: 31, humidity: 70 },
    ],
    alert: null,
    condition: "Clear",
    icon: Sun,
  },
};

const chartTooltipStyle = {
  backgroundColor: "hsl(160 18% 10%)",
  border: "1px solid hsl(160 15% 16%)",
  borderRadius: "8px",
  color: "hsl(150 15% 92%)",
  fontSize: "11px",
};

type RegionKey = keyof typeof regions;

const WeatherImpact = () => {
  const [active, setActive] = useState<RegionKey>("kelantan");
  const region = regions[active];

  const avgTemp = Math.round(region.forecast.reduce((s, d) => s + d.temp, 0) / region.forecast.length);
  const maxPrecip = Math.max(...region.forecast.map((d) => d.precip));
  const avgHumidity = Math.round(region.forecast.reduce((s, d) => s + d.humidity, 0) / region.forecast.length);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 h-full">
      <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
        <CloudRain className="h-5 w-5 text-primary" /> Weather Forecast
      </h3>

      {/* Region tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1 mb-4">
        {(Object.keys(regions) as RegionKey[]).map((key) => {
          const r = regions[key];
          const Icon = r.icon;
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${active === key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="h-3 w-3" /> {r.label}
            </button>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <Thermometer className="h-4 w-4 mx-auto text-secondary mb-1" />
          <div className="text-lg font-bold">{avgTemp}°C</div>
          <div className="text-[10px] text-muted-foreground">Avg Temp</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <Droplets className="h-4 w-4 mx-auto text-blue-400 mb-1" />
          <div className="text-lg font-bold">{maxPrecip}mm</div>
          <div className="text-[10px] text-muted-foreground">Peak Rain</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <CloudRain className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <div className="text-lg font-bold">{avgHumidity}%</div>
          <div className="text-[10px] text-muted-foreground">Avg Humidity</div>
        </div>
      </div>

      {/* Alert */}
      <AnimatePresence mode="wait">
        {region.alert && (
          <motion.div
            key={active}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4"
          >
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <span className="text-sm font-medium text-destructive">{region.label} Alert</span>
              <p className="text-xs text-muted-foreground mt-0.5">{region.alert.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Charts */}
      <div className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Droplets className="h-3 w-3" /> Precipitation (mm)
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={region.forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(160 15% 16%)" />
              <XAxis dataKey="day" tick={{ fill: "hsl(150 10% 55%)", fontSize: 10 }} />
              <YAxis tick={{ fill: "hsl(150 10% 55%)", fontSize: 10 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="precip" fill="hsl(200 70% 50%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Thermometer className="h-3 w-3" /> Temperature (°C) & Humidity (%)
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={region.forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(160 15% 16%)" />
              <XAxis dataKey="day" tick={{ fill: "hsl(150 10% 55%)", fontSize: 10 }} />
              <YAxis tick={{ fill: "hsl(150 10% 55%)", fontSize: 10 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="temp" stroke="hsl(40 80% 50%)" fill="hsl(40 80% 50% / 0.15)" strokeWidth={2} />
              <Area type="monotone" dataKey="humidity" stroke="hsl(200 60% 50%)" fill="hsl(200 60% 50% / 0.1)" strokeWidth={1.5} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default WeatherImpact;
