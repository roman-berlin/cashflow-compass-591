import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, RotateCcw, User, Mail } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [settings, setSettings] = useState<Partial<Tables<'settings'>>>({
    stocks_target_percent: 70,
    cash_target_percent: 30,
    tranche_1_trigger: 10,
    tranche_2_trigger: 20,
    tranche_3_trigger: 30,
    rebuild_threshold: 10,
    cash_min_pct: 20,
    cash_max_pct: 35,
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
      // Load profile name from user metadata
      setProfileName(user.user_metadata?.name || '');
    }
  }, [user]);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else if (data) {
      setSettings(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('settings')
      .upsert({
        ...settings,
        user_id: user!.id,
      }, { onConflict: 'user_id' });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Settings saved!' });
    }
    setSaving(false);
  };

  const handleUpdateName = async () => {
    if (!profileName.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Name cannot be empty' });
      return;
    }
    if (profileName.length > 100) {
      toast({ variant: 'destructive', title: 'Error', description: 'Name must be less than 100 characters' });
      return;
    }

    setSavingName(true);
    const { error } = await supabase.auth.updateUser({
      data: { name: profileName.trim() }
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Name updated successfully!' });
    }
    setSavingName(false);
  };

  const handleResetAmmo = async () => {
    const { error } = await supabase
      .from('ammo_state')
      .upsert({
        user_id: user!.id,
        tranche_1_used: false,
        tranche_2_used: false,
        tranche_3_used: false,
      }, { onConflict: 'user_id' });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Ammo state reset to Ready!' });
    }
    setConfirmReset(false);
  };

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-ammo-alert', {
        body: {
          recommendation_type: 'test_email',
          recommendation_text: 'This is a test email to verify your email notification setup is working correctly. If you received this, your domain verification with Resend is complete!',
          drawdown_percent: 5.5,
          transfer_amount: 1000,
          market_status: 'normal',
        },
      });

      if (error) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      } else {
        toast({ title: 'Test email sent!', description: `Check your inbox at ${user?.email}` });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to send test email' });
    } finally {
      setSendingTestEmail(false);
    }
  };

  const updateField = (field: string, value: number | string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your long-term strategy parameters</p>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Manage your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profileName">Full Name</Label>
              <Input
                id="profileName"
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter your full name"
                maxLength={100}
              />
            </div>
            <Button onClick={handleUpdateName} disabled={savingName} variant="outline">
              {savingName ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Update Name
            </Button>
          </CardContent>
        </Card>

        {/* Email Notifications Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>Test your email notification setup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send a test email to verify your notification setup is working correctly.
            </p>
            <Button onClick={handleSendTestEmail} disabled={sendingTestEmail} variant="outline">
              {sendingTestEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Send Test Email
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Target Allocation</CardTitle>
            <CardDescription>Your ideal portfolio balance</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stocks Target (%)</Label>
              <Input
                type="number"
                value={settings.stocks_target_percent}
                onChange={(e) => updateField('stocks_target_percent', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cash Target (%)</Label>
              <Input
                type="number"
                value={settings.cash_target_percent}
                onChange={(e) => updateField('cash_target_percent', parseFloat(e.target.value) || 0)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cash Thresholds</CardTitle>
            <CardDescription>Define cash allocation boundaries</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Cash Min (%)</Label>
              <Input
                type="number"
                value={settings.cash_min_pct}
                onChange={(e) => updateField('cash_min_pct', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cash Target (%)</Label>
              <Input
                type="number"
                value={settings.cash_target_percent}
                disabled
              />
              <p className="text-xs text-muted-foreground">Set in Target Allocation</p>
            </div>
            <div className="space-y-2">
              <Label>Cash Max (%)</Label>
              <Input
                type="number"
                value={settings.cash_max_pct}
                onChange={(e) => updateField('cash_max_pct', parseFloat(e.target.value) || 0)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ammo Triggers</CardTitle>
            <CardDescription>Market drawdown thresholds to deploy cash (each tranche = 1/3 of current cash)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tranche 1 (%)</Label>
                <Input
                  type="number"
                  value={settings.tranche_1_trigger}
                  onChange={(e) => updateField('tranche_1_trigger', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tranche 2 (%)</Label>
                <Input
                  type="number"
                  value={settings.tranche_2_trigger}
                  onChange={(e) => updateField('tranche_2_trigger', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tranche 3 (%)</Label>
                <Input
                  type="number"
                  value={settings.tranche_3_trigger}
                  onChange={(e) => updateField('tranche_3_trigger', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rebuild Threshold (%)</Label>
              <Input
                type="number"
                value={settings.rebuild_threshold}
                onChange={(e) => updateField('rebuild_threshold', parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">When drawdown falls below this, start rebuilding ammo</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Ammo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Ammo Status</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3">
                    <p>This will reset all ammo tranches to "Ready" status.</p>
                    <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
                      <p className="font-medium">This does NOT move any money.</p>
                      <p>This only resets tranche status to Ready.</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use this when the previous market cycle is complete and cash has rebuilt to target.
                    </p>
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox 
                        id="confirm" 
                        checked={confirmReset}
                        onCheckedChange={(checked) => setConfirmReset(checked === true)}
                      />
                      <label
                        htmlFor="confirm"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I understand this is a logical reset only
                      </label>
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmReset(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetAmmo} disabled={!confirmReset}>
                  Reset Ammo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Layout>
  );
}
