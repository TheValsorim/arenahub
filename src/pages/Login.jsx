import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, LogIn, LogOut, Eye, EyeOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { ensureUserProfile } from '@/lib/ensureUserProfile';
import GoogleIcon from '@/components/GoogleIcon';

export default function Login() {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(false);
  const [checking, setChecking] = useState(true);
  const [authUser, setAuthUser] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const check = async () => {
      try {
        const auth = await base44.auth.isAuthenticated().catch(() => false);
        setIsAuth(auth);
        if (auth) {
          const me = await base44.auth.me().catch(() => null);
          setAuthUser(me);
        }
      } finally {
        setChecking(false);
      }
    };
    check();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      await ensureUserProfile();
      window.location.href = '/';
    } catch (err) {
      setError('Incorrect email or password. If you signed up with Google, use "Continue with Google" below.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    base44.auth.loginWithProvider('google', '/');
  };

  const handleLogout = () => {
    base44.auth.logout('/landing');
  };

  if (checking) {
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
          <span className="font-bold text-lg tracking-tight font-heading">ArenaHub</span>
        </Link>
        <Link to="/register" className="text-sm text-muted-foreground hover:text-foreground transition-arena-fast">
          Create account →
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="arena-card-elevated p-8">

            {isAuth ? (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-foreground/10 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {authUser?.full_name?.[0] || 'U'}
                </div>
                <h1 className="text-xl font-bold font-heading mb-1">You are already logged in</h1>
                <p className="text-muted-foreground text-sm mb-6">{authUser?.email}</p>
                <button
                  onClick={() => navigate('/')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-foreground text-background rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-arena-fast mb-3"
                >
                  Go to ArenaHub →
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-arena-fast"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-7">
                  <h1 className="text-2xl font-bold font-heading mb-1">Log in to ArenaHub</h1>
                  <p className="text-muted-foreground text-sm">
                    Access your competitions, streams, teams, and creator tools.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:border-foreground/40 transition-arena-fast"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Your password"
                        className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:border-foreground/40 transition-arena-fast pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive">{error}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        No account?{' '}
                        <Link to="/register" className="text-foreground font-medium hover:underline">Create one here</Link>
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-foreground text-background rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-arena-fast disabled:opacity-60"
                  >
                    {loading
                      ? <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                      : <><LogIn size={15} /> Log In</>
                    }
                  </button>
                </form>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-3 text-muted-foreground">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-secondary border border-border rounded-lg text-sm font-medium hover:bg-secondary/80 transition-arena-fast"
                >
                  <GoogleIcon className="w-4 h-4" />
                  Continue with Google
                </button>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-foreground font-medium hover:underline">Create one</Link>
                </p>
              </>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            <Link to="/landing" className="hover:text-foreground transition-arena-fast">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}