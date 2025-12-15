-- Settings table for user strategy parameters
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cash_target_percent NUMERIC NOT NULL DEFAULT 30,
  stocks_target_percent NUMERIC NOT NULL DEFAULT 70,
  monthly_contribution_total NUMERIC NOT NULL DEFAULT 0,
  contribution_split_cash_percent NUMERIC NOT NULL DEFAULT 30,
  contribution_split_stocks_percent NUMERIC NOT NULL DEFAULT 70,
  ammo_tranche_count INTEGER NOT NULL DEFAULT 3,
  tranche_1_trigger NUMERIC NOT NULL DEFAULT 10,
  tranche_2_trigger NUMERIC NOT NULL DEFAULT 20,
  tranche_3_trigger NUMERIC NOT NULL DEFAULT 30,
  rebuild_threshold NUMERIC NOT NULL DEFAULT 10,
  stop_cash_threshold NUMERIC NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Portfolio snapshots with unique constraint for upsert
CREATE TABLE public.portfolio_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  snapshot_month DATE NOT NULL,
  cash_value NUMERIC NOT NULL,
  stocks_value NUMERIC NOT NULL,
  total_value NUMERIC GENERATED ALWAYS AS (cash_value + stocks_value) STORED,
  cash_percent NUMERIC GENERATED ALWAYS AS (
    CASE WHEN (cash_value + stocks_value) > 0 
    THEN ROUND((cash_value / (cash_value + stocks_value)) * 100, 2) 
    ELSE 0 END
  ) STORED,
  stocks_percent NUMERIC GENERATED ALWAYS AS (
    CASE WHEN (cash_value + stocks_value) > 0 
    THEN ROUND((stocks_value / (cash_value + stocks_value)) * 100, 2) 
    ELSE 0 END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_snapshot_month UNIQUE (user_id, snapshot_month)
);

-- Market state for SPY data
CREATE TABLE public.market_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ticker TEXT NOT NULL DEFAULT 'SPY',
  last_price NUMERIC NOT NULL,
  high_52w NUMERIC NOT NULL,
  drawdown_percent NUMERIC GENERATED ALWAYS AS (
    CASE WHEN high_52w > 0 
    THEN ROUND(((high_52w - last_price) / high_52w) * 100, 2) 
    ELSE 0 END
  ) STORED,
  as_of_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ammo state for tranche tracking
CREATE TABLE public.ammo_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  tranche_1_used BOOLEAN NOT NULL DEFAULT false,
  tranche_2_used BOOLEAN NOT NULL DEFAULT false,
  tranche_3_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Recommendations log
CREATE TABLE public.recommendations_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  snapshot_id UUID REFERENCES public.portfolio_snapshots(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,
  recommendation_text TEXT NOT NULL,
  transfer_amount NUMERIC,
  drawdown_percent NUMERIC,
  market_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ammo_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations_log ENABLE ROW LEVEL SECURITY;

-- Settings policies
CREATE POLICY "Users can view own settings" ON public.settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.settings FOR UPDATE USING (auth.uid() = user_id);

-- Portfolio snapshots policies
CREATE POLICY "Users can view own snapshots" ON public.portfolio_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own snapshots" ON public.portfolio_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own snapshots" ON public.portfolio_snapshots FOR UPDATE USING (auth.uid() = user_id);

-- Market state policies
CREATE POLICY "Users can view own market state" ON public.market_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own market state" ON public.market_state FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ammo state policies
CREATE POLICY "Users can view own ammo state" ON public.ammo_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ammo state" ON public.ammo_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ammo state" ON public.ammo_state FOR UPDATE USING (auth.uid() = user_id);

-- Recommendations log policies
CREATE POLICY "Users can view own recommendations" ON public.recommendations_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recommendations" ON public.recommendations_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ammo_state_updated_at
  BEFORE UPDATE ON public.ammo_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();