import React from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppLayout() {
  const {
    user,
    profile,
    isLoadingAuth,
    signOut,
    refreshProfile,
  } = useAuth();

  const appUser = user
    ? {
        ...user,
        id: user.id,
        email: user.email,
        full_name:
          profile?.full_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email,
      }
    : null;

  const appProfile = profile
    ? {
        ...profile,
        display_name:
          profile.full_name ||
          profile.channel_name ||
          user?.email?.split("@")[0],
      }
    : null;

  const notifications = [];
  const unreadCount = 0;

  const handleLogout = async () => {
    await signOut("/landing");
  };

  const markNotificationRead = async () => {
    // Temporary placeholder until we create notifications table in Supabase
  };

  const markAllNotificationsRead = async () => {
    // Temporary placeholder until we create notifications table in Supabase
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading ArenaHub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        user={appUser}
        profile={appProfile}
        onLogout={handleLogout}
      />

      <div className="lg:pl-64">
        <TopBar
          user={appUser}
          profile={appProfile}
          notifications={notifications}
          unreadCount={unreadCount}
          onLogout={handleLogout}
          onNotificationRead={markNotificationRead}
          onMarkAllNotificationsRead={markAllNotificationsRead}
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6">
          <Outlet
            context={{
              user: appUser,
              profile: appProfile,
              refreshProfile,
              notifications,
              unreadCount,
            }}
          />
        </main>
      </div>
    </div>
  );
}