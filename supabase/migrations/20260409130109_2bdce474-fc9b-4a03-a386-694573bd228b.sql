
CREATE TABLE public.market_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  query TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.market_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view insights"
ON public.market_insights FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert insights"
ON public.market_insights FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete own insights"
ON public.market_insights FOR DELETE
USING (auth.uid() = user_id);
