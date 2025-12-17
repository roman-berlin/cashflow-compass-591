import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { getCurrencySymbol } from '@/lib/currency';

interface SnapshotData {
  snapshot_month: string;
  value_sp: number;
  value_ta: number;
  cash_value: number;
  cost_basis_sp: number;
  cost_basis_ta: number;
  cost_basis_cash: number;
  total_value: number;
}

interface PortfolioProfitChartProps {
  snapshots: SnapshotData[];
  currency?: string;
  loading?: boolean;
}

export function PortfolioProfitChart({ snapshots, currency = 'NIS', loading }: PortfolioProfitChartProps) {
  const currencySymbol = getCurrencySymbol(currency);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Profit</CardTitle>
          <CardDescription>Your investment returns over time</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Check if we have cost basis data for profit tracking
  const hasCostBasis = snapshots.some(s => 
    s.cost_basis_sp > 0 || s.cost_basis_ta > 0 || s.cost_basis_cash > 0
  );

  if (snapshots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Profit</CardTitle>
          <CardDescription>Your investment returns over time</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground text-center">
            No portfolio data yet.<br />
            <span className="text-sm">Create your first update to start tracking.</span>
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Use all snapshots - show value growth even without cost basis
  const snapshotsWithCostBasis = snapshots;

  // Calculate profit for each snapshot
  const chartData = snapshotsWithCostBasis.map(snapshot => {
    const totalCostBasis = snapshot.cost_basis_sp + snapshot.cost_basis_ta + snapshot.cost_basis_cash;
    const totalValue = Number(snapshot.total_value) || (snapshot.value_sp + snapshot.value_ta + snapshot.cash_value);
    
    // SPY profit
    const spyProfit = snapshot.cost_basis_sp > 0 
      ? ((snapshot.value_sp - snapshot.cost_basis_sp) / snapshot.cost_basis_sp) * 100 
      : 0;
    const spyProfitNis = snapshot.value_sp - snapshot.cost_basis_sp;
    
    // TA-125 profit  
    const taProfit = snapshot.cost_basis_ta > 0 
      ? ((snapshot.value_ta - snapshot.cost_basis_ta) / snapshot.cost_basis_ta) * 100 
      : 0;
    const taProfitNis = snapshot.value_ta - snapshot.cost_basis_ta;
    
    // Total portfolio profit
    const totalProfit = totalCostBasis > 0 
      ? ((totalValue - totalCostBasis) / totalCostBasis) * 100 
      : 0;
    const totalProfitNis = totalValue - totalCostBasis;

    return {
      date: new Date(snapshot.snapshot_month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      spy_profit: Math.round(spyProfit * 100) / 100,
      ta_profit: Math.round(taProfit * 100) / 100,
      total_profit: Math.round(totalProfit * 100) / 100,
      spy_profit_nis: Math.round(spyProfitNis),
      ta_profit_nis: Math.round(taProfitNis),
      total_profit_nis: Math.round(totalProfitNis),
    };
  });

  // Get latest values for display
  const latest = chartData[chartData.length - 1];
  const totalProfitPositive = latest?.total_profit >= 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Portfolio Profit</CardTitle>
            <CardDescription>Your investment returns over time</CardDescription>
          </div>
          {latest && (
            <div className="flex gap-2">
              <Badge variant={totalProfitPositive ? 'default' : 'destructive'}>
                {totalProfitPositive ? '+' : ''}{latest.total_profit.toFixed(1)}%
              </Badge>
              <Badge variant="outline">
                {totalProfitPositive ? '+' : ''}{currencySymbol}{latest.total_profit_nis.toLocaleString()}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Current Profit Summary */}
        {latest && (
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">SPY Profit</p>
              <p className={`text-lg font-semibold ${latest.spy_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {latest.spy_profit >= 0 ? '+' : ''}{latest.spy_profit.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">
                {currencySymbol}{latest.spy_profit_nis.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">TA-125 Profit</p>
              <p className={`text-lg font-semibold ${latest.ta_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {latest.ta_profit >= 0 ? '+' : ''}{latest.ta_profit.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">
                {currencySymbol}{latest.ta_profit_nis.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <p className="text-xs text-muted-foreground">Total Profit</p>
              <p className={`text-lg font-semibold ${latest.total_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {latest.total_profit >= 0 ? '+' : ''}{latest.total_profit.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">
                {currencySymbol}{latest.total_profit_nis.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(value) => `${value}%`}
            />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  spy_profit: 'SPY',
                  ta_profit: 'TA-125',
                  total_profit: 'Total',
                };
                return [`${value.toFixed(2)}%`, labels[name] || name];
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="spy_profit"
              name="SPY"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="ta_profit"
              name="TA-125"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="total_profit"
              name="Total"
              stroke="#22c55e"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
