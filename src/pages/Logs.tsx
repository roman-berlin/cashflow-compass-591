import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import type { MarketStatus } from '@/lib/strategy';

const marketStatusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  normal: 'secondary',
  correction: 'outline',
  bear: 'destructive',
  crash: 'destructive',
};

export default function Logs() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<Tables<'recommendations_log'>[]>([]);

  useEffect(() => {
    if (user) loadLogs();
  }, [user]);

  const loadLogs = async () => {
    const { data } = await supabase
      .from('recommendations_log')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (data) setLogs(data);
    setLoading(false);
  };

  const getMarketStatusLabel = (status: string | null) => {
    if (!status) return '';
    const statusKey = `market.${status}` as const;
    return t(statusKey);
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

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('logs.title')}</h1>
          <p className="text-muted-foreground">{t('logs.subtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('logs.allRecommendations')}</CardTitle>
            <CardDescription>{logs.length} {t('logs.totalEntries')}</CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t('logs.noRecommendations')}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('logs.date')}</TableHead>
                      <TableHead>{t('logs.type')}</TableHead>
                      <TableHead>{t('logs.status')}</TableHead>
                      <TableHead>{t('logs.drawdown')}</TableHead>
                      <TableHead>{t('logs.amount')}</TableHead>
                      <TableHead className="max-w-xs">{t('logs.recommendation')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(log.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.recommendation_type.replace(/_/g, ' ')}</Badge>
                        </TableCell>
                        <TableCell>
                          {log.market_status && (
                            <Badge variant={marketStatusVariant[log.market_status] || 'secondary'}>
                              {getMarketStatusLabel(log.market_status)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.drawdown_percent ? `-${Number(log.drawdown_percent).toFixed(1)}%` : '-'}
                        </TableCell>
                        <TableCell>
                          {log.transfer_amount ? `$${Number(log.transfer_amount).toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={log.recommendation_text}>
                          {log.recommendation_text}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
