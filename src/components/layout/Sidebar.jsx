import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Trophy, Radio, Users, BarChart3, Settings,
  X, Zap, Shield, ChevronRight, Star, LogOut
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Trophy, label: 'Competitions', path: '/competitions' },
  { icon: Radio, label: 'Live Streams', path: '/streams' },
  { icon: Users, label: 'Teams', path: '/teams' },
  { icon: Star, label: 'Pricing', path: '/pricing' },
];

const creatorItems = [
  { icon: Zap, label: 'Creator Studio', path: '/creator-dashboard' },
  { icon: Radio, label: 'Go Live', path: '/go-live' },
];

const organizerItems = [
  { icon: Trophy, label: 'My Competitions', path: '/organizer-dashboard' },
  { icon: BarChart3, label: 'Match Center', path: '/match-center' },
];

const adminItems = [
  { icon: Shield, label: 'Admin Panel', path: '/admin' },
];

export default function Sidebar({ profile, user, onClose, isMobile }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const NavLink = ({ item }) => (
    <Link
      to={item.path}
      onClick={isMobile ? onClose : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-arena-fast group ${
        isActive(item.path)
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
      }`}
    >
      <item.icon size={18} className={isActive(item.path) ? '' : 'group-hover:text-foreground'} />
      <span className="text-sm font-medium">{item.label}</span>
      {isActive(item.path) && <ChevronRight size={14} className="ml-auto" />}
    </Link>
  );

  const SectionLabel = ({ children }) => (
    <p className="px-3 pt-4 pb-1 text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest">
      {children}
    </p>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
          <Zap size={16} className="text-background fill-current" />
        </div>
        <span className="font-bold text-lg tracking-tight font-heading">ArenaHub</span>
        {isMobile && (
          <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground transition-arena-fast">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <SectionLabel>Discover</SectionLabel>
        {navItems.map(item => <NavLink key={item.path} item={item} />)}

        {profile?.is_creator && (
          <>
            <SectionLabel>Creator</SectionLabel>
            {creatorItems.map(item => <NavLink key={item.path} item={item} />)}
          </>
        )}

        {profile?.is_organizer && (
          <>
            <SectionLabel>Organizer</SectionLabel>
            {organizerItems.map(item => <NavLink key={item.path} item={item} />)}
          </>
        )}

        {profile?.is_admin && (
          <>
            <SectionLabel>Admin</SectionLabel>
            {adminItems.map(item => <NavLink key={item.path} item={item} />)}
          </>
        )}
      </nav>

      {/* User Profile Footer */}
      {user && (
        <div className="p-3 border-t border-border space-y-0.5">
          <Link
            to="/profile"
            onClick={isMobile ? onClose : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-arena-fast group"
          >
            <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-sm font-semibold text-foreground">
              {profile?.display_name?.[0] || user?.full_name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{profile?.display_name || user?.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.is_creator && profile?.is_organizer ? 'Creator · Organizer' :
                 profile?.is_creator ? 'Creator' :
                 profile?.is_organizer ? 'Organizer' : 'Viewer'}
              </p>
            </div>
            <Settings size={14} className="text-muted-foreground group-hover:text-foreground transition-arena-fast" />
          </Link>
          <button
            onClick={() => base44.auth.logout('/landing')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-arena-fast"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}