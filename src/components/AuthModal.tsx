import { useState, FormEvent } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile as updateAuthProfile,
  signOut,
  type User 
} from '../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { 
  X, 
  User as UserIcon, 
  Mail, 
  Lock, 
  LogIn, 
  UserPlus, 
  LogOut, 
  Cloud, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  AlertCircle,
  RefreshCw,
  Layers,
  Copy,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  currentUser: User | null;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export function AuthModal({ currentUser, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(currentUser ? 'signin' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDomainError, setIsDomainError] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
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
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
        onAuthSuccess(cred.user);
        onClose();
      } else if (mode === 'signin') {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please enter your email and password.');
        }
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        confetti({ particleCount: 25, spread: 50, origin: { y: 0.7 } });
        onAuthSuccess(cred.user);
        onClose();
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          throw new Error('Please enter your email address to receive reset instructions.');
        }
        await sendPasswordResetEmail(auth, email.trim());
        setSuccessMsg(`Password reset link sent to ${email.trim()}. Check your inbox!`);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Authentication failed. Please try again.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'Invalid email or password. Please check your credentials or create an account.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please sign in instead.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/unauthorized-domain' || err.message?.includes('auth/unauthorized-domain')) {
        setIsDomainError(true);
        msg = `Domain not authorized in Firebase. Add "${window.location.hostname}" to Authorized Domains in Firebase Console.`;
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsDomainError(false);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      onAuthSuccess(result.user);
      onClose();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('auth/unauthorized-domain')) {
        setIsDomainError(true);
        setErrorMsg(`Domain not authorized: Please add "${window.location.hostname}" to Authorized Domains in Firebase Console > Authentication > Settings.`);
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setSuccessMsg('Logged out successfully.');
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg('Failed to log out.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {currentUser ? 'Multi-Account & Cloud Sync' : mode === 'signup' ? 'Create an Account' : mode === 'forgot' ? 'Reset Password' : 'Sign In to AseQR'}
              </h2>
              <p className="text-xs text-neutral-400">
                {currentUser ? 'Manage profile accounts & cloud database' : 'Sync your profiles, contacts & QR across devices'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* If user is currently logged in, show current account info + Switch / Signout options */}
        {currentUser ? (
          <div className="space-y-4">
            {/* Account Card */}
            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User Avatar'}
                    className="w-12 h-12 rounded-full border border-indigo-500/40 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg">
                    {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white text-sm truncate">
                      {currentUser.displayName || 'Active Member'}
                    </p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Cloud className="w-3 h-3" /> Cloud Synced
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 truncate">{currentUser.email}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                <span>Database: Firestore Cloud</span>
                <span className="text-indigo-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Secure
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Log Out of Current Account</span>
              </button>

              <button
                onClick={() => {
                  // Switch account: prompt to sign into another account
                  signOut(auth).then(() => {
                    setMode('signin');
                  });
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Switch to Another Account</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <div className="space-y-4">
            {/* Tabs for Sign In vs Sign Up */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-1.5 rounded-lg transition-all ${
                  mode === 'signin'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-1.5 rounded-lg transition-all ${
                  mode === 'signup'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Google 1-Click Sign-in */}
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

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
                {isDomainError && (
                  <div className="pt-2 border-t border-rose-500/20 space-y-2">
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-neutral-950/80 border border-neutral-800 text-[11px]">
                      <code className="text-indigo-300 font-mono select-all truncate text-[11px]">
                        {window.location.hostname}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.hostname);
                          setCopiedDomain(true);
                          setTimeout(() => setCopiedDomain(false), 2000);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors"
                      >
                        {copiedDomain ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedDomain ? 'Copied' : 'Copy Domain'}</span>
                      </button>
                    </div>
                    <a
                      href="https://console.firebase.google.com/project/aseqr-f14f2/authentication/settings"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                    >
                      <span>Open Firebase Authorized Domains Settings</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="relative flex items-center justify-center">
              <div className="border-t border-neutral-800 w-full" />
              <span className="bg-neutral-900 px-3 text-[11px] text-neutral-500 uppercase tracking-wider font-semibold absolute">
                or email & password
              </span>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300">Your Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. Alex Rivera"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-300">Email Address</label>
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

              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-neutral-300">Password</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : mode === 'signup' ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Free Account</span>
                  </>
                ) : mode === 'forgot' ? (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Send Reset Email</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>

              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="w-full text-center text-xs text-neutral-400 hover:text-white pt-1"
                >
                  Back to Sign In
                </button>
              )}
            </form>
          </div>
        )}

        <div className="text-center pt-1 border-t border-neutral-800/80">
          <p className="text-[11px] text-neutral-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure Firebase Authentication & Firestore Database</span>
          </p>
        </div>
      </div>
    </div>
  );
}
