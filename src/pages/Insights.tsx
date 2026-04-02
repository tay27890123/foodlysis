import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, CloudRain, ShoppingCart, Truck, BarChart3, RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchAllInsights, type DynamicInsight } from "@/services/openDOSM";

const categoryConfig: Record<string, { icon: typeof BarChart3; className: string }> = {
  Price: { icon: BarChart3, className: "bg-primary/20 text-primary border-primary/30" },
  Supply: { icon: Truck, className: "bg-accent/20 text-accent border-accent/30" },
  Import: { icon: ShoppingCart, className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  Weather: { icon: CloudRain, className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  PriceCatcher: { icon: ShoppingCart, className: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
};

const statusConfig: Record<string, { icon: typeof TrendingUp; className: string; label: string; dot: string; pulse?: boolean }> = {
  Normal: { icon: TrendingUp, className: "text-primary", label: "Normal", dot: "bg-primary" },
  Warning: { icon: TrendingDown, className: "text-accent", label: "Warning", dot: "bg-accent" },
  Critical: { icon: AlertTriangle, className: "text-destructive", label: "Critical", dot: "bg-destructive" },
  Live: { icon: TrendingUp, className: "text-emerald-400", label: "Live", dot: "bg-emerald-400", pulse: true },
};

const InsightCard = ({ item, index }: { item: DynamicInsight; index: number }) => {
  const cat = categoryConfig[item.category];
  const stat = statusConfig[item.status];
  const CatIcon = cat.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold"><h1 className="font-display text-3xl font-bold">Malaysia Market Insights</h1></h1>
              <p className="mt-2 text-muted-foreground">
                Live market intelligence powered by{" "}
                <a href="https://open.dosm.gov.my" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
                  OpenDOSM
                </a>
                ,{" "}
                <a href="https://data.gov.my" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
                  data.gov.my
                </a>{" "}
                &amp;{" "}
                <a href="https://www.kpdn.gov.my" target="_blank" rel="noopener noreferrer" className="text-teal-400 underline underline-offset-2 hover:text-teal-300">
                  PriceCatcher (KPDN)
                </a>
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
            <p className="mb-4">Failed to load insights from OpenDOSM APIs.</p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        )}

        {insights && insights.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {insights.map((item, i) => (
              <InsightCard key={item.id} item={item} index={i} />
            ))}
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
