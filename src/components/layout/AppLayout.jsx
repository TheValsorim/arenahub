import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { setLoading(false); return; }
      const me = await base44.auth.me();
      setUser(me);
      const profiles = await base44.entities.UserProfile.filter({ user_id: me.id });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
      }
      try {
        const notifs = await base44.entities.Notification.filter({ user_id: me.id, is_read: false });
        setNotifCount(notifs.length);
      } catch {}
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading ArenaHub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 min-h-screen fixed left-4 top-4 bottom-4 arena-card-elevated rounded-xl z-40 overflow-hidden">
        <Sidebar user={user} profile={profile} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-72 bg-card shadow-2xl flex flex-col h-full z-10">
            <Sidebar user={user} profile={profile} isMobile onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-[272px] min-w-0 overflow-x-hidden">
        <TopBar
          user={user}
          profile={profile}
          onMenuToggle={() => setSidebarOpen(true)}
          notifCount={notifCount}
        />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden min-w-0">
          <Outlet context={{ user, profile, reloadUser: loadUser }} />
        </main>
      </div>
    </div>
  );
}