import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, ShoppingCart, Store, RefreshCw, ExternalLink, Loader2, Search, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { fetchAllInsights, type DynamicInsight, type InsightTopic } from "@/services/openDOSM";
import { useMemo, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const categoryConfig: Record<string, { icon: typeof Store; className: string }> = {
  Seller: { icon: Store, className: "bg-primary/20 text-primary border-primary/30" },
  Buyer: { icon: ShoppingCart, className: "bg-secondary/20 text-secondary border-secondary/30" },
};

const topicStyles: Record<InsightTopic, string> = {
  Price: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Inflation: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Import: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  Export: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  Trade: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  Production: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Supply: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  Industry: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Marketplace: "bg-pink-500/15 text-pink-400 border-pink-500/30",
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
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className={cat.className}>
                <CatIcon className="mr-1 h-3 w-3" />
                {item.category}
              </Badge>
              <Badge variant="outline" className={topicStyles[item.topic] ?? "bg-muted/20 text-muted-foreground border-border/30"}>
                {item.topic}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
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

const AIAnalysisCard = ({ insights }: { insights: DynamicInsight[] }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const payload = insights.map(i => ({
        title: i.title,
        description: i.description,
        category: i.category,
        topic: i.topic,
        status: i.status,
        value: i.value,
      }));

      const { data, error } = await supabase.functions.invoke("ai-insights", {
        body: { insights: payload },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setAnalysis(data.analysis);
    } catch (err: any) {
      console.error("AI analysis error:", err);
      toast.error("Failed to generate AI analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [insights]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card/80 to-secondary/5 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Market Analysis</CardTitle>
                <p className="text-sm text-muted-foreground">Powered by Lovable AI — analyzes your live data</p>
              </div>
            </div>
            <Button
              onClick={generateAnalysis}
              disabled={loading}
              size="sm"
              className="shrink-0"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {analysis ? "Regenerate" : "Generate Analysis"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!analysis && !loading && (
            <p className="text-sm text-muted-foreground italic">
              Click "Generate Analysis" to get AI-powered insights from your live market data.
            </p>
          )}
          {loading && (
            <div className="flex items-center gap-3 py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm">Analyzing {insights.length} data points…</span>
            </div>
          )}
          {analysis && !loading && (
            <div className="prose prose-sm prose-invert max-w-none text-foreground [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_ul]:mt-1 [&_li]:text-muted-foreground [&_strong]:text-foreground">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          )}
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
                {" & AI-powered analysis"}
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

          <div className="relative mt-4 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search insights… e.g. CPI, chicken, export"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9 bg-card/60 border-border/50"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
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
            {/* AI Analysis Section */}
            <section>
              <AIAnalysisCard insights={insights} />
            </section>

            {/* Seller Section */}
            {sellerInsights.length > 0 && (
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
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/40" /></div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-sm text-muted-foreground">·  ·  ·</span>
              </div>
            </div>

            {/* Buyer Section */}
            {buyerInsights.length > 0 && (
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
            )}
          </div>
        )}

        {insights && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Search className="mb-4 h-8 w-8 text-muted-foreground/40" />
            <p>{search ? `No insights matching "${search}"` : "No insights available at the moment."}</p>
            {search && (
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setSearch("")}>Clear search</Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Insights;
