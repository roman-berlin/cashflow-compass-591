import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, TrendingDown, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { runStrategy, calculateDrawdown, type StrategyResult, type MarketStatus } from '@/lib/strategy';
import type { Tables } from '@/integrations/supabase/types';

const marketStatusConfig: Record<MarketStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof TrendingUp }> = {
  normal: { label: 'Normal', variant: 'secondary', icon: TrendingUp },
  correction: { label: 'Correction', variant: 'outline', icon: TrendingDown },
  bear: { label: 'Bear Market', variant: 'destructive', icon: AlertTriangle },
  crash: { label: 'Crash', variant: 'destructive', icon: AlertTriangle },
};

export default function Update() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [fetchingMarket, setFetchingMarket] = useState(false);
  const [saving, setSaving] = useState(false);

  const [cashValue, setCashValue] = useState(0);
  const [stocksValue, setStocksValue] = useState(0);
  const [marketData, setMarketData] = useState<{ last_price: number; high_52w: number; as_of_date: string } | null>(null);
  const [settings, setSettings] = useState<Tables<'settings'> | null>(null);
  const [ammoState, setAmmoState] = useState<Tables<'ammo_state'> | null>(null);
  const [recommendation, setRecommendation] = useState<StrategyResult | null>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    const [settingsRes, ammoRes, snapshotRes] = await Promise.all([
      supabase.from('settings').select('*').eq('user_id', user!.id).maybeSingle(),
      supabase.from('ammo_state').select('*').eq('user_id', user!.id).maybeSingle(),
      supabase.from('portfolio_snapshots').select('*').eq('user_id', user!.id).order('snapshot_month', { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (settingsRes.data) setSettings(settingsRes.data);
    if (ammoRes.data) setAmmoState(ammoRes.data);
    if (snapshotRes.data) {
      setCashValue(Number(snapshotRes.data.cash_value));
      setStocksValue(Number(snapshotRes.data.stocks_value));
    }
    setLoading(false);
  };

  const fetchMarketData = async () => {
    setFetchingMarket(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-market-data');
      if (error) throw error;
      setMarketData(data);
      toast({ title: 'Market data updated!' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setFetchingMarket(false);
    }
  };

  const runStrategyEngine = () => {
    if (!settings || !marketData) {
      toast({ variant: 'destructive', title: 'Missing data', description: 'Please fetch market data and ensure settings are configured.' });
      return;
    }

    const totalValue = cashValue + stocksValue;
    const portfolio = {
      cashValue,
      stocksValue,
      totalValue,
      cashPercent: totalValue > 0 ? (cashValue / totalValue) * 100 : 0,
      stocksPercent: totalValue > 0 ? (stocksValue / totalValue) * 100 : 0,
    };

    const drawdownPercent = calculateDrawdown(marketData.last_price, marketData.high_52w);
    const market = {
      lastPrice: marketData.last_price,
      high52w: marketData.high_52w,
      drawdownPercent,
    };

    const ammo = {
      tranche1Used: ammoState?.tranche_1_used ?? false,
      tranche2Used: ammoState?.tranche_2_used ?? false,
      tranche3Used: ammoState?.tranche_3_used ?? false,
    };

    const result = runStrategy(portfolio, market, ammo, settings);
    setRecommendation(result);
  };

  const saveUpdate = async () => {
    if (!settings || !marketData || !recommendation) return;
    setSaving(true);

    const today = new Date();
    const snapshotMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const totalValue = cashValue + stocksValue;
    const drawdownPercent = calculateDrawdown(marketData.last_price, marketData.high_52w);

    try {
      // Save portfolio snapshot
      const { data: snapshot, error: snapshotError } = await supabase
        .from('portfolio_snapshots')
        .upsert({
          user_id: user!.id,
          snapshot_month: snapshotMonth,
          cash_value: cashValue,
          stocks_value: stocksValue,
          total_value: totalValue,
          cash_percent: totalValue > 0 ? (cashValue / totalValue) * 100 : 0,
          stocks_percent: totalValue > 0 ? (stocksValue / totalValue) * 100 : 0,
        }, { onConflict: 'user_id,snapshot_month' })
        .select()
        .single();

      if (snapshotError) throw snapshotError;

      // Save market state
      await supabase.from('market_state').insert({
        user_id: user!.id,
        ticker: 'SPY',
        last_price: marketData.last_price,
        high_52w: marketData.high_52w,
        as_of_date: marketData.as_of_date,
        drawdown_percent: drawdownPercent,
      });

      // Save recommendation
      await supabase.from('recommendations_log').insert({
        user_id: user!.id,
        snapshot_id: snapshot.id,
        recommendation_type: recommendation.recommendation_type,
        recommendation_text: recommendation.recommendation_text,
        transfer_amount: recommendation.transfer_amount,
        drawdown_percent: drawdownPercent,
        market_status: recommendation.market_status,
      });

      // Update ammo state and send email alert if ammo was fired
      if (recommendation.recommendation_type.startsWith('FIRE_AMMO')) {
        const updates = {
          user_id: user!.id,
          tranche_1_used: recommendation.recommendation_type === 'FIRE_AMMO_1' ? true : (ammoState?.tranche_1_used ?? false),
          tranche_2_used: recommendation.recommendation_type === 'FIRE_AMMO_2' ? true : (ammoState?.tranche_2_used ?? false),
          tranche_3_used: recommendation.recommendation_type === 'FIRE_AMMO_3' ? true : (ammoState?.tranche_3_used ?? false),
        };
        
        await supabase.from('ammo_state').upsert(updates, { onConflict: 'user_id' });

        // Send email alert
        try {
          await supabase.functions.invoke('send-ammo-alert', {
            body: {
              email: user!.email,
              recommendation_type: recommendation.recommendation_type,
              recommendation_text: recommendation.recommendation_text,
              drawdown_percent: drawdownPercent,
              transfer_amount: recommendation.transfer_amount,
              market_status: recommendation.market_status,
            },
          });
          toast({ title: 'Email alert sent!' });
        } catch (emailErr) {
          console.error('Failed to send email alert:', emailErr);
        }
      }

      toast({ title: 'Update saved!' });
      setRecommendation(null);
      loadData();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!settings) {
    return (
      <Layout>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Settings Required</AlertTitle>
          <AlertDescription>Please configure your settings before creating an update.</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const StatusConfig = recommendation ? marketStatusConfig[recommendation.market_status] : null;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Monthly Update</h1>
          <p className="text-muted-foreground">Enter your current portfolio values and get a recommendation</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Values</CardTitle>
            <CardDescription>Enter your current account balances</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cash Value ($)</Label>
              <Input
                type="number"
                value={cashValue}
                onChange={(e) => setCashValue(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Stocks Value ($)</Label>
              <Input
                type="number"
                value={stocksValue}
                onChange={(e) => setStocksValue(parseFloat(e.target.value) || 0)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Data</CardTitle>
            <CardDescription>SPY market information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={fetchMarketData} disabled={fetchingMarket} variant="outline" className="w-full">
              {fetchingMarket ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Fetch Market Data
            </Button>
            {marketData && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Last Price</p>
                  <p className="text-xl font-bold">${marketData.last_price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">52-Week High</p>
                  <p className="text-xl font-bold">${marketData.high_52w.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Drawdown</p>
                  <p className="text-xl font-bold text-destructive">
                    -{calculateDrawdown(marketData.last_price, marketData.high_52w).toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button onClick={runStrategyEngine} disabled={!marketData} className="w-full">
          Run Strategy Engine
        </Button>

        {recommendation && StatusConfig && (
          <Alert>
            <StatusConfig.icon className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">
              Recommendation
              <Badge variant={StatusConfig.variant}>{StatusConfig.label}</Badge>
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p className="font-medium">{recommendation.recommendation_type.replace(/_/g, ' ')}</p>
              <p className="mt-1">{recommendation.recommendation_text}</p>
            </AlertDescription>
          </Alert>
        )}

        {recommendation && (
          <Button onClick={saveUpdate} disabled={saving} className="w-full">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Save Update
          </Button>
        )}
      </div>
    </Layout>
  );
}
