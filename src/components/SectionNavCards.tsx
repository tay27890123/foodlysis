import { motion } from "framer-motion";
import { Target, Sparkles, ListOrdered } from "lucide-react";

const cards = [
  {
    icon: Target,
    label: "Our Mission",
    description: "Why we're reducing Malaysia's food waste",
    href: "#mission",
  },
  {
    icon: Sparkles,
    label: "Features",
    description: "Platform capabilities built for Malaysian food supply",
    href: "#features",
  },
  {
    icon: ListOrdered,
    label: "How It Works",
    description: "Four simple steps from surplus to sold",
    href: "#how-it-works",
  },
];

const SectionNavCards = () => {
  return (
    <section className="py-12 relative z-10 -mt-16">
      <div className="container">
        <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {cards.map((card, i) => (
            <motion.a
              key={card.label}
              href={card.href}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 flex flex-col items-center text-center gap-3 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group"
            >
              <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <card.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold">{card.label}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SectionNavCards;
