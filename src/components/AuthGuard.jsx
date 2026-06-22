import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function AuthGuard({ children, adminOnly = false }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking | allowed | denied
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const check = async () => {
      const isAuth = await base44.auth.isAuthenticated().catch(() => false);
      if (!isAuth) {
        sessionStorage.setItem('arena_intended_dest', window.location.pathname);
        navigate('/login', { replace: true });
        return;
      }
      if (adminOnly) {
        const me = await base44.auth.me().catch(() => null);
        if (!me) { navigate('/login', { replace: true }); return; }
        const profiles = await base44.entities.UserProfile.filter({ user_id: me.id }).catch(() => []);
        const p = profiles[0] || null;
        setProfile(p);
        if (!p?.is_admin) { setStatus('denied'); return; }
      }
      setStatus('allowed');
    };
    check();
  }, []);

  if (status === 'checking') {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-6">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-xl font-bold font-heading mb-2">Access Denied</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          You need admin permissions to view this page.
        </p>
      </div>
    );
  }

  return children;
}