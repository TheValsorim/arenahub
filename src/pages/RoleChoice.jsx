import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, Radio, Trophy, Zap, ArrowRight, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const roles = [
  {
    key: 'viewer',
    icon: Eye,
    title: 'Viewer / Fan',
    description: 'Watch live streams, follow competitions, join teams, and cheer for your favorites.',
    cta: 'Enter as Viewer',
    destination: '/',
    flags: {},
  },
  {
    key: 'creator',
    icon: Radio,
    title: 'Creator / Streamer',
    description: 'Create a channel and go live with your gameplay or sports content. 20 free hours a month.',
    cta: 'Start Streaming',
    destination: '/creator-dashboard',
    flags: { is_creator: true },
  },
  {
    key: 'organizer',
    icon: Trophy,
    title: 'Organizer',
    description: 'Create and manage tournaments, leagues, and events with brackets, scoring, and live streams.',
    cta: 'Organize Events',
    destination: '/organizer-dashboard',
    flags: { is_organizer: true },
  },
];

export default function RoleChoice() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState(null);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsAuth).catch(() => setIsAuth(false));
  }, []);

  const handleRoleSelect = async (role) => {
    setActiveRole(role.key);
    setLoading(true);

    const authenticated = await base44.auth.isAuthenticated().catch(() => false);

    if (!authenticated) {
      // Store intended role in sessionStorage so we can apply it post-login
      sessionStorage.setItem('arena_intended_role', role.key);
      sessionStorage.setItem('arena_intended_dest', role.destination);
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    // Already logged in — apply flags if needed
    if (Object.keys(role.flags).length > 0) {
      try {
        const me = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: me.id });
        if (profiles.length > 0) {
          await base44.entities.UserProfile.update(profiles[0].id, {
            ...role.flags,
            updated_at: new Date().toISOString(),
          });
        } else {
          await base44.entities.UserProfile.create({
            user_id: me.id,
            display_name: me.full_name || 'New User',
            username: me.email?.split('@')[0] || 'user',
            ...role.flags,
          });
        }
      } catch (e) {
        // Non-critical — proceed anyway
      }
    }

    setLoading(false);
    navigate(role.destination);
  };

  // Apply any pending role from pre-login sessionStorage
  useEffect(() => {
    const applyPendingRole = async () => {
      const pendingRole = sessionStorage.getItem('arena_intended_role');
      const pendingDest = sessionStorage.getItem('arena_intended_dest');
      if (!pendingRole || !pendingDest) return;

      const authenticated = await base44.auth.isAuthenticated().catch(() => false);
      if (!authenticated) return;

      sessionStorage.removeItem('arena_intended_role');
      sessionStorage.removeItem('arena_intended_dest');

      const roleConfig = roles.find(r => r.key === pendingRole);
      if (!roleConfig || Object.keys(roleConfig.flags).length === 0) {
        navigate(pendingDest);
        return;
      }

      try {
        const me = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: me.id });
        if (profiles.length > 0) {
          await base44.entities.UserProfile.update(profiles[0].id, {
            ...roleConfig.flags,
            updated_at: new Date().toISOString(),
          });
        } else {
          await base44.entities.UserProfile.create({
            user_id: me.id,
            display_name: me.full_name || 'New User',
            username: me.email?.split('@')[0] || 'user',
            ...roleConfig.flags,
          });
        }
      } catch {}

      navigate(pendingDest);
    };

    applyPendingRole();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="h-16 flex items-center justify-between px-6 md:px-12 border-b border-border">
        <Link to="/landing" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
            <Zap size={16} className="text-background" />
          </div>
          <span className="font-bold text-lg tracking-tight font-heading">ArenaHub</span>
        </Link>
        {isAuth && (
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-arena-fast">
            Go to dashboard →
          </Link>
        )}
      </nav>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Headline */}
        <div className="text-center max-w-xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ember-light text-ember text-xs font-semibold mb-5">
            <Zap size={12} />
            Free to join
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight mb-4">
            Welcome to ArenaHub
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Compete, organize, and stream sports and esports events in one place.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
          {roles.map((role) => {
            const Icon = role.icon;
            const isActive = activeRole === role.key && loading;
            return (
              <div
                key={role.key}
                className="arena-card-elevated flex flex-col p-7 hover:shadow-lg transition-arena group cursor-pointer"
                onClick={() => !loading && handleRoleSelect(role)}
              >
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-5 group-hover:bg-ember group-hover:text-white transition-arena">
                  <Icon size={22} className="text-foreground group-hover:text-white transition-arena" />
                </div>
                <h2 className="text-lg font-bold font-heading mb-2">{role.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-6">
                  {role.description}
                </p>
                <button
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-foreground text-background rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-arena-fast disabled:opacity-50"
                >
                  {isActive ? (
                    <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  ) : (
                    <>
                      {role.cta}
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="mt-8 text-sm text-muted-foreground flex items-center gap-1.5">
          <Check size={14} className="text-emerald-500" />
          You can change or add roles later from your profile.
        </p>
      </div>
    </div>
  );
}