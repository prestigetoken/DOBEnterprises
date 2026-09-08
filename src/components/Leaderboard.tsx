import React from 'react';
import { Trophy, Users, Gamepad2, Scale, Crown, Shield } from 'lucide-react';
import { CompetitorStudio } from '../types';

interface LeaderboardProps {
  playerRank: number;
  playerStudio: CompetitorStudio;
  competitors: CompetitorStudio[];
  onSelectStudioToSue: (studioId: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  playerRank,
  playerStudio,
  competitors,
  onSelectStudioToSue
}) => {
  // Merge player into leaderboard list and sort by net worth descending
  const allStudios: CompetitorStudio[] = [
    ...competitors.filter((c) => !c.isPlayer),
    { ...playerStudio, isPlayer: true }
  ].sort((a, b) => b.netWorth - a.netWorth);

  const formatMoney = (amount: number) => {
    if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(2)}B`;
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}k`;
    return `$${Math.floor(amount).toLocaleString()}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="font-bold text-white text-sm sm:text-base">
              Global .io Studio Leaderboard
            </h2>
            <p className="text-[11px] text-slate-400">
              Compete against other game studios in real-time. Rise in ranks by releasing hit games and suing rival leaders!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs self-end sm:self-auto">
          <span className="text-slate-400">Your Global Standing:</span>
          <span className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold flex items-center gap-1">
            <Crown className="w-3.5 h-3.5" />
            <span>Rank #{playerRank}</span>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3">Rank</th>
              <th className="py-2.5 px-3">Studio Name</th>
              <th className="py-2.5 px-3">Flagship Game</th>
              <th className="py-2.5 px-3">Followers</th>
              <th className="py-2.5 px-3 text-right">Net Worth</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {allStudios.map((studio, idx) => {
              const rank = idx + 1;
              const isUser = studio.isPlayer;

              return (
                <tr
                  key={studio.id}
                  className={`transition-colors ${
                    isUser
                      ? 'bg-gradient-to-r from-emerald-950/40 via-cyan-950/40 to-slate-900 font-bold border-l-4 border-l-cyan-400'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-extrabold text-[11px] ${
                        rank === 1
                          ? 'bg-amber-400 text-slate-950'
                          : rank === 2
                          ? 'bg-slate-300 text-slate-950'
                          : rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {rank}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 font-sans">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isUser ? 'text-cyan-300' : 'text-white'}`}>
                        {studio.name}
                      </span>
                      {isUser && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          YOU
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 font-sans text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Gamepad2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate max-w-[140px] sm:max-w-[200px]">{studio.topGame}</span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-purple-300">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-purple-400" />
                      <span>{formatNumber(studio.followers)}</span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <span className={isUser ? 'text-emerald-400 font-extrabold' : 'text-slate-200'}>
                      {formatMoney(studio.netWorth)}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    {!isUser ? (
                      <button
                        onClick={() => onSelectStudioToSue(studio.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-amber-600/30 hover:border-amber-500/50 border border-slate-700 text-[11px] text-amber-300 font-sans font-bold flex items-center gap-1 mx-auto cursor-pointer active:scale-95 transition-all"
                        title={`Sue ${studio.name} in federal court`}
                      >
                        <Scale className="w-3 h-3" />
                        <span>Sue</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-sans italic">Your Studio</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
