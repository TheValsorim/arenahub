import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error loading user profile:", error);
      setProfile(null);
      return null;
    }

    setProfile(data);
    return data;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return null;
    return await loadProfile(user.id);
  }, [user?.id, loadProfile]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      setIsLoadingAuth(true);
      setAuthError(null);

      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error("Error getting Supabase session:", error);
        setAuthError({
          type: "session_error",
          message: error.message,
        });
        setIsLoadingAuth(false);
        return;
      }

      const currentSession = data?.session || null;
      const currentUser = currentSession?.user || null;

      setSession(currentSession);
      setUser(currentUser);

      if (currentUser) {
        await loadProfile(currentUser.id);
      } else {
        setProfile(null);
      }

      if (mounted) {
        setIsLoadingAuth(false);
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      const newUser = newSession?.user || null;

      setSession(newSession);
      setUser(newUser);
      setAuthError(null);

      if (newUser) {
        await loadProfile(newUser.id);
      } else {
        setProfile(null);
      }

      setIsLoadingAuth(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = async ({ email, password }) => {
    setAuthError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError({
        type: "login_error",
        message: error.message,
      });
      return { data: null, error };
    }

    return { data, error: null };
  };

  const signUp = async ({ email, password, fullName }) => {
    setAuthError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          name: fullName,
        },
      },
    });

    if (error) {
      setAuthError({
        type: "register_error",
        message: error.message,
      });
      return { data: null, error };
    }

    return { data, error: null };
  };

  const signOut = async (redirectTo = "/landing") => {
    await supabase.auth.signOut();

    setSession(null);
    setUser(null);
    setProfile(null);

    if (redirectTo) {
      window.location.href = redirectTo;
    }
  };

  const updateProfile = async (updates) => {
    if (!user?.id) {
      return {
        data: null,
        error: new Error("User is not logged in"),
      };
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return { data: null, error };
    }

    setProfile(data);
    return { data, error: null };
  };

  const navigateToLogin = () => {
    window.location.href = "/login";
  };

  const value = {
    session,
    user,
    profile,

    isAuthenticated: !!user,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,

    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
    navigateToLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}