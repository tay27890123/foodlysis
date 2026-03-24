import { motion } from "framer-motion";
import { Upload, Search, Handshake, Truck } from "lucide-react";

const steps = [
  { icon: Upload, title: "List Surplus", description: "Suppliers post available surplus produce with quantity, price, and freshness window." },
  { icon: Search, title: "Match & Discover", description: "Buyers browse by category, location, or urgency. AI suggests optimal matches." },
  { icon: Handshake, title: "Negotiate & Confirm", description: "Direct P2P negotiation. Secure payment escrow protects both parties." },
  { icon: Truck, title: "Smart Delivery", description: "Route-optimized logistics with real-time tracking and cold chain monitoring." },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3">How It Works</p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold">
            Four Steps to <span className="text-gradient-primary">Less Waste</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="relative mx-auto mb-6">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center font-display">
                  {i + 1}
                </div>
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
