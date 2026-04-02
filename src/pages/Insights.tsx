import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, ShoppingCart, Store, RefreshCw, ExternalLink, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { fetchAllInsights, type DynamicInsight } from "@/services/openDOSM";
import { useMemo, useState } from "react";

const categoryConfig: Record<string, { icon: typeof Store; className: string }> = {
  Seller: { icon: Store, className: "bg-primary/20 text-primary border-primary/30" },
  Buyer: { icon: ShoppingCart, className: "bg-secondary/20 text-secondary border-secondary/30" },
};

const statusConfig: Record<string, { className: string; label: string; dot: string; pulse?: boolean }> = {
  Normal: { className: "text-primary", label: "Normal", dot: "bg-primary" },
  Warning: { className: "text-accent", label: "Warning", dot: "bg-accent" },
  Critical: { className: "text-destructive", label: "Critical", dot: "bg-destructive" },
  Live: { className: "text-emerald-400", label: "Live", dot: "bg-emerald-400", pulse: true },
};

const InsightCard = ({ item, index }: { item: DynamicInsight; index: number }) => {
  const cat = categoryConfig[item.category] ?? categoryConfig.Seller;
  const stat = statusConfig[item.status] ?? statusConfig.Normal;
  const CatIcon = cat.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card className="group h-full border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <Badge variant="outline" className={cat.className}>
              <CatIcon className="mr-1 h-3 w-3" />
              {item.category}
            </Badge>
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${stat.dot} ${stat.pulse ? "animate-pulse" : ""}`} />
              <span className={`text-xs font-medium ${stat.className}`}>{stat.label}</span>
            </div>
          </div>
          <div className="mt-3 flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold leading-snug">{item.title}</CardTitle>
            {item.value && (
              <span className={`shrink-0 rounded-md px-2 py-0.5 text-sm font-bold ${
                item.status === "Critical" ? "bg-destructive/20 text-destructive" :
                item.status === "Warning" ? "bg-accent/20 text-accent" :
                "bg-primary/20 text-primary"
              }`}>
                {item.value}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground/60">{item.timestamp}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground/40">
              <ExternalLink className="h-3 w-3" />
              {item.source}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Insights = () => {
  const { data: insights, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["dosm-insights"],
    queryFn: fetchAllInsights,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!insights) return [];
    if (!search.trim()) return insights;
    const q = search.toLowerCase();
    return insights.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.value?.toLowerCase().includes(q) ||
      i.source.toLowerCase().includes(q)
    );
  }, [insights, search]);

  const sellerInsights = useMemo(() => filtered.filter(i => i.category === "Seller"), [filtered]);
  const buyerInsights = useMemo(() => filtered.filter(i => i.category === "Buyer"), [filtered]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold">Malaysia Market Insights</h1>
              <p className="mt-2 text-muted-foreground">
                Live market intelligence powered by{" "}
                <a href="https://open.dosm.gov.my" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
                  OpenDOSM
                </a>
                ,{" "}
                <a href="https://data.gov.my" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
                  data.gov.my
                </a>
                {" & marketplace data"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="shrink-0"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
            <p>Fetching live data from OpenDOSM…</p>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <AlertTriangle className="mb-4 h-8 w-8 text-destructive" />
            <p className="mb-4">Failed to load insights.</p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        )}

        {insights && insights.length > 0 && (
          <div className="space-y-10">
            {/* Seller Section */}
            <section>
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">For Sellers</h2>
                  <p className="text-sm text-muted-foreground">Pricing trends, demand signals & export opportunities</p>
                </div>
                <Badge variant="outline" className="ml-auto border-primary/30 text-primary">{sellerInsights.length} insights</Badge>
              </motion.div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sellerInsights.map((item, i) => (
                  <InsightCard key={item.id} item={item} index={i} />
                ))}
              </div>
            </section>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/40" /></div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-sm text-muted-foreground">·  ·  ·</span>
              </div>
            </div>

            {/* Buyer Section */}
            <section>
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/15">
                  <ShoppingCart className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">For Buyers</h2>
                  <p className="text-sm text-muted-foreground">Price alerts, supply availability & cost-saving opportunities</p>
                </div>
                <Badge variant="outline" className="ml-auto border-secondary/30 text-secondary">{buyerInsights.length} insights</Badge>
              </motion.div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {buyerInsights.map((item, i) => (
                  <InsightCard key={item.id} item={item} index={i} />
                ))}
              </div>
            </section>
          </div>
        )}

        {insights && insights.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <p>No insights available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Insights;
