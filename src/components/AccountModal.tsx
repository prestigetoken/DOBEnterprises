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
  HardDrive
} from 'lucide-react';
import { 
  UserAccount, 
  registerAccount, 
  loginAccount, 
  logoutAccount, 
  saveGameToCloud, 
  loadGameFromCloud,
  isUserAdmin
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
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [studioNameInput, setStudioNameInput] = useState(currentStudioName || 'DOB Enterprises');
  const [adminPasscodeInput, setAdminPasscodeInput] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
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
      } else {
        if (!email || !password) {
          throw new Error('Please enter your email and password.');
        }
        const account = await loginAccount(email, password);
        if (onUserChange) onUserChange(account);
        soundManager.playSuccess();
        setSuccessMessage(`Welcome back, ${account.studioName || account.email}!`);
      }
    } catch (err: any) {
      soundManager.playError();
      let msg = err.message || 'Authentication error';
      if (err.code === 'auth/email-already-in-use') {
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

  const handleUnlockAdminWithKey = () => {
    if (adminPasscodeInput.trim() === 'DOB-ADMIN-2026') {
      if (currentUser && onUserChange) {
        onUserChange({ ...currentUser, role: 'admin' });
      }
      soundManager.playSuccess();
      setSuccessMessage('Executive Administrator privileges unlocked!');
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
            /* Login / Register Form */
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {/* Tab Selector */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>REGISTER ACCOUNT</span>
                </button>
              </div>

              {authMode === 'register' && (
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
                {authMode === 'login' && email.toLowerCase() === 'daleobeirned@gmail.com' && (
                  <p className="text-[11px] text-amber-400 font-mono mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Recognized Executive Super-Administrator Email
                  </p>
                )}
              </div>

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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : authMode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>SIGN IN & LOAD PROGRESS</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>CREATE ACCOUNT & BACK UP GAME</span>
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-slate-800/80 text-center">
                <p className="text-[11px] text-slate-400">
                  Accounts persist game progress across all browsers and devices in real time.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
