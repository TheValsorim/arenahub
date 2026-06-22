import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, UserPlus, LogOut, Eye, EyeOff, ArrowRight, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { ensureUserProfile } from '@/lib/ensureUserProfile';
import GoogleIcon from '@/components/GoogleIcon';

export default function Register() {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(false);
  const [checking, setChecking] = useState(true);
  const [authUser, setAuthUser] = useState(null);

  // Form state
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const check = async () => {
      const auth = await base44.auth.isAuthenticated().catch(() => false);
      setIsAuth(auth);
      if (auth) {
        const me = await base44.auth.me().catch(() => null);
        setAuthUser(me);
      }
      setChecking(false);
    };
    check();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setStep('otp');
      setResendCooldown(30);
    } catch (err) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp.trim()) { setError('Please enter the verification code.'); return; }
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode: otp });
      base44.auth.setToken(result.access_token);
      await ensureUserProfile();
      window.location.href = '/get-started';
    } catch (err) {
      setError(err?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    try {
      await base44.auth.resendOtp(email);
      setResendCooldown(30);
    } catch (err) {
      setError('Could not resend code. Please try again.');
    }
  };

  const handleLogoutAndRegister = () => {
    base44.auth.logout('/register');
  };

  const handleGoogleSignup = () => {
    base44.auth.loginWithProvider('google', '/get-started');
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
      {/* Nav */}
      <nav className="h-16 flex items-center justify-between px-6 md:px-12 border-b border-border">
        <Link to="/landing" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
            <Zap size={16} className="text-background" />
          </div>
          <span className="font-bold text-lg tracking-tight font-heading">ArenaHub</span>
        </Link>
        <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-arena-fast">
          Sign in →
        </Link>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="arena-card-elevated p-8">

            {/* Already logged in */}
            {isAuth ? (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-foreground/10 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {authUser?.full_name?.[0] || 'U'}
                </div>
                <h1 className="text-xl font-bold font-heading mb-2">You are already logged in</h1>
                <p className="text-muted-foreground text-sm mb-1">{authUser?.email}</p>
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

            ) : step === 'form' ? (
              /* Registration form */
              <>
                <div className="text-center mb-7">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ember-light text-ember text-xs font-semibold mb-4">
                    <Zap size={12} />
                    Free to join
                  </div>
                  <h1 className="text-2xl font-bold font-heading mb-1">Create your ArenaHub account</h1>
                  <p className="text-muted-foreground text-sm">
                    Join competitions, start streaming, or organize your own events.
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
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
                        placeholder="Min. 6 characters"
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
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Confirm password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:border-foreground/40 transition-arena-fast"
                    />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-foreground text-background rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-arena-fast disabled:opacity-60"
                  >
                    {loading
                      ? <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                      : <><UserPlus size={15} /> Create Free Account</>
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
                  onClick={handleGoogleSignup}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-secondary border border-border rounded-lg text-sm font-medium hover:bg-secondary/80 transition-arena-fast"
                >
                  <GoogleIcon className="w-4 h-4" />
                  Sign up with Google
                </button>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Already have an account?{' '}
                  <Link to="/login" className="text-foreground font-medium hover:underline">Log in</Link>
                </p>
              </>

            ) : (
              /* OTP verification step */
              <>
                <div className="text-center mb-7">
                  <div className="w-12 h-12 rounded-full bg-ember-light flex items-center justify-center mx-auto mb-4">
                    <Mail size={22} className="text-ember" />
                  </div>
                  <h1 className="text-2xl font-bold font-heading mb-1">Check your email</h1>
                  <p className="text-muted-foreground text-sm">
                    We sent a verification code to <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Verification code</label>
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:border-foreground/40 transition-arena-fast tracking-widest text-center text-lg font-mono"
                    />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-foreground text-background rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-arena-fast disabled:opacity-60"
                  >
                    {loading
                      ? <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                      : <>Verify &amp; Continue <ArrowRight size={15} /></>
                    }
                  </button>
                </form>

                <div className="text-center mt-4">
                  <button
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                    className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-arena-fast"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>

                <button
                  onClick={() => { setStep('form'); setError(''); setOtp(''); }}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-3 transition-arena-fast"
                >
                  ← Back
                </button>
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