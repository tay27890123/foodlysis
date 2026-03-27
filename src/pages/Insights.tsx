import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, CloudRain, ShoppingCart, Truck, BarChart3, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

interface Insight {
  id: number;
  title: string;
  description: string;
  category: "Price" | "Supply" | "Import" | "Weather";
  timestamp: string;
  status: "Normal" | "Warning" | "Critical";
}

const insights: Insight[] = [
  { id: 1, title: "Vegetable Prices Increasing", description: "Cameron Highlands lettuce and tomato prices rose 12% due to recent flooding affecting crop yields.", category: "Price", timestamp: "Updated 2 hours ago", status: "Warning" },
  { id: 2, title: "Rice Supply Stable Nationwide", description: "Domestic rice stocks remain at healthy levels with no disruptions expected through Q2.", category: "Supply", timestamp: "Updated 4 hours ago", status: "Normal" },
  { id: 3, title: "Seafood Import Delays from Thailand", description: "Border congestion at Padang Besar causing 48-hour delays on frozen seafood shipments.", category: "Import", timestamp: "Updated 1 hour ago", status: "Critical" },
  { id: 4, title: "Monsoon Alert for East Coast", description: "Heavy rainfall forecast for Kelantan and Terengganu may disrupt palm oil and poultry transport routes.", category: "Weather", timestamp: "Updated 30 minutes ago", status: "Critical" },
  { id: 5, title: "Palm Oil Prices Declining", description: "Global palm oil futures dropped 5% this week, benefiting local food manufacturers.", category: "Price", timestamp: "Updated 6 hours ago", status: "Normal" },
  { id: 6, title: "Poultry Supply Tightening in Johor", description: "Increased demand from Singapore and reduced farm output creating short-term supply pressure.", category: "Supply", timestamp: "Updated 3 hours ago", status: "Warning" },
  { id: 7, title: "Onion Imports Normalized", description: "Indian onion export ban lifted — prices expected to stabilize within two weeks.", category: "Import", timestamp: "Updated 8 hours ago", status: "Normal" },
  { id: 8, title: "Heatwave Impacting Sabah Crops", description: "Extended dry spell reducing yields for cocoa and vegetable farms across Sabah's interior.", category: "Weather", timestamp: "Updated 5 hours ago", status: "Warning" },
];

const categoryConfig = {
  Price: { icon: BarChart3, className: "bg-primary/20 text-primary border-primary/30" },
  Supply: { icon: Truck, className: "bg-accent/20 text-accent border-accent/30" },
  Import: { icon: ShoppingCart, className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  Weather: { icon: CloudRain, className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
};

const statusConfig = {
  Normal: { icon: TrendingUp, className: "text-primary", label: "Normal", dot: "bg-primary" },
  Warning: { icon: TrendingDown, className: "text-accent", label: "Warning", dot: "bg-accent" },
  Critical: { icon: AlertTriangle, className: "text-destructive", label: "Critical", dot: "bg-destructive" },
};

const Insights = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="container pt-24 pb-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>
        <h1 className="font-display text-3xl font-bold">Food Supply Insights</h1>
        <p className="mt-2 text-muted-foreground">Real-time market intelligence across Malaysia's food supply chain.</p>
      </motion.div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {insights.map((item, i) => {
          const cat = categoryConfig[item.category];
          const stat = statusConfig[item.status];
          const CatIcon = cat.icon;
          const StatIcon = stat.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="group h-full border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className={cat.className}>
                      <CatIcon className="mr-1 h-3 w-3" />
                      {item.category}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${stat.dot}`} />
                      <span className={`text-xs font-medium ${stat.className}`}>{stat.label}</span>
                    </div>
                  </div>
                  <CardTitle className="mt-3 text-base font-semibold leading-snug">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  <p className="mt-4 text-xs text-muted-foreground/60">{item.timestamp}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  </div>
);

export default Insights;
