import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
          <h1 className="text-2xl font-bold">Recommendation Logs</h1>
          <p className="text-muted-foreground">History of all strategy recommendations</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Recommendations</CardTitle>
            <CardDescription>{logs.length} total entries</CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No recommendations yet. Create your first monthly update!</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Drawdown</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="max-w-xs">Recommendation</TableHead>
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
                              {log.market_status}
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
