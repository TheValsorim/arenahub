import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap,
  UserPlus,
  LogOut,
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import GoogleIcon from "@/components/GoogleIcon";

export default function Register() {
  const navigate = useNavigate();
  const { user, profile, isLoadingAuth, signUp, signOut } = useAuth();

  const [step, setStep] = useState("form"); // "form" | "check_email"
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { data, error } = await signUp({
      email,
      password,
      fullName,
    });

    setLoading(false);

    if (error) {
      setError(error.message || "Registration failed. Please try again.");
      return;
    }

    if (data?.session) {
      navigate("/get-started", { replace: true });
      return;
    }

    setStep("check_email");
  };

  const handleGoogleSignup = async () => {
    setError("");
    setGoogleLoading(true);

    const redirectTo = `${window.location.origin}/get-started`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setError(error.message || "Google signup failed.");
      setGoogleLoading(false);
    }
  };

  const handleLogoutAndRegister = async () => {
    await signOut("/register");
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="h-16 flex items-center justify-between px-6 md:px-12 border-b border-border">
        <Link to="/landing" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
            <Zap size={16} className="text-background" />
          </div>
          <span className="font-bold text-lg tracking-tight font-heading">
            ArenaHub
          </span>
        </Link>

        <Link
          to="/login"
          className="text-sm text-muted-foreground hover:text-foreground transition-arena-fast"
        >
          Sign in →
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="arena-card-elevated p-8">
            {user ? (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-foreground/10 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                </div>

                <h1 className="text-xl font-bold font-heading mb-2">
                  You are already logged in
                </h1>

                <p className="text-muted-foreground text-sm mb-1">
                  {user.email}
                </p>

                <p className="text-muted-foreground text-sm mb-6">
                  To create a new account, please log out first.
                </p>

                <button
                  onClick={handleLogoutAndRegister}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-foreground text-background rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-arena-fast mb-3"
                >
                  <LogOut size={15} />
                  Logout and create a new account
                </button>

                <Link
                  to="/"
                  className="block text-center text-sm text-muted-foreground hover:text-foreground transition-arena-fast"
                >
                  Continue with current account →
                </Link>
              </div>
            ) : step === "form" ? (
              <>
                <div className="text-center mb-7">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ember-light text-ember text-xs font-semibold mb-4">
                    <Zap size={12} />
                    Free to join
                  </div>

                  <h1 className="text-2xl font-bold font-heading mb-1">
                    Create your ArenaHub account
                  </h1>

                  <p className="text-muted-foreground text-sm">
                    Join competitions, start streaming, or organize your own events.
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Full name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:border-foreground/40 transition-arena-fast"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:border-foreground/40 transition-arena-fast"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Password
                    </label>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:border-foreground/40 transition-arena-fast pr-10"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Confirm password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:border-foreground/40 transition-arena-fast"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-foreground text-background rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-arena-fast disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus size={15} />
                        Create Free Account
                      </>
                    )}
                  </button>
                </form>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-3 text-muted-foreground">
                      or
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-secondary border border-border rounded-lg text-sm font-medium hover:bg-secondary/80 transition-arena-fast disabled:opacity-60"
                >
                  {googleLoading ? (
                    <span className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      <GoogleIcon className="w-4 h-4" />
                      Sign up with Google
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-foreground font-medium hover:underline"
                  >
                    Log in
                  </Link>
                </p>
              </>
            ) : (
              <>
                <div className="text-center mb-7">
                  <div className="w-12 h-12 rounded-full bg-ember-light flex items-center justify-center mx-auto mb-4">
                    <Mail size={22} className="text-ember" />
                  </div>

                  <h1 className="text-2xl font-bold font-heading mb-1">
                    Check your email
                  </h1>

                  <p className="text-muted-foreground text-sm">
                    We sent a confirmation link to{" "}
                    <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>

                <button
                  onClick={() => navigate("/login")}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-foreground text-background rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-arena-fast"
                >
                  Go to login
                  <ArrowRight size={15} />
                </button>

                <button
                  onClick={() => {
                    setStep("form");
                    setError("");
                  }}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4 transition-arena-fast"
                >
                  ← Back
                </button>
              </>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            <Link
              to="/landing"
              className="hover:text-foreground transition-arena-fast"
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}