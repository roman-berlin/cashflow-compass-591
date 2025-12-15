-- 1. Update settings table: add cash_min_pct and cash_max_pct
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS cash_min_pct NUMERIC NOT NULL DEFAULT 20;

ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS cash_max_pct NUMERIC NOT NULL DEFAULT 35;

-- 2. Update portfolio_snapshots: add 3-bucket columns (keep old columns for now)
ALTER TABLE public.portfolio_snapshots
ADD COLUMN IF NOT EXISTS value_sp NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS value_ta NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS percent_sp NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS percent_ta NUMERIC DEFAULT 0;

-- Migrate existing data: copy stocks_value to value_sp
UPDATE public.portfolio_snapshots 
SET value_sp = COALESCE(stocks_value, 0), 
    percent_sp = COALESCE(stocks_percent, 0),
    value_ta = 0,
    percent_ta = 0;

-- 3. Create contributions table
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  snapshot_id UUID REFERENCES public.portfolio_snapshots(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  contribution_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(snapshot_id)
);

-- Enable RLS on contributions
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- RLS policies for contributions
CREATE POLICY "Users can view own contributions"
ON public.contributions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contributions"
ON public.contributions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contributions"
ON public.contributions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contributions"
ON public.contributions
FOR DELETE
USING (auth.uid() = user_id);