import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Bell,
  LogIn,
  LogOut,
  Menu,
  Search,
  User,
  X,
  Zap,
  Home,
  Trophy,
  Radio,
  Users,
  CreditCard,
  Shield,
  Video,
  Plus,
  LayoutDashboard,
  Swords,
} from "lucide-react";

const navItems = [
  { label: "Home", to: "/", icon: Home },
  { label: "Competitions", to: "/competitions", icon: Trophy },
  { label: "Streams", to: "/streams", icon: Radio },
  { label: "Teams", to: "/teams", icon: Users },
  { label: "Pricing", to: "/pricing", icon: CreditCard },
];

function MobileNavLink({ item, onClick }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onClick}
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

export default function TopBar({
  user,
  profile,
  notifications = [],
  unreadCount = 0,
  onLogout,
  onNotificationRead,
  onMarkAllNotificationsRead,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-arena-fast"
            >
              <Menu size={18} />
            </button>

            <Link to="/" className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                <Zap size={16} className="text-background" />
              </div>
              <span className="font-bold font-heading">ArenaHub</span>
            </Link>

            <div className="hidden md:flex items-center relative w-72">
              <Search
                size={15}
                className="absolute left-3 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search competitions, streams..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:border-foreground/40 transition-arena-fast"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((v) => !v)}
                  className="relative w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-arena-fast"
                >
                  <Bell size={17} />

                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-ember text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <p className="text-sm font-semibold">Notifications</p>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={onMarkAllNotificationsRead}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() =>
                              onNotificationRead?.(notification.id)
                            }
                            className="w-full text-left px-4 py-3 border-b border-border last:border-b-0 hover:bg-secondary transition-arena-fast"
                          >
                            <p className="text-sm font-medium">
                              {notification.title || "Notification"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message || notification.body || ""}
                            </p>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <Bell
                            size={24}
                            className="mx-auto text-muted-foreground/40 mb-2"
                          />
                          <p className="text-sm text-muted-foreground">
                            No notifications yet
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <Link
                to="/profile"
                className="hidden sm:flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary transition-arena-fast"
              >
                <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">
                  {initial}
                </div>
                <span className="text-sm font-medium max-w-32 truncate">
                  {displayName}
                </span>
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-arena-fast"
                >
                  <LogIn size={15} />
                  Login
                </Link>

                <Link
                  to="/register"
                  className="px-3 py-2 rounded-lg text-sm font-semibold bg-foreground text-background hover:bg-foreground/90 transition-arena-fast"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeMobile}
          />

          <aside className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card border-r border-border flex flex-col">
            <div className="h-16 flex items-center justify-between px-5 border-b border-border">
              <Link
                to="/"
                onClick={closeMobile}
                className="flex items-center gap-2.5"
              >
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

              <button
                type="button"
                onClick={closeMobile}
                className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-arena-fast"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <MobileNavLink
                    key={item.to}
                    item={item}
                    onClick={closeMobile}
                  />
                ))}
              </nav>

              {user && (
                <div className="space-y-2">
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Account
                  </p>

                  <MobileNavLink
                    onClick={closeMobile}
                    item={{ label: "Profile", to: "/profile", icon: User }}
                  />

                  <MobileNavLink
                    onClick={closeMobile}
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

                  <MobileNavLink
                    onClick={closeMobile}
                    item={{ label: "Go Live", to: "/go-live", icon: Video }}
                  />

                  <MobileNavLink
                    onClick={closeMobile}
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

                  <MobileNavLink
                    onClick={closeMobile}
                    item={{
                      label: "Create Competition",
                      to: "/create-competition",
                      icon: Plus,
                    }}
                  />

                  <MobileNavLink
                    onClick={closeMobile}
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

                  <MobileNavLink
                    onClick={closeMobile}
                    item={{ label: "Admin Panel", to: "/admin", icon: Shield }}
                  />
                </div>
              )}

              {!user && (
                <div className="space-y-2">
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Join
                  </p>

                  <MobileNavLink
                    onClick={closeMobile}
                    item={{ label: "Login", to: "/login", icon: LogIn }}
                  />

                  <MobileNavLink
                    onClick={closeMobile}
                    item={{
                      label: "Register",
                      to: "/register",
                      icon: User,
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
                    onClick={closeMobile}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-arena-fast"
                  >
                    <div className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">
                      {initial}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">
                        {displayName}
                      </p>
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
                    onClick={closeMobile}
                    className="flex items-center justify-center px-3 py-2 rounded-lg text-sm font-semibold bg-secondary hover:bg-secondary/80 transition-arena-fast"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={closeMobile}
                    className="flex items-center justify-center px-3 py-2 rounded-lg text-sm font-semibold bg-foreground text-background hover:bg-foreground/90 transition-arena-fast"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}