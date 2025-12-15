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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, TrendingDown, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { runStrategy, calculateDrawdown, type StrategyResult, type MarketStatus } from '@/lib/strategy';
import { getCurrencySymbol, formatCurrency } from '@/lib/currency';
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

  // 3-bucket portfolio values
  const [valueSp, setValueSp] = useState(0);
  const [valueTa, setValueTa] = useState(0);
  const [valueCash, setValueCash] = useState(0);

  // Contribution tracking
  const [contributionAmount, setContributionAmount] = useState(0);
  const [contributionCurrency, setContributionCurrency] = useState<'USD' | 'ILS'>('USD');
  const [contributionType, setContributionType] = useState<'monthly' | 'bonus' | 'adjustment'>('monthly');

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

    if (settingsRes.data) {
      setSettings(settingsRes.data);
      setContributionCurrency((settingsRes.data.currency as 'USD' | 'ILS') || 'USD');
    }
    if (ammoRes.data) setAmmoState(ammoRes.data);
    if (snapshotRes.data) {
      setValueSp(Number(snapshotRes.data.value_sp) || 0);
      setValueTa(Number(snapshotRes.data.value_ta) || 0);
      setValueCash(Number(snapshotRes.data.cash_value) || 0);
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

    const totalValue = valueSp + valueTa + valueCash;
    const portfolio = {
      valueCash,
      valueSp,
      valueTa,
      totalValue,
      percentCash: totalValue > 0 ? (valueCash / totalValue) * 100 : 0,
      percentSp: totalValue > 0 ? (valueSp / totalValue) * 100 : 0,
      percentTa: totalValue > 0 ? (valueTa / totalValue) * 100 : 0,
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
    if (!settings) return;
    setSaving(true);

    const today = new Date();
    const snapshotMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const totalValue = valueSp + valueTa + valueCash;
    const drawdownPercent = marketData ? calculateDrawdown(marketData.last_price, marketData.high_52w) : null;

    try {
      // Save portfolio snapshot (3-bucket model)
      // Note: Using both old column names (cash_value, stocks_value) and new ones (value_sp, value_ta)
      const { data: snapshot, error: snapshotError } = await supabase
        .from('portfolio_snapshots')
        .upsert({
          user_id: user!.id,
          snapshot_month: snapshotMonth,
          cash_value: valueCash,
          stocks_value: valueSp + valueTa, // Legacy column for backward compat
          value_sp: valueSp,
          value_ta: valueTa,
          total_value: totalValue,
          cash_percent: totalValue > 0 ? (valueCash / totalValue) * 100 : 0,
          stocks_percent: totalValue > 0 ? ((valueSp + valueTa) / totalValue) * 100 : 0,
          percent_sp: totalValue > 0 ? (valueSp / totalValue) * 100 : 0,
          percent_ta: totalValue > 0 ? (valueTa / totalValue) * 100 : 0,
        }, { onConflict: 'user_id,snapshot_month' })
        .select()
        .single();

      if (snapshotError) throw snapshotError;

      // Save contribution (Option A: overwrite existing for this snapshot)
      if (contributionAmount > 0) {
        await supabase
          .from('contributions')
          .upsert({
            user_id: user!.id,
            snapshot_id: snapshot.id,
            amount: contributionAmount,
            currency: contributionCurrency,
            contribution_type: contributionType,
          }, { onConflict: 'snapshot_id' });
      }

      // Only save market state and recommendation if market data is available
      if (marketData && recommendation) {
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

        // Update ammo state and create in-app notification if ammo was fired
        if (recommendation.recommendation_type.startsWith('FIRE_AMMO')) {
          const updates = {
            user_id: user!.id,
            tranche_1_used: recommendation.recommendation_type === 'FIRE_AMMO_1' ? true : (ammoState?.tranche_1_used ?? false),
            tranche_2_used: recommendation.recommendation_type === 'FIRE_AMMO_2' ? true : (ammoState?.tranche_2_used ?? false),
            tranche_3_used: recommendation.recommendation_type === 'FIRE_AMMO_3' ? true : (ammoState?.tranche_3_used ?? false),
          };
          
          await supabase.from('ammo_state').upsert(updates, { onConflict: 'user_id' });
        }

        // Create in-app notification for the recommendation
        const notificationTitle = recommendation.recommendation_type.startsWith('FIRE_AMMO')
          ? `Tranche deployment recommended`
          : recommendation.recommendation_type === 'STOP_CASH_OVER_MAX'
          ? 'Cash allocation alert'
          : recommendation.recommendation_type === 'REBUILD_AMMO'
          ? 'Ammo rebuild recommended'
          : 'Strategy update';

        await supabase.from('notifications').insert({
          user_id: user!.id,
          title: notificationTitle,
          message: recommendation.recommendation_text,
          notification_type: 'recommendation',
          metadata: {
            recommendation_type: recommendation.recommendation_type,
            drawdown_percent: drawdownPercent,
            transfer_amount: recommendation.transfer_amount,
            market_status: recommendation.market_status,
          },
        });
      }

      toast({ title: 'Update saved!' });
      setRecommendation(null);
      setContributionAmount(0);
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
  const currencySymbol = getCurrencySymbol(settings.currency);
  const contribSymbol = getCurrencySymbol(contributionCurrency);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Monthly Update</h1>
          <p className="text-muted-foreground">Enter your current portfolio values and get a recommendation</p>
        </div>

        {/* 3-Bucket Portfolio Values */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Values</CardTitle>
            <CardDescription>Enter your current account balances (3 buckets)</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>S&P / SPY ({currencySymbol})</Label>
              <Input
                type="number"
                value={valueSp}
                onChange={(e) => setValueSp(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>TA-125 ({currencySymbol})</Label>
              <Input
                type="number"
                value={valueTa}
                onChange={(e) => setValueTa(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cash / MMF ({currencySymbol})</Label>
              <Input
                type="number"
                value={valueCash}
                onChange={(e) => setValueCash(parseFloat(e.target.value) || 0)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contribution Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>Contribution</CardTitle>
            <CardDescription>Record this month's contribution (optional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={contributionCurrency}
                  onValueChange={(v) => setContributionCurrency(v as 'USD' | 'ILS')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="ILS">ILS (₪)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={contributionType}
                  onValueChange={(v) => setContributionType(v as 'monthly' | 'bonus' | 'adjustment')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly deposit</SelectItem>
                    <SelectItem value="bonus">Bonus / one-time</SelectItem>
                    <SelectItem value="adjustment">Manual adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Data */}
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

        <Button onClick={saveUpdate} disabled={saving} className="w-full">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
          Save Update
        </Button>
      </div>
    </Layout>
  );
}
