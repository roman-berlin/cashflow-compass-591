import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'owner' | 'admin' | 'user' | null;

interface UserRoleContextType {
  role: UserRole;
  isAdmin: boolean;
  isOwner: boolean;
  loading: boolean;
  refreshRole: () => Promise<void>;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const syncRole = async () => {
    if (!user || !session) {
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-sync-owner');
      if (error) throw error;
      setRole(data.role);
    } catch (err) {
      console.error('Error syncing role:', err);
      setRole('user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncRole();
  }, [user, session]);

  const value: UserRoleContextType = {
    role,
    isAdmin: role === 'admin' || role === 'owner',
    isOwner: role === 'owner',
    loading,
    refreshRole: syncRole,
  };

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
}
