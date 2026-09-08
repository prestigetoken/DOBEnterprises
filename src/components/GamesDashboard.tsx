import React from 'react';
import { 
  Gamepad2, 
  PlayCircle, 
  Bug, 
  Sparkles, 
  Flame, 
  TrendingUp, 
  Star, 
  RefreshCw, 
  PackagePlus, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Users 
} from 'lucide-react';
import { ActiveGame, ReleasedGame } from '../types';
import { PLATFORM_CONFIGS } from '../data/initialData';

interface GamesDashboardProps {
  cash: number;
  activeGame: ActiveGame | null;
  releasedGames: ReleasedGame[];
  totalLocPerSec: number;
  onOpenNewGameModal: () => void;
  onFixBugs: () => void;
  onPublishGame: () => void;
  onPushUpdate: (gameId: string) => void;
  onReleaseDlc: (gameId: string) => void;
}

export const GamesDashboard: React.FC<GamesDashboardProps> = ({
  cash,
  activeGame,
  releasedGames,
  totalLocPerSec,
  onOpenNewGameModal,
  onFixBugs,
  onPublishGame,
  onPushUpdate,
  onReleaseDlc
}) => {
  const formatMoney = (amount: number) => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}k`;
    return `$${Math.floor(amount).toLocaleString()}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  // Calculations for active game
  const progressPct = activeGame
    ? Math.min(100, Math.floor((activeGame.currentLoc / activeGame.targetLoc) * 100))
    : 0;

  const isReadyToPublish = activeGame ? activeGame.currentLoc >= activeGame.targetLoc : false;

  const secondsRemaining = activeGame && totalLocPerSec > 0
    ? Math.max(0, Math.ceil((activeGame.targetLoc - activeGame.currentLoc) / totalLocPerSec))
    : 0;

  return (
    <div className="space-y-4">
      {/* Active Game Section */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-white text-sm sm:text-base">Game Development Pipeline</h2>
          </div>

          {!activeGame && (
            <button
              onClick={onOpenNewGameModal}
              disabled={cash < 5000}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                cash >= 5000
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              <span>Start New Project {cash < 5000 ? '($5,000 req.)' : ''}</span>
            </button>
          )}
        </div>

        {activeGame ? (
          <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    {activeGame.title}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                    {PLATFORM_CONFIGS[activeGame.platform]?.name || activeGame.platform}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                  <span>Genre: <strong className="text-slate-200">{activeGame.genre}</strong></span>
                  <span>•</span>
                  <span>Theme: <strong className="text-slate-200">{activeGame.theme}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Dev Pace</div>
                  <div className="font-mono font-bold text-xs text-indigo-300">
                    {totalLocPerSec} LOC/s
                  </div>
                </div>
                {secondsRemaining > 0 && !isReadyToPublish && (
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">ETA</div>
                    <div className="font-mono font-bold text-xs text-amber-300 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      <span>{secondsRemaining}s</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-300 font-semibold">
                  Lines of Code: {formatNumber(Math.floor(activeGame.currentLoc))} / {formatNumber(activeGame.targetLoc)} LOC
                </span>
                <span className="font-bold text-cyan-400">{progressPct}%</span>
              </div>
              <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isReadyToPublish
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 animate-pulse'
                      : 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500'
                  }`}
                  style={{ width: `${progressPct}%` }}
                ></div>
              </div>
            </div>

            {/* Bugs & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 font-mono ${
                  activeGame.bugs > 0 
                    ? 'bg-rose-950/30 border-rose-800/40 text-rose-300' 
                    : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                }`}>
                  <Bug className="w-3.5 h-3.5" />
                  <span>{activeGame.bugs} Bugs Reported</span>
                </div>

                {activeGame.bugs > 0 && (
                  <button
                    onClick={onFixBugs}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 hover:text-white cursor-pointer active:scale-95 transition-colors"
                  >
                    Squash Bugs (-5)
                  </button>
                )}
              </div>

              <div>
                {isReadyToPublish ? (
                  <button
                    onClick={onPublishGame}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-900/50 flex items-center gap-2 cursor-pointer active:scale-95 animate-bounce transition-transform"
                  >
                    <Sparkles className="w-4 h-4 fill-current text-amber-200" />
                    <span>LAUNCH GAME WORLDWIDE!</span>
                  </button>
                ) : (
                  <div className="text-xs text-slate-400 italic">
                    Type on your keyboard to accelerate coding!
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 px-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
            <Gamepad2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-300 mb-1">No Active Project in Development</div>
            <div className="text-xs text-slate-500 max-w-md mx-auto mb-3">
              Start developing an online .io game, mobile app, or AAA title. Assign your hired coders to write lines of code, squash bugs, and ship to the world.
            </div>
            <button
              onClick={onOpenNewGameModal}
              disabled={cash < 5000}
              className={`px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-2 transition-all ${
                cash >= 5000
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer shadow-lg shadow-cyan-900/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              <span>Create Game Project {cash < 5000 ? '(Earn $5,000 to unlock)' : ''}</span>
            </button>
          </div>
        )}
      </div>

      {/* Released Games Catalog */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-white text-sm sm:text-base">
              Published Catalog ({releasedGames.length})
            </h2>
          </div>
          {releasedGames.length > 0 && (
            <div className="text-xs text-slate-400 font-mono">
              Total Catalog Income:{' '}
              <strong className="text-emerald-400">
                +{formatMoney(releasedGames.reduce((acc, g) => acc + g.revenuePerSec, 0))}/s
              </strong>
            </div>
          )}
        </div>

        {releasedGames.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs italic">
            You haven't released any games yet. Finish a project above to start generating continuous revenue and followers!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
            {releasedGames.map((game) => (
              <div
                key={game.id}
                className="bg-slate-950/80 rounded-lg border border-slate-800 p-3 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-sm tracking-tight">{game.title}</h4>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span className="text-cyan-400 font-medium">{game.genre}</span>
                        <span>•</span>
                        <span className="text-indigo-400 font-medium uppercase">{game.platform}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs">
                      <Star className="w-3 h-3 fill-current text-amber-400" />
                      <span>{game.reviewScore.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded border border-slate-800/80">
                    "{game.criticQuote}"
                  </div>

                  {/* Financial Stats */}
                  <div className="grid grid-cols-3 gap-2 mt-2.5 text-[11px] font-mono">
                    <div className="bg-slate-900/80 p-1.5 rounded">
                      <div className="text-[9px] text-slate-500 uppercase">Cash Flow</div>
                      <div className="text-emerald-400 font-bold">
                        +{formatMoney(game.revenuePerSec)}/s
                      </div>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded">
                      <div className="text-[9px] text-slate-500 uppercase">Total Gross</div>
                      <div className="text-slate-200 font-bold">{formatMoney(game.totalEarnings)}</div>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded">
                      <div className="text-[9px] text-slate-500 uppercase">Fans Gained</div>
                      <div className="text-purple-300 font-bold">+{formatNumber(game.fansGained)}</div>
                    </div>
                  </div>
                </div>

                {/* Game Maintenance Actions */}
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800/80 justify-between">
                  <div className="text-[10px] text-slate-500">
                    Patches: <strong className="text-slate-300">{game.updatesCount}</strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onPushUpdate(game.id)}
                      disabled={cash < 2000}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-[11px] text-cyan-300 font-medium flex items-center gap-1 border border-slate-700 cursor-pointer active:scale-95 transition-colors"
                      title="Push an update patch to boost revenue ($2,000)"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Patch ($2k)</span>
                    </button>

                    <button
                      onClick={() => onReleaseDlc(game.id)}
                      disabled={cash < 15000}
                      className="px-2 py-1 rounded bg-indigo-900/50 hover:bg-indigo-800/60 disabled:opacity-50 text-[11px] text-indigo-300 font-medium flex items-center gap-1 border border-indigo-700/50 cursor-pointer active:scale-95 transition-colors"
                      title="Release DLC expansion to extend game lifecycle ($15,000)"
                    >
                      <PackagePlus className="w-3 h-3" />
                      <span>DLC ($15k)</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
