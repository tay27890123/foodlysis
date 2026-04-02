import { motion } from "framer-motion";
import { CloudRain, Route, Navigation, Zap } from "lucide-react";
import WeatherImpact from "@/components/WeatherImpact";
import RouteStatusMap from "@/components/RouteStatusMap";
import SmartRouteMap from "@/components/SmartRouteMap";

const LogisticsDashboard = () => (
  <div className="min-h-screen bg-background pt-20">
    <main className="container py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-1 flex items-center gap-3">
          <Navigation className="h-8 w-8 text-primary" />
          Transit Monitor
        </h1>
        <p className="text-muted-foreground">Live weather conditions & route status across Malaysia</p>
      </motion.div>

      {/* Full-width interactive map */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
        <SmartRouteMap />
      </motion.div>

      {/* Weather & Route details side by side */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <WeatherImpact />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <RouteStatusMap />
        </motion.div>
      </div>
    </main>
  </div>
);

export default LogisticsDashboard;
