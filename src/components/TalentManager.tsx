import React from 'react';
import { Users, UserPlus, RefreshCw, AlertTriangle, Zap, DollarSign, Award, Trash2, Building } from 'lucide-react';
import { Talent } from '../types';

interface TalentManagerProps {
  cash: number;
  candidates: Talent[];
  hiredTalent: Talent[];
  deskLimit: number;
  onHireTalent: (talent: Talent) => void;
  onFireTalent: (talentId: string) => void;
  onRerollCandidates: () => void;
  onOpenOfficeUpgrades: () => void;
}

export const TalentManager: React.FC<TalentManagerProps> = ({
  cash,
  candidates,
  hiredTalent,
  deskLimit,
  onHireTalent,
  onFireTalent,
  onRerollCandidates,
  onOpenOfficeUpgrades
}) => {
  const isDeskFull = hiredTalent.length >= deskLimit;
  const totalWages = hiredTalent.reduce((acc, t) => acc + t.wagePerSec, 0);
  const totalTeamLoc = hiredTalent.reduce((acc, t) => acc + t.locPerSec, 0);

  const formatMoney = (amount: number) => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}k`;
    return `$${Math.floor(amount).toLocaleString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Hiring Hall: 3 Options with Mystery Candidate */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="font-bold text-white text-sm sm:text-base">Recruitment Office</h2>
              <p className="text-[11px] text-slate-400">
                Choose from 3 available talents. Beware: employee salaries ($/s) will drain your balance!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onRerollCandidates}
              disabled={cash < 500}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-colors"
              title="Refresh candidate applicants ($500 fee)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reroll ($500)</span>
            </button>

            <button
              onClick={onOpenOfficeUpgrades}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-cyan-300 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-colors"
            >
              <Building className="w-3.5 h-3.5" />
              <span>Desks: {hiredTalent.length}/{deskLimit}</span>
            </button>
          </div>
        </div>

        {isDeskFull && (
          <div className="mb-3 p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Your office is at full desk capacity! Upgrade your office space to hire more staff.</span>
            </div>
            <button
              onClick={onOpenOfficeUpgrades}
              className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[11px] cursor-pointer"
            >
              Upgrade Space
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {candidates.map((talent) => {
            const canAffordSigning = cash >= talent.signingBonus;
            const canHire = canAffordSigning && !isDeskFull;

            return (
              <div
                key={talent.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                  talent.isMystery
                    ? 'bg-gradient-to-b from-purple-950/30 via-slate-900 to-slate-950 border-purple-500/40 shadow-lg shadow-purple-950/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shadow-inner">
                        {talent.avatar}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm tracking-tight flex items-center gap-1">
                          {talent.name}
                        </h4>
                        <div className="text-[11px] text-cyan-400 font-medium">{talent.role}</div>
                      </div>
                    </div>

                    {talent.isMystery && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-wider">
                        Wildcard
                      </span>
                    )}
                  </div>

                  {talent.flavorQuote && (
                    <div className="mt-2 text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded border border-slate-800/80">
                      "{talent.flavorQuote}"
                    </div>
                  )}

                  {/* Candidate Stats */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
                      <div className="text-[9px] text-slate-400 uppercase font-sans">Speed</div>
                      <div className="text-indigo-300 font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-indigo-400" />
                        <span>{talent.locPerSec} LOC/s</span>
                      </div>
                    </div>

                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
                      <div className="text-[9px] text-slate-400 uppercase font-sans">Salary Cost</div>
                      <div className="text-amber-400 font-bold flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-amber-400" />
                        <span>{formatMoney(talent.wagePerSec)}/s</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Signing Bonus:</span>
                    <strong className="text-white font-mono">{formatMoney(talent.signingBonus)}</strong>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => onHireTalent(talent)}
                    disabled={!canHire}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md ${
                      canHire
                        ? talent.isMystery
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white cursor-pointer active:scale-95'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer active:scale-95'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>
                      {isDeskFull
                        ? 'Desks Full'
                        : !canAffordSigning
                        ? `Need ${formatMoney(talent.signingBonus)}`
                        : `Hire (${formatMoney(talent.signingBonus)})`}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Employed Team Roster */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h2 className="font-bold text-white text-sm sm:text-base">
              Active Studio Team ({hiredTalent.length})
            </h2>
          </div>

          {hiredTalent.length > 0 && (
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-400">
                Team Output: <strong className="text-indigo-300">{totalTeamLoc} LOC/s</strong>
              </span>
              <span>•</span>
              <span className="text-slate-400">
                Payroll: <strong className="text-amber-400">-{formatMoney(totalWages)}/s</strong>
              </span>
            </div>
          )}
        </div>

        {hiredTalent.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs italic bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            No programmers hired yet. Hire your first talent above to automate code generation and speed up game development!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">
            {hiredTalent.map((talent) => (
              <div
                key={talent.id}
                className="bg-slate-950/80 rounded-lg border border-slate-800 p-3 flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                    {talent.avatar}
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs tracking-tight">{talent.name}</h5>
                    <div className="text-[10px] text-cyan-400">{talent.role}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                      <span className="text-indigo-300 font-semibold">{talent.locPerSec} LOC/s</span>
                      <span>|</span>
                      <span className="text-amber-400 font-semibold">-${talent.wagePerSec}/s</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onFireTalent(talent.id)}
                  className="p-1.5 rounded bg-slate-800 hover:bg-rose-900/60 border border-slate-700 hover:border-rose-700 text-slate-400 hover:text-rose-300 cursor-pointer active:scale-95 transition-colors"
                  title="Fire developer to eliminate their salary"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
