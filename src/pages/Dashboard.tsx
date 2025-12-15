import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Wallet, PiggyBank, Target } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import type { Tables } from '@/integrations/supabase/types';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<Tables<'portfolio_snapshots'>[]>([]);
  const [latestSnapshot, setLatestSnapshot] = useState<Tables<'portfolio_snapshots'> | null>(null);
  const [ammoState, setAmmoState] = useState<Tables<'ammo_state'> | null>(null);
  const [settings, setSettings] = useState<Tables<'settings'> | null>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    const [snapshotsRes, ammoRes, settingsRes] = await Promise.all([
      supabase.from('portfolio_snapshots').select('*').eq('user_id', user!.id).order('snapshot_month', { ascending: true }),
      supabase.from('ammo_state').select('*').eq('user_id', user!.id).maybeSingle(),
      supabase.from('settings').select('*').eq('user_id', user!.id).maybeSingle(),
    ]);

    if (snapshotsRes.data) {
      setSnapshots(snapshotsRes.data);
      setLatestSnapshot(snapshotsRes.data[snapshotsRes.data.length - 1] || null);
    }
    if (ammoRes.data) setAmmoState(ammoRes.data);
    if (settingsRes.data) setSettings(settingsRes.data);
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

  const pieData = latestSnapshot ? [
    { name: 'Stocks', value: Number(latestSnapshot.stocks_value), color: 'hsl(var(--primary))' },
    { name: 'Cash', value: Number(latestSnapshot.cash_value), color: 'hsl(var(--muted-foreground))' },
  ] : [];

  const lineData = snapshots.map((s) => ({
    month: new Date(s.snapshot_month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    total: Number(s.total_value),
    stocks: Number(s.stocks_value),
    cash: Number(s.cash_value),
  }));

  const ammoBadges = [
    { label: 'T1 (10%)', used: ammoState?.tranche_1_used },
    { label: 'T2 (20%)', used: ammoState?.tranche_2_used },
    { label: 'T3 (30%)', used: ammoState?.tranche_3_used },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your portfolio overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ${latestSnapshot ? Number(latestSnapshot.total_value).toLocaleString() : '0'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Stocks</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ${latestSnapshot ? Number(latestSnapshot.stocks_value).toLocaleString() : '0'}
              </p>
              <p className="text-xs text-muted-foreground">
                {latestSnapshot ? `${Number(latestSnapshot.stocks_percent).toFixed(1)}%` : '0%'}
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
                ${latestSnapshot ? Number(latestSnapshot.cash_value).toLocaleString() : '0'}
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
              <p className="text-xs text-muted-foreground">Stocks / Cash</p>
            </CardContent>
          </Card>
        </div>

        {/* Ammo Status */}
        <Card>
          <CardHeader>
            <CardTitle>Ammo Status</CardTitle>
            <CardDescription>Cash tranches ready to deploy during market downturns</CardDescription>
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
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
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
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="total" name="Total" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="stocks" name="Stocks" stroke="hsl(var(--accent-foreground))" strokeWidth={1} />
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
