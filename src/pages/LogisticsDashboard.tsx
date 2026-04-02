import { motion } from "framer-motion";
import { CloudRain, Route } from "lucide-react";
import WeatherImpact from "@/components/WeatherImpact";
import RouteStatusMap from "@/components/RouteStatusMap";

const LogisticsDashboard = () => (
  <div className="min-h-screen bg-background pt-20">
    <main className="container py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-1">Smart Route</h1>
        <p className="text-muted-foreground">Weather analysis & route status for supply chain planning</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <WeatherImpact />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <RouteStatusMap />
        </motion.div>
      </div>
    </main>
  </div>
);

export default LogisticsDashboard;
