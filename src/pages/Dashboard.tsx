import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Wallet, PiggyBank, Target, DollarSign, Bell } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { getCurrencySymbol, formatCurrency } from '@/lib/currency';
import type { Tables } from '@/integrations/supabase/types';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<Tables<'portfolio_snapshots'>[]>([]);
  const [latestSnapshot, setLatestSnapshot] = useState<Tables<'portfolio_snapshots'> | null>(null);
  const [ammoState, setAmmoState] = useState<Tables<'ammo_state'> | null>(null);
  const [settings, setSettings] = useState<Tables<'settings'> | null>(null);
  const [latestContribution, setLatestContribution] = useState<Tables<'contributions'> | null>(null);
  const [latestNotification, setLatestNotification] = useState<Tables<'notifications'> | null>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    const [snapshotsRes, ammoRes, settingsRes, notifRes] = await Promise.all([
      supabase.from('portfolio_snapshots').select('*').eq('user_id', user!.id).order('snapshot_month', { ascending: true }),
      supabase.from('ammo_state').select('*').eq('user_id', user!.id).maybeSingle(),
      supabase.from('settings').select('*').eq('user_id', user!.id).maybeSingle(),
      supabase.from('notifications').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (snapshotsRes.data) {
      setSnapshots(snapshotsRes.data);
      const latest = snapshotsRes.data[snapshotsRes.data.length - 1] || null;
      setLatestSnapshot(latest);

      // Fetch latest contribution
      if (latest) {
        const { data: contrib } = await supabase
          .from('contributions')
          .select('*')
          .eq('snapshot_id', latest.id)
          .maybeSingle();
        if (contrib) setLatestContribution(contrib);
      }
    }
    if (ammoRes.data) setAmmoState(ammoRes.data);
    if (settingsRes.data) setSettings(settingsRes.data);
    if (notifRes.data) setLatestNotification(notifRes.data);
    setLoading(false);
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

  const currency = settings?.currency || 'ILS';
  const currencySymbol = getCurrencySymbol(currency);

  // 3-bucket pie chart (use cash_value as it still exists in DB alongside new columns)
  const pieData = latestSnapshot ? [
    { name: 'S&P', value: Number(latestSnapshot.value_sp), color: 'hsl(var(--primary))' },
    { name: 'TA-125', value: Number(latestSnapshot.value_ta), color: 'hsl(var(--accent))' },
    { name: 'Cash', value: Number(latestSnapshot.cash_value), color: 'hsl(var(--muted-foreground))' },
  ].filter(d => d.value > 0) : [];

  // Line chart with 3 buckets
  const lineData = snapshots.map((s) => ({
    month: new Date(s.snapshot_month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    total: Number(s.total_value),
    sp: Number(s.value_sp),
    ta: Number(s.value_ta),
    cash: Number(s.cash_value),
  }));

  const ammoBadges = [
    { label: 'T1 (10%)', used: ammoState?.tranche_1_used },
    { label: 'T2 (20%)', used: ammoState?.tranche_2_used },
    { label: 'T3 (30%)', used: ammoState?.tranche_3_used },
  ];

  const totalEquities = latestSnapshot ? Number(latestSnapshot.value_sp) + Number(latestSnapshot.value_ta) : 0;
  const equitiesPercent = latestSnapshot && Number(latestSnapshot.total_value) > 0
    ? ((totalEquities / Number(latestSnapshot.total_value)) * 100).toFixed(1)
    : '0';

  const contributionTypeLabels: Record<string, string> = {
    monthly: 'Monthly deposit',
    bonus: 'Bonus / one-time',
    adjustment: 'Manual adjustment',
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your portfolio overview</p>
        </div>

        {/* Stats Cards - 3 buckets */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {currencySymbol}{latestSnapshot ? Number(latestSnapshot.total_value).toLocaleString() : '0'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">S&P / SPY</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {currencySymbol}{latestSnapshot ? Number(latestSnapshot.value_sp).toLocaleString() : '0'}
              </p>
              <p className="text-xs text-muted-foreground">
                {latestSnapshot ? `${Number(latestSnapshot.percent_sp).toFixed(1)}%` : '0%'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">TA-125</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {currencySymbol}{latestSnapshot ? Number(latestSnapshot.value_ta).toLocaleString() : '0'}
              </p>
              <p className="text-xs text-muted-foreground">
                {latestSnapshot ? `${Number(latestSnapshot.percent_ta).toFixed(1)}%` : '0%'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cash (Ammo)</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {currencySymbol}{latestSnapshot ? Number(latestSnapshot.cash_value).toLocaleString() : '0'}
              </p>
              <p className="text-xs text-muted-foreground">
                {latestSnapshot ? `${Number(latestSnapshot.cash_percent).toFixed(1)}%` : '0%'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Target</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {settings ? `${settings.stocks_target_percent}% / ${settings.cash_target_percent}%` : '70% / 30%'}
              </p>
              <p className="text-xs text-muted-foreground">Equities / Cash</p>
            </CardContent>
          </Card>
        </div>

        {/* Latest Notification Card */}
        {latestNotification && (
          <Card className={!latestNotification.is_read ? 'border-primary/50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                Latest Notification
                {!latestNotification.is_read && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="font-medium text-sm">{latestNotification.title}</p>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {latestNotification.message}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(latestNotification.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Last Contribution Card */}
        {latestContribution && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Last Contribution</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {getCurrencySymbol(latestContribution.currency)}{Number(latestContribution.amount).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {contributionTypeLabels[latestContribution.contribution_type] || latestContribution.contribution_type}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Ammo Status */}
        <Card>
          <CardHeader>
            <CardTitle>Ammo Status</CardTitle>
            <CardDescription>Cash tranches ready to deploy during market downturns (each = 1/3 of cash)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {ammoBadges.map((badge) => (
                <Badge key={badge.label} variant={badge.used ? 'secondary' : 'default'}>
                  {badge.label}: {badge.used ? 'Used' : 'Ready'}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${currencySymbol}${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">No data yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio History</CardTitle>
            </CardHeader>
            <CardContent>
              {lineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={lineData}>
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `${currencySymbol}${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => `${currencySymbol}${value.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="total" name="Total" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="sp" name="S&P" stroke="hsl(var(--chart-1))" strokeWidth={1} />
                    <Line type="monotone" dataKey="ta" name="TA-125" stroke="hsl(var(--chart-2))" strokeWidth={1} />
                    <Line type="monotone" dataKey="cash" name="Cash" stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">No data yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
