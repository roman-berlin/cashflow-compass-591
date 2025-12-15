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
import { Loader2, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { runStrategy, calculateDrawdown, type StrategyResult, type MarketStatus } from '@/lib/strategy';
import { getCurrencySymbol } from '@/lib/currency';
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
  const [marketDataLoading, setMarketDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Per-asset contribution inputs
  const [contributionSpy, setContributionSpy] = useState(0);
  const [contributionTa, setContributionTa] = useState(0);
  const [contributionCash, setContributionCash] = useState(0);
  const [contributionCurrency, setContributionCurrency] = useState<'USD' | 'NIS'>('NIS');

  // Portfolio values from last snapshot (for strategy engine)
  const [valueSp, setValueSp] = useState(0);
  const [valueTa, setValueTa] = useState(0);
  const [valueCash, setValueCash] = useState(0);

  const [marketData, setMarketData] = useState<{ last_price: number; high_52w: number; as_of_date: string } | null>(null);
  const [settings, setSettings] = useState<Tables<'settings'> | null>(null);
  const [ammoState, setAmmoState] = useState<Tables<'ammo_state'> | null>(null);
  const [recommendation, setRecommendation] = useState<StrategyResult | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
      fetchMarketData();
    }
  }, [user]);

  const loadData = async () => {
    const [settingsRes, ammoRes, snapshotRes] = await Promise.all([
      supabase.from('settings').select('*').eq('user_id', user!.id).maybeSingle(),
      supabase.from('ammo_state').select('*').eq('user_id', user!.id).maybeSingle(),
      supabase.from('portfolio_snapshots').select('*').eq('user_id', user!.id).order('snapshot_month', { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (settingsRes.data) {
      setSettings(settingsRes.data);
      setContributionCurrency(settingsRes.data.currency === 'ILS' ? 'NIS' : (settingsRes.data.currency as 'USD' | 'NIS') || 'NIS');
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
    setMarketDataLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-market-data');
      if (error) throw error;
      setMarketData(data);
    } catch (err: any) {
      // Silent failure - market data unavailable
      console.error('Failed to fetch market data:', err.message);
    } finally {
      setMarketDataLoading(false);
    }
  };

  const runStrategyEngine = () => {
    if (!settings || !marketData) return null;

    // Calculate new portfolio values after contributions
    const newValueSp = valueSp + contributionSpy;
    const newValueTa = valueTa + contributionTa;
    const newValueCash = valueCash + contributionCash;
    const totalValue = newValueSp + newValueTa + newValueCash;

    const portfolio = {
      valueCash: newValueCash,
      valueSp: newValueSp,
      valueTa: newValueTa,
      totalValue,
      percentCash: totalValue > 0 ? (newValueCash / totalValue) * 100 : 0,
      percentSp: totalValue > 0 ? (newValueSp / totalValue) * 100 : 0,
      percentTa: totalValue > 0 ? (newValueTa / totalValue) * 100 : 0,
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

    return runStrategy(portfolio, market, ammo, settings);
  };

  const saveUpdate = async () => {
    if (!settings) return;
    setSaving(true);

    const today = new Date();
    const snapshotMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    
    // Calculate new portfolio values after contributions
    const newValueSp = valueSp + contributionSpy;
    const newValueTa = valueTa + contributionTa;
    const newValueCash = valueCash + contributionCash;
    const totalValue = newValueSp + newValueTa + newValueCash;
    const totalContribution = contributionSpy + contributionTa + contributionCash;

    // Auto-run strategy if market data is available
    let strategyResult: StrategyResult | null = null;
    if (marketData && settings) {
      strategyResult = runStrategyEngine();
      setRecommendation(strategyResult);
    }

    const drawdownPercent = marketData ? calculateDrawdown(marketData.last_price, marketData.high_52w) : null;

    try {
      // Save portfolio snapshot (3-bucket model)
      // Note: total_value, cash_percent, stocks_percent are generated columns - don't include them
      const { data: snapshot, error: snapshotError } = await supabase
        .from('portfolio_snapshots')
        .upsert({
          user_id: user!.id,
          snapshot_month: snapshotMonth,
          cash_value: newValueCash,
          stocks_value: newValueSp + newValueTa,
          value_sp: newValueSp,
          value_ta: newValueTa,
          percent_sp: totalValue > 0 ? (newValueSp / totalValue) * 100 : 0,
          percent_ta: totalValue > 0 ? (newValueTa / totalValue) * 100 : 0,
        }, { onConflict: 'user_id,snapshot_month' })
        .select()
        .single();

      if (snapshotError) throw snapshotError;

      // Save contribution if any amount was entered
      if (totalContribution > 0) {
        await supabase
          .from('contributions')
          .upsert({
            user_id: user!.id,
            snapshot_id: snapshot.id,
            amount: totalContribution,
            currency: contributionCurrency,
            contribution_type: 'monthly',
          }, { onConflict: 'snapshot_id' });
      }

      // Only save market state and recommendation if market data is available
      if (marketData && strategyResult) {
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
          recommendation_type: strategyResult.recommendation_type,
          recommendation_text: strategyResult.recommendation_text,
          transfer_amount: strategyResult.transfer_amount,
          drawdown_percent: drawdownPercent,
          market_status: strategyResult.market_status,
        });

        // Update ammo state if ammo was fired
        if (strategyResult.recommendation_type.startsWith('FIRE_AMMO')) {
          const updates = {
            user_id: user!.id,
            tranche_1_used: strategyResult.recommendation_type === 'FIRE_AMMO_1' ? true : (ammoState?.tranche_1_used ?? false),
            tranche_2_used: strategyResult.recommendation_type === 'FIRE_AMMO_2' ? true : (ammoState?.tranche_2_used ?? false),
            tranche_3_used: strategyResult.recommendation_type === 'FIRE_AMMO_3' ? true : (ammoState?.tranche_3_used ?? false),
          };
          
          await supabase.from('ammo_state').upsert(updates, { onConflict: 'user_id' });
        }

        // Create in-app notification for the recommendation
        const notificationTitle = strategyResult.recommendation_type.startsWith('FIRE_AMMO')
          ? `Tranche deployment recommended`
          : strategyResult.recommendation_type === 'STOP_CASH_OVER_MAX'
          ? 'Cash allocation alert'
          : strategyResult.recommendation_type === 'REBUILD_AMMO'
          ? 'Ammo rebuild recommended'
          : 'Strategy update';

        await supabase.from('notifications').insert({
          user_id: user!.id,
          title: notificationTitle,
          message: strategyResult.recommendation_text,
          notification_type: 'recommendation',
          metadata: {
            recommendation_type: strategyResult.recommendation_type,
            drawdown_percent: drawdownPercent,
            transfer_amount: strategyResult.transfer_amount,
            market_status: strategyResult.market_status,
          },
        });

        toast({ title: 'Update saved with recommendation!' });
      } else {
        toast({ 
          title: 'Contributions saved', 
          description: marketData ? undefined : 'Market data unavailable – recommendation not generated'
        });
      }

      // Reset contribution inputs
      setContributionSpy(0);
      setContributionTa(0);
      setContributionCash(0);
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
  const currencySymbol = getCurrencySymbol(contributionCurrency);
  const totalContribution = contributionSpy + contributionTa + contributionCash;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Portfolio Update</h1>
          <p className="text-muted-foreground">Record your contributions and get a recommendation</p>
        </div>

        {/* Per-Asset Contributions */}
        <Card>
          <CardHeader>
            <CardTitle>Contributions</CardTitle>
            <CardDescription>Enter how much you're adding to each asset</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>SPY ({currencySymbol})</Label>
                <Input
                  type="number"
                  value={contributionSpy || ''}
                  onChange={(e) => setContributionSpy(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>TA-125 ({currencySymbol})</Label>
                <Input
                  type="number"
                  value={contributionTa || ''}
                  onChange={(e) => setContributionTa(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Cash / MMF ({currencySymbol})</Label>
                <Input
                  type="number"
                  value={contributionCash || ''}
                  onChange={(e) => setContributionCash(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="space-y-1">
                <Label>Currency</Label>
                <Select
                  value={contributionCurrency}
                  onValueChange={(v) => setContributionCurrency(v as 'USD' | 'NIS')}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="NIS">NIS (₪)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Contribution</p>
                <p className="text-xl font-bold">{currencySymbol}{totalContribution.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Status - subtle display */}
        {marketDataLoading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading market data...</span>
          </div>
        ) : marketData ? (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">SPY Price</p>
                  <p className="text-lg font-semibold">${marketData.last_price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">52-Week High</p>
                  <p className="text-lg font-semibold">${marketData.high_52w.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Drawdown</p>
                  <p className="text-lg font-semibold text-destructive">
                    -{calculateDrawdown(marketData.last_price, marketData.high_52w).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Info className="h-4 w-4" />
            <span>Market data unavailable</span>
          </div>
        )}

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

        <Button onClick={saveUpdate} disabled={saving} className="w-full" size="lg">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
          Save Update
        </Button>
      </div>
    </Layout>
  );
}
