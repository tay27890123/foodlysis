import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Sparkles, History, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface InsightResult {
  query: string;
  summary: string;
}

const CropInsightForm = () => {
  const [query, setQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: history } = useQuery({
    queryKey: ["crop-insights-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_insights")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (q: string): Promise<InsightResult> => {
      const { data, error } = await supabase.functions.invoke("crop-insight", {
        body: { query: q },
      });
      if (error) throw error;
      return data as InsightResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crop-insights-history"] });
    },
    onError: (err: Error) => {
      toast.error("Failed to get insight", { description: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    mutation.mutate(query.trim());
  };

  const handleQuickQuery = (q: string) => {
    setQuery(q);
    mutation.mutate(q);
  };

  const quickQueries = ["Chicken price trend", "Rice supply in Kedah", "Palm oil export outlook", "Vegetable prices KL"];

  return (
    <div className="space-y-6">
      {/* Ask Form */}
      <Card className="border-primary/30 bg-gradient-to-br from-card/80 to-primary/5 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Ask About Any Crop or Food Product
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Get AI-powered market intelligence for Malaysian agricultural products
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g. What's the current price of durian in Pahang?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 bg-card/60 border-border/50"
                disabled={mutation.isPending}
              />
            </div>
            <Button type="submit" disabled={mutation.isPending || !query.trim()}>
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Analyze</span>
            </Button>
          </form>

          {/* Quick queries */}
          <div className="mt-3 flex flex-wrap gap-2">
            {quickQueries.map((q) => (
              <Badge
                key={q}
                variant="outline"
                className="cursor-pointer border-primary/20 text-xs hover:bg-primary/10 transition-colors"
                onClick={() => handleQuickQuery(q)}
              >
                {q}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Result */}
      <AnimatePresence mode="wait">
        {mutation.isPending && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="mr-3 h-6 w-6 animate-spin text-primary" />
                <span className="text-muted-foreground">Analyzing market data…</span>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {mutation.data && !mutation.isPending && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-primary/30 bg-gradient-to-br from-card/90 to-emerald-500/5 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Market Insight
                  </CardTitle>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                    {mutation.data.query}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm prose-invert max-w-none text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {mutation.data.summary}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent History */}
      {history && history.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <History className="h-4 w-4" />
            Recent Queries
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {history.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="group h-full cursor-pointer border-border/40 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-md"
                  onClick={() => handleQuickQuery(item.query)}
                >
                  <CardContent className="p-4">
                    <p className="mb-2 text-sm font-medium text-foreground">{item.query}</p>
                    <p className="line-clamp-3 text-xs text-muted-foreground leading-relaxed">
                      {item.summary}
                    </p>
                    <p className="mt-2 text-[10px] text-muted-foreground/50">
                      {new Date(item.created_at).toLocaleDateString("en-MY", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CropInsightForm;
