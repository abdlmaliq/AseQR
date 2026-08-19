import { useState, FormEvent } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateAuthProfile,
  type User,
} from '../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import {
  QrCode,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Zap,
  Users,
  Mail,
  Lock,
  User as UserIcon,
  LogIn,
  UserPlus,
  ArrowRight,
  Eye,
  Check,
  Phone,
  Globe,
  FileText,
  Linkedin,
  Github,
  Cloud,
  Layers,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AseQRLogo } from './AseQRLogo';

interface WelcomeLandingPageProps {
  onAuthSuccess: (user: User) => void;
}

export function WelcomeLandingPage({
  onAuthSuccess,
}: WelcomeLandingPageProps) {
  // Auth Form State
  const [authMode, setAuthMode] = useState<'signup' | 'signin' | 'forgot'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (authMode === 'signup') {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please enter both email and password.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (displayName.trim() && cred.user) {
          await updateAuthProfile(cred.user, {
            displayName: displayName.trim(),
          });
        }
        confetti({ particleCount: 45, spread: 70, origin: { y: 0.6 } });
        onAuthSuccess(cred.user);
      } else if (authMode === 'signin') {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please enter your email and password.');
        }
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
        onAuthSuccess(cred.user);
      } else if (authMode === 'forgot') {
        if (!email.trim()) {
          throw new Error('Please enter your email address to receive reset instructions.');
        }
        await sendPasswordResetEmail(auth, email.trim());
        setSuccessMsg(`Password reset email sent to ${email.trim()}. Please check your inbox.`);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Authentication failed. Please try again.';
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        msg = 'Invalid email or password. Please check your credentials or create a new account.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please switch to Sign In.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      onAuthSuccess(result.user);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shadow-lg shadow-indigo-500/20 shrink-0 flex items-center justify-center">
              <AseQRLogo className="w-10 h-10" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold text-white tracking-tight leading-none">
                  AseQR
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                  <Cloud className="w-3 h-3" /> Cloud Synced
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Digital Profile & QR Hub for Career Fairs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#auth-section"
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-12 space-y-12 sm:space-y-16">
        {/* Hero Value Section */}
        <section className="text-center max-w-3xl mx-auto space-y-5">
          <div className="flex justify-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 shadow-2xl shadow-indigo-500/30 shrink-0 transform hover:scale-105 transition-transform duration-300">
              <AseQRLogo className="w-full h-full" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Never Hand Out Paper Cards Again</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Share Your Entire Professional Profile in{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              One Single Scan
            </span>
          </h2>

          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            Give recruiters, hiring managers, and meetup connections instant access to your contact card (.vcf), portfolio, resume PDF, LinkedIn, and elevator pitch — synced securely in your cloud account.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#auth-section"
              className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account & Get Started</span>
            </a>
          </div>
        </section>

        {/* 2-Column Showcase: Features (Left) & Direct Sign In/Up Form (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Feature Highlights & Value Propositions */}
          <div className="lg:col-span-7 space-y-4">
            {/* Feature 1: Master QR Code */}
            <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-3 hover:border-neutral-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">One Master QR Code</h3>
                  <p className="text-xs text-neutral-400">All touchpoints encoded in a single high-density code</p>
                </div>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Presents your headline, company, portfolio, resume, custom links, and elevator pitch. Works seamlessly offline and renders at full clarity on any screen.
              </p>
            </div>

            {/* Feature 2: 1-Tap .vcf Contact Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-3 hover:border-neutral-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">1-Tap Direct Address Book (.vcf)</h3>
                  <p className="text-xs text-neutral-400">Zero apps required for recruiters or scanners</p>
                </div>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                When someone scans your code, they can tap "Save Contact" to directly download and save your vCard (.vcf) into Apple Contacts or Google Contacts with full details intact.
              </p>
            </div>

            {/* Feature 3: Lockscreen Wallpapers */}
            <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-3 hover:border-neutral-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Custom Lockscreen Wallpaper Generator</h3>
                  <p className="text-xs text-neutral-400">Instant networking without even unlocking your phone</p>
                </div>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Generate high-resolution 9:16 mobile wallpapers containing your name, role, and scannable Master QR code so you are ready to connect in crowded expo halls.
              </p>
            </div>

            {/* Feature 4: Lead Vault & Cloud Database */}
            <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-3 hover:border-neutral-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Lead Scanner Vault & Cloud Sync</h3>
                  <p className="text-xs text-neutral-400">Scan attendees, organize follow-ups, and export to CSV</p>
                </div>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Use the built-in scanner to capture contact cards from other attendees at career expos. Tag leads with event names, star priority contacts, and export to CSV anytime.
              </p>
            </div>
          </div>

          {/* Right Column (5 cols): Embedded Sign In / Sign Up Card */}
          <div id="auth-section" className="lg:col-span-5">
            <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-6 sm:p-7 shadow-2xl space-y-5 sticky top-20">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 shadow-lg shadow-indigo-500/20 shrink-0 flex items-center justify-center">
                  <AseQRLogo className="w-10 h-10" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">
                      {authMode === 'signup'
                        ? 'Create Your Account'
                        : authMode === 'forgot'
                        ? 'Reset Password'
                        : 'Welcome Back'}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <Cloud className="w-3 h-3" /> Firestore Cloud
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    {authMode === 'signup'
                      ? 'Save your profile, lockscreens, and leads in the database'
                      : 'Sign in to access your saved profile and contacts'}
                  </p>
                </div>
              </div>

              {/* Tabs for Sign In vs Sign Up */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-1.5 rounded-lg transition-all ${
                    authMode === 'signup'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-1.5 rounded-lg transition-all ${
                    authMode === 'signin'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Sign In
                </button>
              </div>

              {/* Google 1-Click Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-neutral-800 w-full" />
                <span className="bg-neutral-900 px-3 text-[11px] text-neutral-500 uppercase tracking-wider font-semibold absolute">
                  or email & password
                </span>
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {authMode === 'signup' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-300">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="e.g. Alex Morgan"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {authMode !== 'forgot' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-neutral-300">
                        Password
                      </label>
                      {authMode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('forgot');
                            setErrorMsg(null);
                            setSuccessMsg(null);
                          }}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : authMode === 'signup' ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account & Save Profile</span>
                    </>
                  ) : authMode === 'forgot' ? (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send Reset Email</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In to Account</span>
                    </>
                  )}
                </button>

                {authMode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className="w-full text-center text-xs text-neutral-400 hover:text-white pt-1"
                  >
                    Back to Sign In
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-6 px-4 text-center text-xs text-neutral-500">
        <p>AseQR · Cloud Database & Instant QR Studio</p>
      </footer>
    </div>
  );
}
