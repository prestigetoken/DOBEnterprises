import React, { useState } from 'react';
import { X, Dices, Gamepad2, Sparkles, DollarSign, Code2, Users } from 'lucide-react';
import { GameType, GameGenre, GameTheme } from '../types';
import { PLATFORM_CONFIGS } from '../data/initialData';
import { FUN_GAME_NAMES } from '../utils/codeSnippets';

interface NewGameModalProps {
  isOpen: boolean;
  cash: number;
  onClose: () => void;
  onStartGame: (title: string, platform: GameType, genre: GameGenre, theme: GameTheme) => void;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({
  isOpen,
  cash,
  onClose,
  onStartGame
}) => {
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<GameType>('web');
  const [genre, setGenre] = useState<GameGenre>('Arcade .io');
  const [theme, setTheme] = useState<GameTheme>('Cyberpunk');

  if (!isOpen) return null;

  const genres: GameGenre[] = [
    'Action',
    'Battle Royale',
    'Arcade .io',
    'RPG',
    'Strategy',
    'Simulation',
    'Puzzle',
    'Horror'
  ];

  const themes: GameTheme[] = [
    'Cyberpunk',
    'Zombies',
    'Space Sci-Fi',
    'Medieval Fantasy',
    'Pixel Roguelike',
    'Dungeon Crawler',
    'Hacker Cyberwar',
    'Cute Animals'
  ];

  const selectedPlatformConfig = PLATFORM_CONFIGS[platform];
  const canAfford = cash >= selectedPlatformConfig.cost;

  const handleRandomizeTitle = () => {
    const randomName = FUN_GAME_NAMES[Math.floor(Math.random() * FUN_GAME_NAMES.length)];
    setTitle(randomName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || FUN_GAME_NAMES[Math.floor(Math.random() * FUN_GAME_NAMES.length)];
    if (canAfford) {
      onStartGame(finalTitle, platform, genre, theme);
      onClose();
    }
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-extrabold text-white text-base">New Game Development Pitch</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Game Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Game Title
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. SlitherStrike 3D"
                maxLength={32}
                className="flex-1 bg-slate-950 border border-slate-700 text-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="button"
                onClick={handleRandomizeTitle}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-colors"
                title="Generate Random Title"
              >
                <Dices className="w-4 h-4" />
                <span>Random</span>
              </button>
            </div>
          </div>

          {/* Platform / Scope Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Platform & Scope
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.values(PLATFORM_CONFIGS).map((p) => {
                const isSelected = platform === p.id;
                const affordable = cash >= p.cost;

                return (
                  <div
                    key={p.id}
                    onClick={() => setPlatform(p.id as GameType)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-md'
                        : affordable
                        ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                        : 'bg-slate-950/30 border-slate-800/50 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="font-bold text-[11px] truncate">{p.name}</div>
                    <div className="font-mono text-emerald-400 font-bold mt-1 text-[11px]">
                      {formatMoney(p.cost)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {formatNumber(p.targetLoc)} LOC
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 italic">
              {selectedPlatformConfig.description}
            </p>
          </div>

          {/* Genre & Theme Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Genre */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Game Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value as GameGenre)}
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {genres.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Visual Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as GameTheme)}
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {themes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Project Summary Box */}
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-3 text-xs font-mono grid grid-cols-3 gap-2">
            <div className="p-1.5 rounded bg-slate-900/60">
              <div className="text-[9px] text-slate-400 uppercase font-sans">Budget Required</div>
              <div className="text-emerald-400 font-bold flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                <span>{formatMoney(selectedPlatformConfig.cost)}</span>
              </div>
            </div>

            <div className="p-1.5 rounded bg-slate-900/60">
              <div className="text-[9px] text-slate-400 uppercase font-sans">Required LOC</div>
              <div className="text-cyan-400 font-bold flex items-center gap-1">
                <Code2 className="w-3 h-3" />
                <span>{formatNumber(selectedPlatformConfig.targetLoc)}</span>
              </div>
            </div>

            <div className="p-1.5 rounded bg-slate-900/60">
              <div className="text-[9px] text-slate-400 uppercase font-sans">Fan Potential</div>
              <div className="text-purple-400 font-bold flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>+{formatNumber(selectedPlatformConfig.baseFollowers)}</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!canAfford}
              className={`w-full py-3 rounded-xl font-black text-xs sm:text-sm tracking-wide shadow-xl flex items-center justify-center gap-2 transition-all ${
                canAfford
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {canAfford
                  ? `COMMENCE DEVELOPMENT (${formatMoney(selectedPlatformConfig.cost)})`
                  : `INSUFFICIENT FUNDS (Need ${formatMoney(selectedPlatformConfig.cost)})`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
