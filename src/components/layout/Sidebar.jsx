import React from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Zap,
  Home,
  Trophy,
  Radio,
  Users,
  CreditCard,
  Plus,
  Video,
  LayoutDashboard,
  Shield,
  LogIn,
  UserPlus,
  User,
  LogOut,
  Swords,
} from "lucide-react";

const baseNavItems = [
  { label: "Home", to: "/", icon: Home },
  { label: "Competitions", to: "/competitions", icon: Trophy },
  { label: "Streams", to: "/streams", icon: Radio },
  { label: "Teams", to: "/teams", icon: Users },
  { label: "Pricing", to: "/pricing", icon: CreditCard },
];

function SidebarLink({ item }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-arena-fast ${
          isActive
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`
      }
    >
      <Icon size={17} />
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function Sidebar({ user, profile, onLogout }) {
  const isCreator = !!profile?.is_creator;
  const isOrganizer = !!profile?.is_organizer;
  const isAdmin = !!profile?.is_admin;

  const displayName =
    profile?.display_name ||
    profile?.full_name ||
    profile?.channel_name ||
    user?.full_name ||
    user?.email?.split("@")[0] ||
    "Arena User";

  const initial =
    displayName?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 border-r border-border bg-card flex-col z-40">
      <div className="h-16 flex items-center px-5 border-b border-border">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-foreground flex items-center justify-center">
            <Zap size={18} className="text-background" />
          </div>

          <div>
            <p className="font-bold text-lg leading-none font-heading">
              ArenaHub
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sports & esports
            </p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <nav className="space-y-1">
          {baseNavItems.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>

        {user && (
          <div className="space-y-2">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Account
            </p>

            <SidebarLink
              item={{
                label: "Profile",
                to: "/profile",
                icon: User,
              }}
            />

            <SidebarLink
              item={{
                label: "Match Center",
                to: "/match-center",
                icon: Swords,
              }}
            />
          </div>
        )}

        {user && isCreator && (
          <div className="space-y-2">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Creator
            </p>

            <SidebarLink
              item={{
                label: "Go Live",
                to: "/go-live",
                icon: Video,
              }}
            />

            <SidebarLink
              item={{
                label: "Creator Dashboard",
                to: "/creator-dashboard",
                icon: LayoutDashboard,
              }}
            />
          </div>
        )}

        {user && isOrganizer && (
          <div className="space-y-2">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Organizer
            </p>

            <SidebarLink
              item={{
                label: "Create Competition",
                to: "/create-competition",
                icon: Plus,
              }}
            />

            <SidebarLink
              item={{
                label: "Organizer Dashboard",
                to: "/organizer-dashboard",
                icon: LayoutDashboard,
              }}
            />
          </div>
        )}

        {user && isAdmin && (
          <div className="space-y-2">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Admin
            </p>

            <SidebarLink
              item={{
                label: "Admin Panel",
                to: "/admin",
                icon: Shield,
              }}
            />
          </div>
        )}

        {!user && (
          <div className="space-y-2">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Join
            </p>

            <SidebarLink
              item={{
                label: "Login",
                to: "/login",
                icon: LogIn,
              }}
            />

            <SidebarLink
              item={{
                label: "Register",
                to: "/register",
                icon: UserPlus,
              }}
            />
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        {user ? (
          <div className="space-y-3">
            <Link
              to="/profile"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-arena-fast"
            >
              <div className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">
                {initial}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-arena-fast"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/login"
              className="flex items-center justify-center px-3 py-2 rounded-lg text-sm font-semibold bg-secondary hover:bg-secondary/80 transition-arena-fast"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="flex items-center justify-center px-3 py-2 rounded-lg text-sm font-semibold bg-foreground text-background hover:bg-foreground/90 transition-arena-fast"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}