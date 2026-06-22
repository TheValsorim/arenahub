import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, Search, Zap, LogIn } from 'lucide-react';

export default function TopBar({ user, profile, onMenuToggle, notifCount = 0 }) {
  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center gap-3 px-4 sticky top-0 z-30">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-arena-fast"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Logo */}
      <Link to="/" className="lg:hidden flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-foreground flex items-center justify-center">
          <Zap size={13} className="text-background" />
        </div>
        <span className="font-bold text-base tracking-tight font-heading">ArenaHub</span>
      </Link>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 flex-1 max-w-xs mx-4">
        <div className="relative w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search competitions, streams..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-secondary border border-transparent rounded-lg focus:outline-none focus:border-border-accessible focus:bg-background transition-arena-fast"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {user ? (
          <Link to="/notifications" className="relative p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-arena-fast">
            <Bell size={18} />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-ember rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </Link>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 transition-arena-fast"
          >
            <LogIn size={15} />
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}