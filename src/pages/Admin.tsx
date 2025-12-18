import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Shield, Crown, User, RefreshCw, Trash2 } from 'lucide-react';
import { inviteUserSchema, getFirstError } from '@/lib/validation';

interface AppUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  invited: boolean;
  password_set: boolean;
}

export default function Admin() {
  const { isAdmin, isOwner, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'user' | 'admin'>('user');
  const [inviting, setInviting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; name?: string }>({});

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast({ variant: 'destructive', title: t('admin.accessDenied'), description: t('admin.adminRequired') });
      navigate('/');
    }
  }, [isAdmin, roleLoading, navigate, toast, t]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-get-users');
      if (error) throw error;
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast({ variant: 'destructive', title: t('common.error'), description: 'Failed to fetch users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate input
    const result = inviteUserSchema.safeParse({ 
      email: inviteEmail, 
      name: inviteName || undefined, 
      role: inviteRole 
    });
    
    if (!result.success) {
      const fieldErrors: { email?: string; name?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'name') fieldErrors.name = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-invite-user', {
        body: { email: inviteEmail, name: inviteName || undefined, role: inviteRole },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast({ title: t('common.success'), description: t('admin.invitationSent') });
      setInviteEmail('');
      setInviteName('');
      setInviteRole('user');
      fetchUsers();
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('common.error'), description: err.message || 'Failed to send invitation' });
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-role', {
        body: { userId, role: newRole },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast({ title: t('common.success'), description: t('admin.roleUpdated') });
      fetchUsers();
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('common.error'), description: err.message || 'Failed to update role' });
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast({ title: t('common.success'), description: `${email} ${t('admin.userDeleted')}` });
      fetchUsers();
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('common.error'), description: err.message || 'Failed to delete user' });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner': return <Badge className="bg-amber-500 hover:bg-amber-600"><Crown className="w-3 h-3 mr-1" />{t('admin.owner')}</Badge>;
      case 'admin': return <Badge className="bg-blue-500 hover:bg-blue-600"><Shield className="w-3 h-3 mr-1" />{t('admin.admin')}</Badge>;
      default: return <Badge variant="secondary"><User className="w-3 h-3 mr-1" />{t('admin.user')}</Badge>;
    }
  };

  if (roleLoading) {
    return <Layout><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div></Layout>;
  }

  if (!isAdmin) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('admin.title')}</h1>
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('admin.refresh')}
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" />{t('admin.inviteUser')}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2 flex-1 min-w-[200px]">
                <Label htmlFor="email">{t('admin.email')}</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={inviteEmail} 
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={errors.email ? 'border-destructive' : ''}
                  placeholder="user@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2 flex-1 min-w-[150px]">
                <Label htmlFor="name">{t('admin.nameOptional')}</Label>
                <Input 
                  id="name" 
                  value={inviteName} 
                  onChange={(e) => {
                    setInviteName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={errors.name ? 'border-destructive' : ''}
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
              {isOwner && (
                <div className="space-y-2 w-[120px]">
                  <Label>{t('admin.role')}</Label>
                  <Select value={inviteRole} onValueChange={(v: 'user' | 'admin') => setInviteRole(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{t('admin.user')}</SelectItem>
                      <SelectItem value="admin">{t('admin.admin')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" disabled={inviting}>
                {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('admin.sendInvite')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('admin.users')} ({users.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t('admin.noUsers')}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.email')}</TableHead>
                      <TableHead>{t('admin.name')}</TableHead>
                      <TableHead>{t('admin.role')}</TableHead>
                      <TableHead>{t('admin.status')}</TableHead>
                      {isOwner && <TableHead>{t('admin.actions')}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.email}</TableCell>
                        <TableCell>{u.name || <span className="text-muted-foreground">-</span>}</TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell>
                          {u.invited && !u.password_set ? (
                            <Badge variant="outline" className="text-amber-600 border-amber-600">{t('admin.pending')}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-600">{t('admin.active')}</Badge>
                          )}
                        </TableCell>
                        {isOwner && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {u.role !== 'owner' && u.id !== user?.id && (
                                <>
                                  <Select value={u.role} onValueChange={(v: 'user' | 'admin') => handleRoleChange(u.id, v)}>
                                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="user">{t('admin.user')}</SelectItem>
                                      <SelectItem value="admin">{t('admin.admin')}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>{t('admin.deleteUser')}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          {t('admin.deleteUserConfirm')} <strong>{u.email}</strong>? {t('admin.deleteUserWarning')}
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteUser(u.id, u.email)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          {t('admin.delete')}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}
                            </div>
                          </TableCell>
                        )}
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
