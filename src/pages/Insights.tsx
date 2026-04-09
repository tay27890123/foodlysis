import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, ShoppingCart, Store, RefreshCw, ExternalLink, Loader2, Search, X, Sparkles, Send, Leaf, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { fetchAllInsights, type DynamicInsight, type InsightTopic } from "@/services/openDOSM";
import { useMemo, useState } from "react";
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <Card className="group h-full border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className={cat.className}><CatIcon className="mr-1 h-3 w-3" />{item.category}</Badge>
              <Badge variant="outline" className={topicStyles[item.topic] ?? "bg-muted/20 text-muted-foreground border-border/30"}>{item.topic}</Badge>
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
              }`}>{item.value}</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground/60">{item.timestamp}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground/40"><ExternalLink className="h-3 w-3" />{item.source}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/* ─── AI Crop Query Section ─── */
interface AiResult { query: string; summary: string; timestamp: string }

const AiCropSection = () => {
  const [cropQuery, setCropQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AiResult[]>([]);

  const askAboutCrop = async () => {
    if (!cropQuery.trim() || cropQuery.trim().length < 2) {
      toast.error("Please enter a crop name (at least 2 characters)");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("crop-insights", {
        body: { query: cropQuery.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResults(prev => [
        { query: data.query, summary: data.summary, timestamp: new Date().toLocaleString() },
        ...prev,
      ]);
      setCropQuery("");
      toast.success(`Analysis ready for "${data.query}"`);
    } catch (e: any) {
      toast.error(e.message || "Failed to get crop analysis");
    } finally {
      setLoading(false);
    }
  };

  const suggestedCrops = ["Rice (Padi)", "Palm Oil", "Durian", "Chicken", "Rubber", "Vegetables"];

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-10">
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card/80 to-card/60 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Ask About Any Crop</CardTitle>
              <p className="text-sm text-muted-foreground">AI-powered market analysis for Malaysian agriculture</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Leaf className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
              <Input
                placeholder="e.g. Durian, Palm Oil, Chicken…"
                value={cropQuery}
                onChange={e => setCropQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && askAboutCrop()}
                className="pl-9 bg-background/60 border-primary/20 focus:border-primary/50"
                disabled={loading}
              />
            </div>
            <Button onClick={askAboutCrop} disabled={loading || cropQuery.trim().length < 2} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Analyze
            </Button>
          </div>

          {/* Suggested crops */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center">Try:</span>
            {suggestedCrops.map(crop => (
              <button
                key={crop}
                onClick={() => { setCropQuery(crop); }}
                className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary hover:bg-primary/15 transition-colors"
              >
                {crop}
              </button>
            ))}
          </div>

          {/* Results */}
          <AnimatePresence>
            {results.map((r, i) => (
              <motion.div
                key={`${r.query}-${r.timestamp}`}
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/15 text-primary border-primary/30">
                          <Leaf className="mr-1 h-3 w-3" />
                          {r.query}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-border/30">
                          <Sparkles className="mr-1 h-3 w-3" /> AI Analysis
                        </Badge>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                        <Clock className="h-3 w-3" /> {r.timestamp}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="prose prose-sm prose-invert max-w-none text-sm text-foreground/90 [&_h1]:text-base [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:my-1 [&_li]:my-0.5 [&_strong]:text-primary/90 whitespace-pre-wrap leading-relaxed">
                      {r.summary}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.section>
  );
};

/* ─── Main Page ─── */
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
                <a href="https://open.dosm.gov.my" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">OpenDOSM</a>
                ,{" "}
                <a href="https://data.gov.my" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">data.gov.my</a>
                {" & AI analysis"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="shrink-0">
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </motion.div>

        {/* AI Crop Query */}
        <AiCropSection />

        {/* Search bar */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search insights… e.g. CPI, chicken, export" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-9 bg-card/60 border-border/50" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          )}
        </div>

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
            <Button variant="outline" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" /> Try Again</Button>
          </div>
        )}

        {insights && filtered.length > 0 && (
          <div className="space-y-10">
            <section>
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15"><Store className="h-5 w-5 text-primary" /></div>
                <div>
                  <h2 className="font-display text-xl font-bold">For Sellers</h2>
                  <p className="text-sm text-muted-foreground">Pricing trends, demand signals & export opportunities</p>
                </div>
                <Badge variant="outline" className="ml-auto border-primary/30 text-primary">{sellerInsights.length} insights</Badge>
              </motion.div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sellerInsights.map((item, i) => <InsightCard key={item.id} item={item} index={i} />)}
              </div>
            </section>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/40" /></div>
              <div className="relative flex justify-center"><span className="bg-background px-4 text-sm text-muted-foreground">·  ·  ·</span></div>
            </div>

            <section>
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/15"><ShoppingCart className="h-5 w-5 text-secondary" /></div>
                <div>
                  <h2 className="font-display text-xl font-bold">For Buyers</h2>
                  <p className="text-sm text-muted-foreground">Price alerts, supply availability & cost-saving opportunities</p>
                </div>
                <Badge variant="outline" className="ml-auto border-secondary/30 text-secondary">{buyerInsights.length} insights</Badge>
              </motion.div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {buyerInsights.map((item, i) => <InsightCard key={item.id} item={item} index={i} />)}
              </div>
            </section>
          </div>
        )}

        {insights && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Search className="mb-4 h-8 w-8 text-muted-foreground/40" />
            <p>{search ? `No insights matching "${search}"` : "No insights available at the moment."}</p>
            {search && <Button variant="outline" size="sm" className="mt-3" onClick={() => setSearch("")}>Clear search</Button>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Insights;
