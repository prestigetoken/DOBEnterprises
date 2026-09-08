import React, { useState } from 'react';
import { 
  Scale, 
  Gavel, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Briefcase, 
  DollarSign, 
  Users, 
  Zap 
} from 'lucide-react';
import { CompetitorStudio, Lawsuit } from '../types';
import { soundManager } from '../utils/audio';

interface LawsuitCenterProps {
  cash: number;
  competitors: CompetitorStudio[];
  activeLawsuits: Lawsuit[];
  lawsuitHistory: Lawsuit[];
  onFileLawsuit: (
    targetStudio: CompetitorStudio,
    claim: string,
    lawyerTier: 'cheap' | 'standard' | 'shark'
  ) => void;
  onResolveIncomingLawsuit: (lawsuitId: string, action: 'settle' | 'fight') => void;
}

export const LawsuitCenter: React.FC<LawsuitCenterProps> = ({
  cash,
  competitors,
  activeLawsuits,
  lawsuitHistory,
  onFileLawsuit,
  onResolveIncomingLawsuit
}) => {
  const [selectedStudioId, setSelectedStudioId] = useState<string>(competitors[0]?.id || '');
  const [selectedClaim, setSelectedClaim] = useState<string>('Copyright Infringement (Asset & Shader Theft)');
  const [selectedLawyer, setSelectedLawyer] = useState<'cheap' | 'standard' | 'shark'>('standard');

  const claims = [
    {
      title: 'Copyright Infringement (Asset & Shader Theft)',
      description: 'Accuse rival of copying code structures, 3D meshes, and game engine mechanics.'
    },
    {
      title: 'Patent Trolling (Multiplayer Netcode Patent)',
      description: 'Assert patent ownership over server tick synchronization loops.'
    },
    {
      title: 'Blatant .io Game Clone & Trademark Violation',
      description: 'Sue for copying your game mechanics and confusing player bases.'
    },
    {
      title: 'Corporate Sabotage & Malicious Server DDoS',
      description: 'Claim rival intentionally degraded your game server uptime.'
    }
  ];

  const lawyerTiers = [
    {
      id: 'cheap' as const,
      name: 'Fresh Law Graduate',
      cost: 50000,
      winBoost: 0,
      description: 'Budget legal representation. 40-50% win probability.'
    },
    {
      id: 'standard' as const,
      name: 'Downtown IP Corporate Firm',
      cost: 200000, // The iconic $200,000 from gameinc.io!
      winBoost: 25,
      description: 'Experienced game industry attorneys. 65-75% win probability.'
    },
    {
      id: 'shark' as const,
      name: 'Wall Street Shark Litigators',
      cost: 650000,
      winBoost: 45,
      description: 'Ruthless courtroom gladiators. 85-95% win probability.'
    }
  ];

  const selectedCompetitor = competitors.find((c) => c.id === selectedStudioId) || competitors[0];
  const currentLawyer = lawyerTiers.find((l) => l.id === selectedLawyer)!;
  const canAffordLawsuit = cash >= currentLawyer.cost;

  // Potential payout estimation based on target studio net worth
  const estimatedSettlement = selectedCompetitor
    ? Math.round(selectedCompetitor.netWorth * 0.22 + 100000)
    : 250000;

  const baseChance = 50;
  const defensePenalty = (selectedCompetitor?.legalDefenseLevel || 3) * 6;
  const estimatedWinChance = Math.min(96, Math.max(15, baseChance + currentLawyer.winBoost - defensePenalty));

  const incomingLawsuits = activeLawsuits.filter((l) => l.type === 'incoming');

  const handleFileLawsuitClick = () => {
    if (!selectedCompetitor || !canAffordLawsuit) return;
    soundManager.playGavel();
    onFileLawsuit(selectedCompetitor, selectedClaim, selectedLawyer);
  };

  const formatMoney = (amount: number) => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}k`;
    return `$${Math.floor(amount).toLocaleString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Incoming Lawsuits Alert (Competitors suing player!) */}
      {incomingLawsuits.length > 0 && (
        <div className="bg-rose-950/40 border-2 border-rose-600 rounded-xl p-4 shadow-2xl animate-pulse">
          <div className="flex items-center gap-2 mb-2 text-rose-400 font-extrabold text-base">
            <ShieldAlert className="w-5 h-5 animate-bounce" />
            <span>URGENT: YOU ARE BEING SUED IN FEDERAL COURT!</span>
          </div>
          <p className="text-xs text-rose-200 mb-3">
            Rival game studios are targeting your success. Settle out of court or hire legal defense to fight back!
          </p>

          <div className="space-y-2.5">
            {incomingLawsuits.map((lawsuit) => {
              const settleCost = Math.round(lawsuit.cost * 0.5);
              const defenseCost = lawsuit.cost;

              return (
                <div
                  key={lawsuit.id}
                  className="bg-slate-950/90 rounded-lg p-3 border border-rose-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="text-rose-400 font-mono">Plaintiff:</span>
                      <span>{lawsuit.targetStudioName}</span>
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">Claim: {lawsuit.claim}</div>
                    <div className="text-xs text-amber-400 font-mono mt-1">
                      Damages Claimed: <strong>{formatMoney(lawsuit.potentialSettlement)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onResolveIncomingLawsuit(lawsuit.id, 'settle')}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 cursor-pointer"
                    >
                      Settle Out of Court ({formatMoney(settleCost)})
                    </button>
                    <button
                      onClick={() => onResolveIncomingLawsuit(lawsuit.id, 'fight')}
                      className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg cursor-pointer flex items-center gap-1.5"
                    >
                      <Gavel className="w-3.5 h-3.5" />
                      <span>Fight in Trial ({formatMoney(defenseCost)})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* File New Lawsuit Panel */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-bold text-white text-sm sm:text-base">
                Corporate Litigation & Lawsuit Chamber
              </h2>
              <p className="text-[11px] text-slate-400">
                Sue competitor studios on the leaderboard for copyright theft, patent infringement, or clones to win huge payouts!
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Step 1: Select Target Rival */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">1</span>
                Target Competitor Studio
              </div>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {competitors.map((studio) => (
                  <div
                    key={studio.id}
                    onClick={() => setSelectedStudioId(studio.id)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      selectedStudioId === studio.id
                        ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span className="text-slate-500 font-mono">#{studio.rank}</span>
                        <span>{studio.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Top Hit: {studio.topGame}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-emerald-400 font-semibold">{formatMoney(studio.netWorth)}</div>
                      <div className="text-[9px] text-slate-500">Def: Lv.{studio.legalDefenseLevel}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2: Choose Legal Claim */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">2</span>
                Choose Cause of Action
              </div>
              <div className="space-y-1.5">
                {claims.map((claim, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedClaim(claim.title)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      selectedClaim === claim.title
                        ? 'bg-amber-950/40 border-amber-500 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="font-bold text-[11px]">{claim.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{claim.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 3: Retain Legal Counsel & File */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px]">3</span>
                Retain Law Firm
              </div>
              <div className="space-y-2">
                {lawyerTiers.map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedLawyer(tier.id)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      selectedLawyer === tier.id
                        ? 'bg-purple-950/40 border-purple-500 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[11px]">
                      <span>{tier.name}</span>
                      <span className="text-amber-400 font-mono">{formatMoney(tier.cost)}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{tier.description}</div>
                  </div>
                ))}
              </div>

              {/* Case Projections */}
              <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Est. Win Chance:</span>
                  <strong className={estimatedWinChance >= 70 ? 'text-emerald-400' : 'text-amber-400'}>
                    {estimatedWinChance}%
                  </strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Potential Award:</span>
                  <strong className="text-emerald-400">+{formatMoney(estimatedSettlement)}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Legal Retainer Fee:</span>
                  <strong className="text-rose-400">-{formatMoney(currentLawyer.cost)}</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-800">
              <button
                onClick={handleFileLawsuitClick}
                disabled={!canAffordLawsuit}
                className={`w-full py-2.5 rounded-lg text-xs font-black tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all ${
                  canAffordLawsuit
                    ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white cursor-pointer active:scale-95'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <Gavel className="w-4 h-4" />
                <span>
                  {canAffordLawsuit
                    ? `FILE LAWSUIT (${formatMoney(currentLawyer.cost)})`
                    : `Need ${formatMoney(currentLawyer.cost)} to Sue`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lawsuit Docket History */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl">
        <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-slate-400" />
          <span>Court Case Docket & Verdicts</span>
        </h3>

        {lawsuitHistory.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500 italic">
            No past court cases on record. Once you sue competitor studios or settle claims, the official verdicts will be docketed here.
          </div>
        ) : (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {lawsuitHistory.map((item) => (
              <div
                key={item.id}
                className={`p-2.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  item.won
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                    : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.won ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-white">
                      {item.type === 'outgoing' ? 'Plaintiff Case vs ' : 'Defended vs '}
                      <span className="text-cyan-300">{item.targetStudioName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.resultMessage}</div>
                  </div>
                </div>

                <div className="font-mono font-bold text-xs self-end sm:self-auto">
                  {item.won ? (
                    <span className="text-emerald-400">+{formatMoney(item.damagesPaidOrReceived || 0)}</span>
                  ) : (
                    <span className="text-rose-400">-{formatMoney(item.damagesPaidOrReceived || 0)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
