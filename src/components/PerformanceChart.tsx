import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from 'recharts';
import { Loader2 } from 'lucide-react';

interface TimeSeriesPoint {
  date: string;
  close: number;
  return_pct: number;
  drawdown_pct: number;
}

interface PerformanceChartProps {
  spyData: TimeSeriesPoint[];
  ta35Data: TimeSeriesPoint[];
  loading?: boolean;
  error?: string;
}

export function PerformanceChart({ spyData, ta35Data, loading, error }: PerformanceChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Performance</CardTitle>
          <CardDescription>Year-to-date returns</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Performance</CardTitle>
          <CardDescription>Year-to-date returns</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Merge data by date for the chart
  const mergedData = spyData.map((spy, index) => {
    const ta35Point = ta35Data[index];
    return {
      date: new Date(spy.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: spy.date,
      SPY: spy.return_pct,
      'TA-35': ta35Point?.return_pct ?? null,
    };
  });

  // Sample data for better performance (show ~50 points)
  const sampledData = mergedData.filter((_, i) => 
    i % Math.max(1, Math.floor(mergedData.length / 50)) === 0 || i === mergedData.length - 1
  );

  // Get current returns for display
  const currentSPY = spyData.length > 0 ? spyData[spyData.length - 1].return_pct : 0;
  const currentTA35 = ta35Data.length > 0 ? ta35Data[ta35Data.length - 1].return_pct : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Market Performance</CardTitle>
            <CardDescription>Year-to-date returns (%)</CardDescription>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
              <span className={currentSPY >= 0 ? 'text-green-500' : 'text-red-500'}>
                SPY: {currentSPY >= 0 ? '+' : ''}{currentSPY.toFixed(1)}%
              </span>
            </div>
            {currentTA35 !== null && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
                <span className={currentTA35 >= 0 ? 'text-green-500' : 'text-red-500'}>
                  TA-35: {currentTA35 >= 0 ? '+' : ''}{currentTA35.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sampledData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={sampledData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="spyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="ta35Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                domain={['auto', 'auto']}
              />
              <ReferenceLine 
                y={0} 
                stroke="hsl(var(--border))" 
                strokeDasharray="3 3"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                formatter={(value: number, name: string) => [
                  <span style={{ color: value >= 0 ? '#22c55e' : '#ef4444' }}>
                    {value >= 0 ? '+' : ''}{value.toFixed(2)}%
                  </span>,
                  name
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend 
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Line 
                type="monotone" 
                dataKey="SPY" 
                stroke="#3b82f6" 
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#3b82f6' }}
              />
              {ta35Data.length > 0 && (
                <Line 
                  type="monotone" 
                  dataKey="TA-35" 
                  stroke="#8b5cf6" 
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#8b5cf6' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-12">No performance data available</p>
        )}
      </CardContent>
    </Card>
  );
}
