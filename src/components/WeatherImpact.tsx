import { CloudRain, Thermometer, Droplets, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";

const kelantan = [
  { day: "Mon", precip: 42, temp: 29 },
  { day: "Tue", precip: 68, temp: 27 },
  { day: "Wed", precip: 85, temp: 25 },
  { day: "Thu", precip: 72, temp: 26 },
  { day: "Fri", precip: 35, temp: 28 },
  { day: "Sat", precip: 20, temp: 30 },
  { day: "Sun", precip: 55, temp: 27 },
];

const sabah = [
  { day: "Mon", precip: 30, temp: 31 },
  { day: "Tue", precip: 25, temp: 32 },
  { day: "Wed", precip: 90, temp: 26 },
  { day: "Thu", precip: 78, temp: 27 },
  { day: "Fri", precip: 60, temp: 28 },
  { day: "Sat", precip: 45, temp: 29 },
  { day: "Sun", precip: 38, temp: 30 },
];

const alerts = [
  { region: "Kelantan", message: "Heavy rainfall expected Wed–Thu. Flood risk in low-lying areas.", severity: "high" },
  { region: "Sabah", message: "Thunderstorms Wed. Expect route disruptions on east coast.", severity: "high" },
];

const chartTooltipStyle = {
  backgroundColor: "hsl(160 18% 10%)",
  border: "1px solid hsl(160 15% 16%)",
  borderRadius: "8px",
  color: "hsl(150 15% 92%)",
};

const RegionChart = ({ data, region }: { data: typeof kelantan; region: string }) => (
  <div>
    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
      <Thermometer className="h-4 w-4 text-secondary" />
      {region}
    </h4>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <Droplets className="h-3 w-3" /> Precipitation (mm)
        </p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data}>
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
          <Thermometer className="h-3 w-3" /> Temperature (°C)
        </p>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(160 15% 16%)" />
            <XAxis dataKey="day" tick={{ fill: "hsl(150 10% 55%)", fontSize: 10 }} />
            <YAxis domain={[20, 35]} tick={{ fill: "hsl(150 10% 55%)", fontSize: 10 }} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Line type="monotone" dataKey="temp" stroke="hsl(40 80% 50%)" strokeWidth={2} dot={{ fill: "hsl(40 80% 50%)", r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

const WeatherImpact = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-5"
  >
    <h3 className="font-display font-semibold mb-5 flex items-center gap-2">
      <CloudRain className="h-5 w-5 text-primary" /> Weather Impact Forecast
    </h3>

    {/* Alerts */}
    <div className="space-y-2 mb-6">
      {alerts.map((a) => (
        <div key={a.region} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <span className="text-sm font-medium text-destructive">{a.region}</span>
            <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>
          </div>
        </div>
      ))}
    </div>

    <div className="space-y-6">
      <RegionChart data={kelantan} region="Kelantan" />
      <RegionChart data={sabah} region="Sabah" />
    </div>
  </motion.div>
);

export default WeatherImpact;
