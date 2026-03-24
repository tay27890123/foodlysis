import { motion } from "framer-motion";
import { Cloud, MapPin, ShieldCheck, Zap } from "lucide-react";

const features = [
  { icon: Cloud, title: "Weather Intelligence", description: "Live weather data impacts pricing and supply predictions. Monsoon-aware scheduling." },
  { icon: MapPin, title: "Route Optimization", description: "Intelligent routing across Peninsular and East Malaysia reduces transit time by 35%." },
  { icon: ShieldCheck, title: "Halal & Quality Assured", description: "Built-in JAKIM halal verification and MyGAP certification tracking." },
  { icon: Zap, title: "Real-Time Pricing", description: "Dynamic pricing engine adjusts for freshness window, distance, and market demand." },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3">Platform Features</p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold">
            Built for Malaysia's <span className="text-gradient-primary">Food Ecosystem</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 flex gap-4 items-start hover:border-primary/30 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
