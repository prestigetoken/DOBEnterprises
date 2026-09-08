import React, { useState } from 'react';
import { 
  DollarSign, 
  Users, 
  Code2, 
  TrendingUp, 
  TrendingDown, 
  Volume2, 
  VolumeX, 
  Trophy, 
  Edit3, 
  Check, 
  AlertTriangle,
  Building,
  Globe
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HeaderProps {
  studioName: string;
  onUpdateStudioName: (name: string) => void;
  cash: number;
  netWorth: number;
  followers: number;
  totalLocPerSec: number;
  incomePerSec: number;
  expensesPerSec: number;
  deskLimit: number;
  hiredCount: number;
  onOpenOfficeUpgrades: () => void;
  onResetGame: () => void;
  onOpenMainScreen?: () => void;
  onOpenMultiplayer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  studioName,
  onUpdateStudioName,
  cash,
  netWorth,
  followers,
  totalLocPerSec,
  incomePerSec,
  expensesPerSec,
  deskLimit,
  hiredCount,
  onOpenOfficeUpgrades,
  onResetGame,
  onOpenMainScreen,
  onOpenMultiplayer
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(studioName);
  const [soundOn, setSoundOn] = useState(soundManager.enabled);

  const netCashflow = incomePerSec - expensesPerSec;
  const isDebt = cash < 0;

  const handleSaveName = () => {
    if (tempName.trim()) {
      onUpdateStudioName(tempName.trim());
    }
    setIsEditingName(false);
  };

  const toggleSound = () => {
    const next = !soundOn;
    soundManager.enabled = next;
    setSoundOn(next);
  };

  const formatMoney = (amount: number) => {
    const isNeg = amount < 0;
    const abs = Math.abs(amount);
    if (abs >= 1_000_000_000) {
      return `${isNeg ? '-' : ''}$${(abs / 1_000_000_000).toFixed(2)}B`;
    }
    if (abs >= 1_000_000) {
      return `${isNeg ? '-' : ''}$${(abs / 1_000_000).toFixed(2)}M`;
    }
    if (abs >= 1_000) {
      return `${isNeg ? '-' : ''}$${(abs / 1_000).toFixed(1)}k`;
    }
    return `${isNeg ? '-' : ''}$${Math.floor(abs).toLocaleString()}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 text-slate-100 backdrop-blur sticky top-0 z-40 px-4 py-3 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Studio Name & Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div 
              onClick={onOpenMainScreen}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-cyan-900/40 border border-cyan-400/40 text-xs tracking-wider font-mono cursor-pointer hover:scale-105 active:scale-95 transition-all"
              title="Return to Main Screen"
            >
              DOB
            </div>
            <div>
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    maxLength={24}
                    className="bg-slate-800 text-white px-2 py-0.5 text-sm rounded border border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                    title="Save name"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                  <span className="font-extrabold text-base md:text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                    {studioName}
                  </span>
                  <Edit3 className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </div>
              )}
              <div className="text-[11px] text-cyan-400 font-mono flex items-center gap-1 font-semibold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block"></span>
                DOB ENTERPRISES ONLINE
              </div>
            </div>
          </div>

          {/* Quick controls on mobile */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={toggleSound}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300"
              title={soundOn ? 'Mute audio' : 'Unmute audio'}
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </div>

        {/* Center: Primary Stats Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
          {/* Cash */}
          <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2.5 ${
            isDebt 
              ? 'bg-rose-950/40 border-rose-600/60 text-rose-300 animate-pulse' 
              : 'bg-slate-800/80 border-slate-700/70 text-slate-200'
          }`}>
            <div className={`p-1.5 rounded-md ${isDebt ? 'bg-rose-600/30 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {isDebt ? <AlertTriangle className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {isDebt ? 'DEBT CRISIS' : 'Cash Balance'}
              </div>
              <div className={`font-mono-code font-bold text-sm sm:text-base ${isDebt ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatMoney(cash)}
              </div>
            </div>
          </div>

          {/* Net Cashflow ($/s) */}
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/70 text-slate-200 flex items-center gap-2.5">
            <div className={`p-1.5 rounded-md ${netCashflow >= 0 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {netCashflow >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Net Flow</div>
              <div className={`font-mono-code font-bold text-sm ${netCashflow >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                {netCashflow >= 0 ? '+' : ''}{formatMoney(netCashflow)}/s
              </div>
            </div>
          </div>

          {/* Dev Speed (LOC/s) */}
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/70 text-slate-200 flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-indigo-500/20 text-indigo-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Dev Speed</div>
              <div className="font-mono-code font-bold text-sm text-indigo-300">
                {formatNumber(totalLocPerSec)} <span className="text-[10px] font-normal text-slate-400">LOC/s</span>
              </div>
            </div>
          </div>

          {/* Followers / Fans */}
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/70 text-slate-200 flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-purple-500/20 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Followers</div>
              <div className="font-mono-code font-bold text-sm text-purple-300">
                {formatNumber(followers)}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Net Worth, Office Desks & System buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-800 pt-2 md:pt-0">
          <button
            onClick={onOpenOfficeUpgrades}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-colors"
            title="Expand office desks"
          >
            <Building className="w-3.5 h-3.5 text-cyan-400" />
            <span>Desks: <strong className="text-white font-mono">{hiredCount}/{deskLimit}</strong></span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wider text-amber-400/80 font-bold">Net Worth</div>
              <div className="font-mono-code font-extrabold text-xs text-amber-300">{formatMoney(netWorth)}</div>
            </div>
          </div>

          <button
            onClick={toggleSound}
            className="hidden md:flex p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={soundOn ? 'Mute audio' : 'Unmute audio'}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {onOpenMultiplayer && (
            <button
              onClick={onOpenMultiplayer}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-950/90 to-indigo-950/90 hover:from-cyan-900 hover:to-indigo-900 border border-cyan-500/60 text-xs text-cyan-300 font-bold transition-all shadow-md shadow-cyan-950/50 cursor-pointer animate-pulse hover:animate-none"
              title="Open Real-time Global & Friends Multiplayer Hub"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multiplayer</span>
            </button>
          )}

          {onOpenMainScreen && (
            <button
              onClick={onOpenMainScreen}
              className="text-[11px] font-bold px-2.5 py-1 rounded bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-700/50 text-cyan-300 transition-colors cursor-pointer"
              title="Return to Main Title Screen"
            >
              Main Screen
            </button>
          )}

          <button
            onClick={onResetGame}
            className="text-[11px] px-2 py-1 rounded bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/40 text-rose-300 transition-colors"
            title="Start over with a fresh studio"
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  );
};
