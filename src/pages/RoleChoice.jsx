import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, Radio, Trophy, Zap, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const roles = [
  {
    key: "viewer",
    icon: Eye,
    title: "Viewer / Fan",
    description:
      "Watch live streams, follow competitions, join teams, and cheer for your favorites.",
    cta: "Enter as Viewer",
    destination: "/",
    flags: {
      role: "fan",
      is_creator: false,
      is_organizer: false,
    },
  },
  {
    key: "creator",
    icon: Radio,
    title: "Creator / Streamer",
    description:
      "Create a channel and go live with your gameplay or sports content. 20 free hours a month.",
    cta: "Start Streaming",
    destination: "/creator-dashboard",
    flags: {
      role: "creator",
      is_creator: true,
      is_organizer: false,
    },
  },
  {
    key: "organizer",
    icon: Trophy,
    title: "Organizer",
    description:
      "Create and manage tournaments, leagues, and events with brackets, scoring, and live streams.",
    cta: "Organize Events",
    destination: "/organizer-dashboard",
    flags: {
      role: "organizer",
      is_creator: false,
      is_organizer: true,
    },
  },
];

export default function RoleChoice() {
  const navigate = useNavigate();
  const {
    user,
    profile,
    isLoadingAuth,
    updateProfile,
    refreshProfile,
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState(null);
  const [error, setError] = useState("");

  const isAuth = !!user;

  const buildProfilePayload = (role) => {
    const displayName =
      profile?.display_name ||
      profile?.full_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")[0] ||
      "New User";

    const username =
      profile?.username ||
      profile?.channel_name ||
      user?.email?.split("@")[0]?.replace(/[^a-z0-9]/gi, "").toLowerCase() ||
      "user";

    return {
      ...role.flags,
      display_name: displayName,
      full_name: profile?.full_name || displayName,
      username,
      channel_name: username,
    };
  };

  const applyRole = async (role) => {
    const payload = buildProfilePayload(role);

    const { error } = await updateProfile(payload);

    if (error) {
      throw error;
    }

    await refreshProfile();
  };

  const handleRoleSelect = async (role) => {
    setActiveRole(role.key);
    setLoading(true);
    setError("");

    if (!user) {
      sessionStorage.setItem("arena_intended_role", role.key);
      sessionStorage.setItem("arena_role_destination", role.destination);
      sessionStorage.setItem("arena_intended_dest", "/get-started");

      setLoading(false);
      navigate("/login");
      return;
    }

    try {
      await applyRole(role);
      navigate(role.destination);
    } catch (err) {
      setError(err.message || "Could not save your role.");
      setLoading(false);
    }
  };

  useEffect(() => {
    const applyPendingRole = async () => {
      if (isLoadingAuth || !user) return;

      const pendingRole = sessionStorage.getItem("arena_intended_role");
      const pendingDest =
        sessionStorage.getItem("arena_role_destination") || "/";

      if (!pendingRole) return;

      const roleConfig = roles.find((r) => r.key === pendingRole);
      if (!roleConfig) return;

      sessionStorage.removeItem("arena_intended_role");
      sessionStorage.removeItem("arena_role_destination");

      setActiveRole(roleConfig.key);
      setLoading(true);
      setError("");

      try {
        await applyRole(roleConfig);
        navigate(pendingDest, { replace: true });
      } catch (err) {
        setError(err.message || "Could not apply your selected role.");
        setLoading(false);
      }
    };

    applyPendingRole();
  }, [isLoadingAuth, user]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="h-16 flex items-center justify-between px-6 md:px-12 border-b border-border">
        <Link to="/landing" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
            <Zap size={16} className="text-background" />
          </div>
          <span className="font-bold text-lg tracking-tight font-heading">
            ArenaHub
          </span>
        </Link>

        {isAuth && (
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-arena-fast"
          >
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
            Compete, organize, and stream sports and esports events in one
            place.
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
                  <Icon
                    size={22}
                    className="text-foreground group-hover:text-white transition-arena"
                  />
                </div>

                <h2 className="text-lg font-bold font-heading mb-2">
                  {role.title}
                </h2>

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

        {error && (
          <div className="mt-5 max-w-4xl w-full arena-card p-3 bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Footer note */}
        <p className="mt-8 text-sm text-muted-foreground flex items-center gap-1.5">
          <Check size={14} className="text-emerald-500" />
          You can change or add roles later from your profile.
        </p>
      </div>
    </div>
  );
}