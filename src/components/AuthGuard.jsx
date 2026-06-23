import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function AuthGuard({ children, adminOnly = false }) {
  const location = useLocation();
  const { user, profile, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    sessionStorage.setItem(
      "arena_intended_dest",
      location.pathname + location.search
    );

    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !profile?.is_admin) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={26} />
        </div>

        <h1 className="text-2xl font-bold font-heading mb-2">
          Access Denied
        </h1>

        <p className="text-muted-foreground text-sm">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return children;
}