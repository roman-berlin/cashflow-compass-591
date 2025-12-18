import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, Legend } from 'recharts';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';

interface TimeSeriesPoint {
  date: string;
  close: number;
  return_pct: number;
  drawdown_pct: number;
}

interface DrawdownChartProps {
  spyData: TimeSeriesPoint[];
  ta35Data?: TimeSeriesPoint[];
  triggers: { t1: number; t2: number; t3: number };
  loading?: boolean;
  error?: string;
}

export function DrawdownChart({ spyData, ta35Data = [], triggers, loading, error }: DrawdownChartProps) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('chart.marketDrawdown')}</CardTitle>
          <CardDescription>{t('chart.distanceFrom52w')}</CardDescription>
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
          <CardTitle>{t('chart.marketDrawdown')}</CardTitle>
          <CardDescription>{t('chart.distanceFrom52w')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Merge data by date for the chart (drawdown is shown as negative for visual)
  const mergedData = spyData.map((spy, index) => {
    const ta35Point = ta35Data[index];
    return {
      date: new Date(spy.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: spy.date,
      SPY: -spy.drawdown_pct, // Negative for visual representation
      'TA-35': ta35Point ? -ta35Point.drawdown_pct : null,
    };
  });

  // Sample data for better performance
  const sampledData = mergedData.filter((_, i) => 
    i % Math.max(1, Math.floor(mergedData.length / 50)) === 0 || i === mergedData.length - 1
  );

  // Get current drawdowns
  const currentSPYDrawdown = spyData.length > 0 ? spyData[spyData.length - 1].drawdown_pct : 0;
  const currentTA35Drawdown = ta35Data.length > 0 ? ta35Data[ta35Data.length - 1].drawdown_pct : null;

  // Determine which trigger zone we're in
  const getZoneStatus = (drawdown: number) => {
    if (drawdown >= triggers.t3) return { zone: 'T3', color: 'destructive' as const, label: t('chart.crashZone') };
    if (drawdown >= triggers.t2) return { zone: 'T2', color: 'destructive' as const, label: t('chart.bearZone') };
    if (drawdown >= triggers.t1) return { zone: 'T1', color: 'secondary' as const, label: t('chart.correctionZone') };
    return { zone: 'Normal', color: 'outline' as const, label: t('market.normal') };
  };

  const spyZone = getZoneStatus(currentSPYDrawdown);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              {t('chart.marketDrawdown')}
              {currentSPYDrawdown >= triggers.t1 && (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              )}
            </CardTitle>
            <CardDescription>{t('chart.distanceFrom52w')} • {t('chart.ammoTriggerZones')}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={spyZone.color}>
              SPY: -{currentSPYDrawdown.toFixed(1)}% ({spyZone.label})
            </Badge>
            {currentTA35Drawdown !== null && (
              <Badge variant="outline">
                TA-35: -{currentTA35Drawdown.toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sampledData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={sampledData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="drawdownGradientSpy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="drawdownGradientTa35" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
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
                tickFormatter={(v) => `${Math.abs(v)}%`}
                domain={[-45, 0]}
                reversed={false}
              />
              {/* Trigger zone reference lines */}
              <ReferenceLine 
                y={0} 
                stroke="hsl(var(--border))" 
                strokeWidth={1}
              />
              <ReferenceLine 
                y={-triggers.t1} 
                stroke="#f59e0b" 
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{ 
                  value: `T1 (${triggers.t1}%)`, 
                  position: 'right',
                  fontSize: 10,
                  fill: '#f59e0b',
                  fontWeight: 500
                }}
              />
              <ReferenceLine 
                y={-triggers.t2} 
                stroke="#f97316" 
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{ 
                  value: `T2 (${triggers.t2}%)`, 
                  position: 'right',
                  fontSize: 10,
                  fill: '#f97316',
                  fontWeight: 500
                }}
              />
              <ReferenceLine 
                y={-triggers.t3} 
                stroke="#ef4444" 
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{ 
                  value: `T3 (${triggers.t3}%)`, 
                  position: 'right',
                  fontSize: 10,
                  fill: '#ef4444',
                  fontWeight: 500
                }}
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
                  <span style={{ color: '#ef4444' }}>
                    -{Math.abs(value).toFixed(2)}%
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
              <Area 
                type="monotone" 
                dataKey="SPY" 
                stroke="#ef4444" 
                strokeWidth={2}
                fill="url(#drawdownGradientSpy)"
                dot={false}
                activeDot={{ r: 5, fill: '#ef4444' }}
              />
              {ta35Data.length > 0 && (
                <Area 
                  type="monotone" 
                  dataKey="TA-35" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  fill="url(#drawdownGradientTa35)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#8b5cf6' }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-12">{t('chart.noDrawdownData')}</p>
        )}
        
        {/* Trigger zone legend */}
        <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-[#f59e0b]" />
            <span>T1: {t('chart.correction')} ({triggers.t1}%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-[#f97316]" />
            <span>T2: {t('chart.bear')} ({triggers.t2}%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-[#ef4444]" />
            <span>T3: {t('chart.crash')} ({triggers.t3}%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
