import { motion } from "framer-motion";
import { Recycle, Users, Truck, BarChart3 } from "lucide-react";

const pillars = [
  {
    icon: Recycle,
    title: "Zero Waste Mission",
    description: "Redirect surplus food from landfills to retailers who need it — aligned with Malaysia's SDG 12.3 targets.",
  },
  {
    icon: Users,
    title: "Peer-to-Peer Model",
    description: "Direct supplier-to-buyer connections eliminate middlemen, cutting costs by up to 25%.",
  },
  {
    icon: Truck,
    title: "Smart Logistics",
    description: "AI-powered route optimization ensures cold chain integrity from Cameron Highlands to KL.",
  },
  {
    icon: BarChart3,
    title: "Data Transparency",
    description: "Real-time pricing, weather forecasts, and demand signals help you make informed decisions.",
  },
];

const MissionSection = () => {
  return (
    <section id="mission" className="py-24 relative">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3">Our Mission</p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            From Farm Surplus to <span className="text-gradient-primary">Full Shelves</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Malaysia wastes ~17,000 tonnes of food daily. Foodlysis closes the gap between 
            overproduction and unmet demand through technology.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 hover:border-primary/30 transition-colors group"
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <pillar.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{pillar.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
