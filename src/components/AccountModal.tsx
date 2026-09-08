import React, { useState } from 'react';
import { 
  X, 
  User, 
  Cloud, 
  CloudRain, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Mail, 
  Building, 
  LogIn, 
  UserPlus, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle, 
  Key, 
  RefreshCw,
  HardDrive,
  Zap,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { 
  UserAccount, 
  registerAccount, 
  loginAccount, 
  logoutAccount, 
  saveGameToCloud, 
  loadGameFromCloud,
  isUserAdmin,
  createOrLoginInstantCloudAccount,
  loginWithGoogle
} from '../firebase';
import { soundManager } from '../utils/audio';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onUserChange?: (user: UserAccount | null) => void;
  currentStudioName?: string;
  currentGameState: any;
  onApplyLoadedGameState?: (loadedState: any) => void;
  onLoadGame?: (loadedState: any) => void;
  onOpenAdminConsole?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  currentStudioName = 'DOB Enterprises',
  currentGameState,
  onApplyLoadedGameState,
  onLoadGame,
  onOpenAdminConsole
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'instant'>('login');
  const [email, setEmail] = useState('daleobeirned@gmail.com');
  const [password, setPassword] = useState('DOB-ADMIN-2026');
  const [confirmPass, setConfirmPass] = useState('');
  const [studioNameInput, setStudioNameInput] = useState(currentStudioName || 'DOB Enterprises (Admin)');
  const [adminPasscodeInput, setAdminPasscodeInput] = useState('DOB-ADMIN-2026');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [operationNotAllowed, setOperationNotAllowed] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecutiveAdminLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const account = await loginAccount('daleobeirned@gmail.com', 'DOB-ADMIN-2026');
      if (onUserChange) onUserChange(account);
      soundManager.playSuccess();
      setSuccessMessage("Executive Super-Administrator Authenticated! Welcome, Dale O'Beirne.");
      setOperationNotAllowed(false);
    } catch (err: any) {
      soundManager.playError();
      setErrorMessage(err.message || 'Failed to authenticate executive admin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantCloudAccount = async (targetEmail?: string, targetStudio?: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const chosenEmail = targetEmail || email || 'daleobeirned@gmail.com';
      const chosenStudio = targetStudio || studioNameInput || currentStudioName || 'DOB Enterprises (Admin)';
      
      const account = await createOrLoginInstantCloudAccount(
        chosenEmail,
        chosenStudio,
        currentGameState
      );
      if (onUserChange) onUserChange(account);
      soundManager.playCashSound();
      setSuccessMessage(`Instant Studio Cloud Account active! Linked to ${account.email}. Game progress backed up to Firebase.`);
      setOperationNotAllowed(false);
    } catch (err: any) {
      soundManager.playError();
      setErrorMessage('Failed to activate cloud profile: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const account = await loginWithGoogle(currentGameState, email || 'daleobeirned@gmail.com');
      if (onUserChange) onUserChange(account);
      soundManager.playSuccess();
      setSuccessMessage(`Signed in with Google! Welcome, ${account.studioName || account.email}.`);
      setOperationNotAllowed(false);
    } catch (err: any) {
      soundManager.playError();
      if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Google Sign-In popup was blocked by browser. Please allow popups or use Instant Studio Cloud Account.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setOperationNotAllowed(true);
        setErrorMessage('Google Sign-In provider is disabled in Firebase Console. Use Instant Studio Cloud Account instead!');
      } else {
        setErrorMessage(err.message || 'Google sign-in error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setOperationNotAllowed(false);
    setIsLoading(true);

    try {
      if (authMode === 'register') {
        if (!email || !password) {
          throw new Error('Please fill in both email and password.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        if (password !== confirmPass) {
          throw new Error('Passwords do not match.');
        }

        const account = await registerAccount(
          email, 
          password, 
          studioNameInput || currentStudioName, 
          currentGameState
        );
        if (onUserChange) onUserChange(account);
        soundManager.playCashSound();
        setSuccessMessage(`Account created! Cloud save linked to ${account.email}.`);
      } else if (authMode === 'login') {
        if (!email || !password) {
          throw new Error('Please enter your email and password.');
        }
        const account = await loginAccount(email, password);
        if (onUserChange) onUserChange(account);
        soundManager.playSuccess();
        setSuccessMessage(`Welcome back, ${account.studioName || account.email}!`);
      } else {
        await handleInstantCloudAccount(email, studioNameInput);
      }
    } catch (err: any) {
      soundManager.playError();
      let msg = err.message || 'Authentication error';
      if (err.code === 'auth/operation-not-allowed') {
        setOperationNotAllowed(true);
        msg = 'Email/Password sign-in is disabled in your Firebase console for project exalted-messenger-nnm9t. Click the button below to activate Instant Studio Cloud Account immediately!';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Incorrect email or password.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email. Please register.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await logoutAccount();
      if (onUserChange) onUserChange(null);
      setSuccessMessage('Signed out. Local guest mode active.');
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSaveToCloud = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await saveGameToCloud(currentUser.userId, currentUser.studioName, currentGameState);
      soundManager.playCashSound();
      setCloudSyncStatus('Cloud save completed successfully at ' + new Date().toLocaleTimeString());
    } catch (err: any) {
      soundManager.playError();
      setErrorMessage('Failed to save to cloud: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLoadFromCloud = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const loaded = await loadGameFromCloud(currentUser.userId);
      if (!loaded) {
        setErrorMessage('No cloud save data found for this account.');
      } else {
        const applySave = onLoadGame || onApplyLoadedGameState;
        if (applySave) {
          applySave(loaded);
        }
        soundManager.playSuccess();
        setCloudSyncStatus('Loaded cloud save successfully! Studio restored.');
      }
    } catch (err: any) {
      soundManager.playError();
      setErrorMessage('Failed to load from cloud: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockAdminWithKey = async () => {
    if (adminPasscodeInput.trim() === 'DOB-ADMIN-2026') {
      await handleExecutiveAdminLogin();
      if (onOpenAdminConsole) {
        onOpenAdminConsole();
      }
    } else {
      soundManager.playError();
      setErrorMessage('Invalid Administrator Master Passcode.');
    }
  };

  const userIsAdmin = isUserAdmin(currentUser?.email, currentUser?.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0c121e] border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/70 overflow-hidden text-slate-100 font-sans">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>PUBLISHER ACCOUNT & CLOUD SAVE</span>
                {userIsAdmin && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    ADMIN
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Persistent authentication & cross-device backup
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Firebase Provider Notice & Instant Fallback */}
        {operationNotAllowed && (
          <div className="mx-5 mt-3 p-3.5 rounded-xl bg-amber-950/80 border border-amber-500/50 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Instant Cloud Profile Ready</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Email/Password authentication provider is currently disabled in your Firebase Console for project <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded font-mono">exalted-messenger-nnm9t</code>. You can enable it in the console, or activate your Instant Studio Cloud Account below with zero configuration!
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleInstantCloudAccount(email, studioNameInput)}
                disabled={isLoading}
                className="w-full py-2.5 px-3 rounded-lg font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-950/40 transition-all"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>⚡ Activate Instant Cloud Save Now</span>
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5">
          {currentUser ? (
            /* Logged In View */
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white tracking-wide">
                        {currentUser.studioName || 'DOB Enterprises'}
                      </span>
                      {userIsAdmin ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          EXECUTIVE ADMIN
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                          VERIFIED PUBLISHER
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{currentUser.email}</span>
                    </p>
                  </div>

                  <button
                    onClick={handleSignOut}
                    disabled={isLoading}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/80 border border-slate-700 hover:border-red-500/50 text-xs text-slate-300 hover:text-red-300 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>

                {currentUser.isBanned && (
                  <div className="p-2.5 rounded-lg bg-red-950/90 border border-red-500 text-xs text-red-200 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                    <span>
                      <strong>Account Suspended:</strong> {currentUser.banReason || 'Administrative sanctions active.'}
                    </span>
                  </div>
                )}
              </div>

              {/* Cloud Save / Restore Actions */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-cyan-400" />
                    <span>Cloud Save & Synchronize</span>
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Cloud Backup Active
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Your corporate valuation, released catalog, office infrastructure, and hires can be safely backed up to your Firebase account and restored anytime.
                </p>

                {cloudSyncStatus && (
                  <div className="text-xs text-cyan-300 font-mono bg-cyan-950/40 p-2 rounded border border-cyan-800/40">
                    {cloudSyncStatus}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleManualSaveToCloud}
                    disabled={isLoading}
                    className="py-2.5 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Cloud className="w-4 h-4" />
                    <span>Save to Cloud</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleManualLoadFromCloud}
                    disabled={isLoading}
                    className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    <span>Restore from Cloud</span>
                  </button>
                </div>
              </div>

              {/* Admin Console Shortcut if Admin */}
              {userIsAdmin && onOpenAdminConsole && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-200">Executive Admin Authorized</h4>
                      <p className="text-[10px] text-slate-400">Reset leaderboards, edit values, ban accounts</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdminConsole();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-950/50 cursor-pointer transition-all"
                  >
                    Open Admin Console
                  </button>
                </div>
              )}

              {/* Master Key Passcode fallback for quick administrative elevation */}
              {!userIsAdmin && (
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-slate-500" />
                      <span>Have an Admin Passcode?</span>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={adminPasscodeInput}
                      onChange={(e) => setAdminPasscodeInput(e.target.value)}
                      placeholder="Enter Admin Master PIN..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleUnlockAdminWithKey}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-950/80 border border-slate-700 hover:border-amber-500/50 text-xs font-bold text-slate-300 hover:text-amber-300 cursor-pointer transition-all"
                    >
                      Unlock
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Login / Register / Google Form */
            <div className="space-y-4">
              {/* Executive Super-Admin Quick Login Shortcut */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border border-amber-500/50 space-y-2.5 shadow-lg shadow-amber-950/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">Executive Super-Admin</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    MASTER ACCESS
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Direct login as <code className="text-amber-300 font-mono">daleobeirned@gmail.com</code> with passcode <code className="text-amber-300 font-mono">DOB-ADMIN-2026</code>.
                </p>
                <button
                  type="button"
                  onClick={handleExecutiveAdminLogin}
                  disabled={isLoading}
                  className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-950/60 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  <Key className="w-3.5 h-3.5 fill-current" />
                  <span>⚡ 1-CLICK SUPER-ADMIN LOGIN</span>
                </button>
              </div>

              {/* Primary 1-Click Google Sign In */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 font-bold text-xs flex items-center justify-center gap-3 transition-all shadow-md shadow-white/5 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span className="tracking-wide">CONTINUE WITH GOOGLE</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center">
                  Recommended: instant sign-in with your Google Account across all devices.
                </p>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-800 w-full"></div>
                <span className="bg-slate-900 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest absolute">
                  OR USE EMAIL / INSTANT ID
                </span>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {/* Tab Selector */}
                <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setOperationNotAllowed(false);
                    }}
                    className={`py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      authMode === 'login'
                        ? 'bg-cyan-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>SIGN IN</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setOperationNotAllowed(false);
                    }}
                    className={`py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      authMode === 'register'
                        ? 'bg-cyan-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>REGISTER</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('instant');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setOperationNotAllowed(false);
                    }}
                    className={`py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      authMode === 'instant'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-amber-400/80 hover:text-amber-300'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>INSTANT</span>
                  </button>
                </div>

              {(authMode === 'register' || authMode === 'instant') && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Studio Display Name
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={studioNameInput}
                      onChange={(e) => setStudioNameInput(e.target.value)}
                      placeholder="e.g. Acme Interactive"
                      maxLength={50}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs text-white"
                  />
                </div>
                {email.toLowerCase() === 'daleobeirned@gmail.com' && (
                  <p className="text-[11px] text-amber-400 font-mono mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Executive Super-Administrator Account Identified
                  </p>
                )}
              </div>

              {authMode !== 'instant' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {authMode === 'instant' && (
                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <p className="font-bold text-amber-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Instant Direct Cloud Activation</span>
                  </p>
                  <p className="text-slate-400">
                    Bypasses password restrictions to immediately link and backup your active game progress into Firebase Firestore under your studio name and email.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 ${
                  authMode === 'instant'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-900/40'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-900/40'
                }`}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : authMode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>SIGN IN & LOAD PROGRESS</span>
                  </>
                ) : authMode === 'register' ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>CREATE ACCOUNT & BACK UP GAME</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>ACTIVATE INSTANT CLOUD PROFILE</span>
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-slate-800/80 text-center">
                <p className="text-[11px] text-slate-400">
                  Accounts persist game progress across all browsers and devices in real time.
                </p>
              </div>
            </form>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};
