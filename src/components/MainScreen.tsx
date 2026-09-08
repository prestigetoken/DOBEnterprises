import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  Dices, 
  Cpu, 
  Play, 
  Trophy, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Code2,
  Lock,
  Globe,
  Cloud,
  ShieldAlert,
  User,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { generateRandomGuestName, extractAccountName } from '../utils/nameGenerator';

interface MainScreenProps {
  currentStudioName: string;
  cash: number;
  netWorth: number;
  followers: number;
  releasedGamesCount: number;
  onEnterGame: (chosenName: string) => void;
  onResetGame: () => void;
  onOpenMultiplayer?: () => void;
  currentUser?: { email?: string; role?: string; displayName?: string; studioName?: string } | null;
  isAdmin?: boolean;
  onOpenAccount?: () => void;
  onOpenAdmin?: () => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({
  currentStudioName,
  cash,
  netWorth,
  followers,
  releasedGamesCount,
  onEnterGame,
  onResetGame,
  onOpenMultiplayer,
  currentUser,
  isAdmin,
  onOpenAccount,
  onOpenAdmin
}) => {
  // Determine initial name for slot:
  // - If user has an account (Google or email), auto-fill with their Google name or email name
  // - For non-account players or guests, the slot must be empty upon starting!
  const getInitialStudioName = () => {
    if (currentUser) {
      const autoAccountName = extractAccountName(currentUser);
      if (autoAccountName) return autoAccountName;
    }
    // If returning player already customized their name in a previous session (and not default placeholder)
    if (currentStudioName && currentStudioName !== 'DOB Enterprises') {
      return currentStudioName;
    }
    // Starting fresh / non-account guest: empty slot
    return '';
  };

  const [studioName, setStudioName] = useState<string>(getInitialStudioName);
  const [autoFilled, setAutoFilled] = useState<boolean>(Boolean(currentUser && extractAccountName(currentUser)));
  const [soundEnabled, setSoundEnabled] = useState(soundManager.enabled);
  const [inputFocused, setInputFocused] = useState(false);
  const [randomPresets, setRandomPresets] = useState<string[]>(() => [
    'PixelForge',
    'CyberPulse Games',
    'NeonByte Labs',
    'QuantumGlitch',
    'RetroWave Studio'
  ]);

  const hasExistingProgress = cash > 0 || releasedGamesCount > 0 || followers > 0;

  // Auto-fill when currentUser logs in or loads
  useEffect(() => {
    if (currentUser) {
      const autoAccountName = extractAccountName(currentUser);
      if (autoAccountName) {
        // Only override if slot is currently blank or still default
        setStudioName((prev) => {
          if (!prev.trim() || prev === 'DOB Enterprises') {
            setAutoFilled(true);
            return autoAccountName;
          }
          return prev;
        });
      }
    }
  }, [currentUser]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    soundManager.enabled = next;
    setSoundEnabled(next);
    if (next) soundManager.playKeyClick();
  };

  const handleRandomize = () => {
    soundManager.playKeyClick();
    const chosen = generateRandomGuestName();
    setStudioName(chosen);
    setAutoFilled(false);
  };

  const handleRerollPresets = () => {
    soundManager.playKeyClick();
    setRandomPresets([
      generateRandomGuestName(),
      generateRandomGuestName(),
      generateRandomGuestName(),
      generateRandomGuestName()
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalName = studioName.trim();
    // Non-account players / guests: generate random name if slot was left empty!
    if (!finalName) {
      finalName = generateRandomGuestName();
      setStudioName(finalName);
    }
    soundManager.playCashChime();
    onEnterGame(finalName);
  };

  const formatMoney = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}k`;
    return `$${Math.floor(val).toLocaleString()}`;
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050811] text-slate-100 flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      {/* Dynamic Cyber Grid & Scanline Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(6, 182, 212, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6, 182, 212, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px'
        }}
      />
      <div 
        className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(ellipse_80%_60%_at_50%_45%,rgba(6,182,212,0.18),rgba(15,23,42,0)_70%)]" 
      />

      {/* GLOWING HACKER INSIGNIA BACKDROP */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="relative w-[500px] h-[500px] sm:w-[680px] sm:h-[680px] lg:w-[840px] lg:h-[840px] opacity-40 animate-pulse duration-[4000ms]">
          <svg
            viewBox="0 0 500 500"
            className="w-full h-full filter drop-shadow-[0_0_35px_rgba(6,182,212,0.55)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Hex Shield */}
            <polygon
              points="250,20 450,135 450,365 250,480 50,365 50,135"
              stroke="#06b6d4"
              strokeWidth="1.5"
              strokeDasharray="12 6"
              className="opacity-60"
            />

            {/* Inner Concentric Cyber Circle */}
            <circle
              cx="250"
              cy="250"
              r="190"
              stroke="#0ea5e9"
              strokeWidth="1.2"
              strokeDasharray="6 8"
              className="opacity-50"
            />
            <circle
              cx="250"
              cy="250"
              r="160"
              stroke="#38bdf8"
              strokeWidth="1"
              strokeDasharray="20 40"
              className="opacity-40"
            />
            <circle
              cx="250"
              cy="250"
              r="125"
              stroke="#22d3ee"
              strokeWidth="2"
              className="opacity-70"
            />

            {/* Hacker Insignia: Cyber Crest / Circuit Skull Glyph */}
            <g className="filter drop-shadow-[0_0_15px_rgba(34,211,238,0.9)]">
              {/* Central Core Diamond */}
              <polygon
                points="250,150 310,210 250,270 190,210"
                stroke="#22d3ee"
                strokeWidth="2.5"
                fill="rgba(6, 182, 212, 0.05)"
              />
              {/* Skull Forehead / Cyber Visor lines */}
              <path
                d="M 180,225 L 320,225 L 305,280 L 275,285 L 250,320 L 225,285 L 195,280 Z"
                stroke="#38bdf8"
                strokeWidth="2"
                fill="rgba(2, 132, 199, 0.12)"
              />
              {/* Cyber Optics (Glow Eyes) */}
              <circle cx="220" cy="250" r="8" fill="#38bdf8" className="animate-ping duration-1000" />
              <circle cx="220" cy="250" r="6" fill="#67e8f9" />
              <circle cx="280" cy="250" r="8" fill="#38bdf8" className="animate-ping duration-1000" />
              <circle cx="280" cy="250" r="6" fill="#67e8f9" />

              {/* Digital Circuit Spine / Teeth */}
              <path
                d="M 230,295 L 230,312 M 243,295 L 243,316 M 257,295 L 257,316 M 270,295 L 270,312"
                stroke="#22d3ee"
                strokeWidth="2"
              />

              {/* Circuit Board Trace Lines */}
              <path
                d="M 130,250 L 190,250 M 310,250 L 370,250"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                d="M 250,90 L 250,150 M 250,330 L 250,410"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                d="M 150,150 L 190,190 M 350,150 L 310,190 M 150,350 L 190,310 M 350,350 L 310,310"
                stroke="#0ea5e9"
                strokeWidth="1.5"
              />

              {/* Orbital Nodes */}
              <circle cx="130" cy="250" r="4" fill="#22d3ee" />
              <circle cx="370" cy="250" r="4" fill="#22d3ee" />
              <circle cx="250" cy="90" r="4" fill="#22d3ee" />
              <circle cx="250" cy="410" r="4" fill="#22d3ee" />
            </g>

            {/* Angular Crosshair Target Reticles */}
            <line x1="20" y1="250" x2="60" y2="250" stroke="#06b6d4" strokeWidth="2" />
            <line x1="440" y1="250" x2="480" y2="250" stroke="#06b6d4" strokeWidth="2" />
            <line x1="250" y1="20" x2="250" y2="60" stroke="#06b6d4" strokeWidth="2" />
            <line x1="250" y1="440" x2="250" y2="480" stroke="#06b6d4" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* Top Utility Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs font-mono z-20">
        <div className="flex items-center gap-2 text-cyan-400 bg-slate-950/80 backdrop-blur border border-cyan-500/30 px-3 py-1.5 rounded-xl shadow-lg">
          <Globe className="w-3.5 h-3.5 animate-spin duration-3000" />
          <span className="font-bold tracking-wider">DOB://NET_SYS.IO</span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            CLUSTER_ONLINE
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAccount && (
            <button
              onClick={onOpenAccount}
              className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-colors shadow-lg cursor-pointer flex items-center gap-1.5"
              title="Sign in or Cloud Save"
            >
              <Cloud className="w-3.5 h-3.5 text-cyan-400" />
              <span className="max-w-[120px] truncate">{currentUser?.email ? currentUser.email.split('@')[0] : 'Sign In'}</span>
            </button>
          )}

          {isAdmin && onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-300 transition-colors shadow-lg cursor-pointer flex items-center gap-1.5 font-bold"
              title="Executive Admin Console"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin</span>
            </button>
          )}

          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors shadow-lg cursor-pointer"
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* Main Center Console */}
      <div className="relative z-10 max-w-xl w-full flex flex-col items-center text-center space-y-6">
        
        {/* FANCY LOOKING GAME TITLE TAG */}
        <div className="space-y-3">
          {/* Top Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-cyan-950/90 via-slate-900 to-indigo-950/90 border border-cyan-500/50 text-[11px] font-mono tracking-widest text-cyan-300 uppercase shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>ENTERPRISE CYBERNETIC TYCOON</span>
            <span className="w-1 h-1 rounded-full bg-cyan-400"></span>
            <span className="text-emerald-400 font-bold">V2.4.0</span>
          </div>

          {/* Core Fancy Title Logo */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 rounded-3xl blur-xl opacity-35 group-hover:opacity-60 transition duration-1000"></div>
            
            <div className="relative bg-slate-950/90 border-2 border-cyan-400/60 rounded-2xl px-6 py-4 sm:px-8 sm:py-5 shadow-2xl backdrop-blur-md">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400 drop-shadow-[0_2px_10px_rgba(6,182,212,0.6)] font-sans">
                DOB ENTERPRISES
              </h1>
              
              <div className="mt-1 flex items-center justify-center gap-3 text-xs font-mono font-bold text-cyan-300/90 tracking-widest uppercase">
                <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-cyan-500"></span>
                <span>GAME INDUSTRY SIMULATOR</span>
                <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-cyan-500"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Studio Name Input & Launch Card */}
        <form
          onSubmit={handleSubmit}
          className="w-full bg-slate-950/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-4 transition-all"
        >
          <div className="text-left space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>PLAYER / STUDIO IDENTITY</span>
              </label>
              <button
                type="button"
                onClick={handleRandomize}
                className="text-[11px] font-mono text-cyan-300 hover:text-white flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-sm"
                title="Generate Random Guest Name"
              >
                <Dices className="w-3.5 h-3.5 text-cyan-400" />
                <span>Roll Random Name</span>
              </button>
            </div>

            {/* Interactive Name Input Slot - Starts empty, editable, changeable anytime */}
            <div className={`relative rounded-xl transition-all border ${
              inputFocused 
                ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] bg-slate-900' 
                : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
            }`}>
              <div className="flex items-center px-3.5 py-2.5 sm:py-3">
                <span className="font-mono text-xs font-bold text-cyan-400 mr-2 shrink-0 select-none">
                  sys://&gt;
                </span>
                <input
                  type="text"
                  value={studioName}
                  onChange={(e) => {
                    setStudioName(e.target.value);
                    setAutoFilled(false);
                  }}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  maxLength={28}
                  placeholder="Enter studio or player name (or leave empty for random)..."
                  className="w-full bg-transparent text-white font-bold text-sm sm:text-base md:text-lg focus:outline-none placeholder:text-slate-600 font-sans tracking-wide"
                />

                {/* Clear button if has text */}
                {studioName ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStudioName('');
                      setAutoFilled(false);
                    }}
                    className="shrink-0 p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 text-xs transition-colors cursor-pointer mr-1"
                    title="Clear name slot"
                  >
                    ✕
                  </button>
                ) : null}

                {/* Direct quick roll inside the input slot */}
                <button
                  type="button"
                  onClick={handleRandomize}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-[11px] font-mono font-bold text-cyan-300 hover:text-white transition-all cursor-pointer shadow-sm"
                  title="Generate a random name for guests/non-accounts"
                >
                  <Dices className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Randomize</span>
                </button>
              </div>
            </div>

            {/* Dynamic Status / Auto-fill Note */}
            {currentUser ? (
              <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-mono px-1">
                <div className="flex items-center gap-1.5 text-cyan-300">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>
                    Auto-filled from <strong>{currentUser.displayName || currentUser.email}</strong> • Changeable anytime
                  </span>
                </div>
                {extractAccountName(currentUser) && studioName !== extractAccountName(currentUser) && (
                  <button
                    type="button"
                    onClick={() => {
                      const accName = extractAccountName(currentUser);
                      setStudioName(accName);
                      setAutoFilled(true);
                      soundManager.playKeyClick();
                    }}
                    className="text-cyan-400 hover:text-cyan-200 underline cursor-pointer text-[10px]"
                  >
                    Reset to Account Name
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-mono px-1 text-slate-400">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>
                    Guest Mode: Empty upon start. Roll a random name or type your own!
                  </span>
                </div>
                <span className="text-cyan-400/80 text-[10px]">Changeable anytime</span>
              </div>
            )}
          </div>

          {/* Quick Random Ideas / Presets */}
          <div className="flex flex-wrap items-center gap-1.5 justify-start text-[11px] font-mono">
            <span className="text-slate-500 text-[10px] uppercase font-bold mr-0.5">Ideas:</span>
            {randomPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  soundManager.playKeyClick();
                  setStudioName(preset);
                  setAutoFilled(false);
                }}
                className={`px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer ${
                  studioName === preset
                    ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 font-bold shadow-sm'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {preset}
              </button>
            ))}
            <button
              type="button"
              onClick={handleRerollPresets}
              className="px-2 py-1 rounded-lg border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 text-[10px] transition-colors cursor-pointer flex items-center gap-1"
              title="Generate new random name suggestions"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>More</span>
            </button>
          </div>

          {/* Existing Progress Snapshot (if returning player) */}
          {hasExistingProgress && (
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono grid grid-cols-3 gap-2">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Capital</div>
                <div className="text-emerald-400 font-bold">{formatMoney(cash)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Valuation</div>
                <div className="text-cyan-400 font-bold">{formatMoney(netWorth)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Published</div>
                <div className="text-purple-400 font-bold">{releasedGamesCount} Games</div>
              </div>
            </div>
          )}

          {/* Launch Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-xl font-black text-sm sm:text-base tracking-wider uppercase text-white bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-xl shadow-cyan-950/60 flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 transition-all group"
          >
            <Play className="w-5 h-5 fill-current text-white group-hover:translate-x-0.5 transition-transform" />
            <span>
              {hasExistingProgress 
                ? (studioName.trim() ? `RESUME ${studioName.toUpperCase()}` : 'RESUME STUDIO') 
                : (studioName.trim() ? `LAUNCH ${studioName.toUpperCase()}` : 'LAUNCH RANDOM STUDIO')}
            </span>
          </button>

          {/* Multiplayer Hub Button */}
          {onOpenMultiplayer && (
            <button
              type="button"
              onClick={onOpenMultiplayer}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase text-cyan-300 bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/50 hover:border-cyan-400 shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Globe className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>MULTIPLAYER HUB (GLOBAL & FRIENDS)</span>
            </button>
          )}

          {/* Reset progress option if existing save */}
          {hasExistingProgress && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset all corporate capital and progress to start a brand new studio?')) {
                    onResetGame();
                  }
                }}
                className="text-[11px] font-mono text-slate-500 hover:text-rose-400 flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Save & Start Fresh</span>
              </button>
            </div>
          )}
        </form>

        {/* Cyberpunk Footer Highlights */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-500">
          <span className="flex items-center gap-1 text-slate-400">
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            Type Code to Earn
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            Develop Multi-Platform Games
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            Corporate $200k Lawsuits
          </span>
        </div>
      </div>
    </div>
  );
};
