import { Truck, AlertTriangle, CheckCircle, Package } from "lucide-react";
import { motion } from "framer-motion";
import { motion } from "framer-motion";
import WeatherImpact from "@/components/WeatherImpact";
import RouteStatusMap from "@/components/RouteStatusMap";

const stats = [
  { label: "Active Shipments", value: "47", icon: Truck, change: "+6 today" },
  { label: "Delayed Routes", value: "3", icon: AlertTriangle, accent: true },
  { label: "On-Time Rate", value: "91%", icon: CheckCircle },
  { label: "Tonnes In-Transit", value: "128", icon: Package },
];

const LogisticsDashboard = () => (
  <div className="min-h-screen bg-background pt-20">

    <main className="container py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-1">Logistics Dashboard</h1>
        <p className="text-muted-foreground">Weather-informed route intelligence for supply chain managers</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`h-4 w-4 ${s.accent ? "text-destructive" : "text-muted-foreground"}`} />
                {s.change && <span className="text-xs text-primary font-medium">{s.change}</span>}
              </div>
              <div className={`font-display text-2xl font-bold ${s.accent ? "text-destructive" : ""}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main widgets */}
      <div className="grid lg:grid-cols-2 gap-6">
        <WeatherImpact />
        <RouteStatusMap />
      </div>
    </main>
  </div>
);

export default LogisticsDashboard;
