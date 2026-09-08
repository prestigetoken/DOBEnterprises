import React, { useState } from 'react';
import { 
  Building, 
  Keyboard, 
  Monitor, 
  Server, 
  Cpu, 
  Coffee, 
  Gamepad2, 
  Share2, 
  Tv, 
  Check, 
  DollarSign, 
  Sparkles,
  Building2,
  Briefcase,
  Landmark
} from 'lucide-react';
import { StudioUpgrade } from '../types';

interface UpgradesShopProps {
  cash: number;
  upgrades: StudioUpgrade[];
  onPurchaseUpgrade: (upgradeId: string) => void;
}

export const UpgradesShop: React.FC<UpgradesShopProps> = ({
  cash,
  upgrades,
  onPurchaseUpgrade
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'office' | 'hardware' | 'perk' | 'marketing'>('all');

  const categories = [
    { id: 'all' as const, label: 'All Upgrades' },
    { id: 'office' as const, label: 'Office Real Estate' },
    { id: 'hardware' as const, label: 'Hardware & Rig' },
    { id: 'perk' as const, label: 'Culture & Perks' },
    { id: 'marketing' as const, label: 'Marketing Hype' }
  ];

  const filteredUpgrades = activeCategory === 'all'
    ? upgrades
    : upgrades.filter((u) => u.category === activeCategory);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building': return <Building className="w-5 h-5 text-cyan-400" />;
      case 'Briefcase': return <Briefcase className="w-5 h-5 text-cyan-400" />;
      case 'Landmark': return <Landmark className="w-5 h-5 text-cyan-400" />;
      case 'Building2': return <Building2 className="w-5 h-5 text-cyan-400" />;
      case 'Keyboard': return <Keyboard className="w-5 h-5 text-emerald-400" />;
      case 'Monitor': return <Monitor className="w-5 h-5 text-indigo-400" />;
      case 'Server': return <Server className="w-5 h-5 text-purple-400" />;
      case 'Cpu': return <Cpu className="w-5 h-5 text-amber-400" />;
      case 'Coffee': return <Coffee className="w-5 h-5 text-amber-500" />;
      case 'Gamepad2': return <Gamepad2 className="w-5 h-5 text-rose-400" />;
      case 'Share2': return <Share2 className="w-5 h-5 text-teal-400" />;
      case 'Tv': return <Tv className="w-5 h-5 text-red-400" />;
      default: return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  const formatMoney = (amount: number) => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}k`;
    return `$${Math.floor(amount).toLocaleString()}`;
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>Studio Upgrades & Expansions</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Expand office desk capacity, upgrade coding gear, and boost studio revenue multipliers.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upgrades Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredUpgrades.map((upgrade) => {
          const canAfford = cash >= upgrade.cost;

          return (
            <div
              key={upgrade.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                upgrade.purchased
                  ? 'bg-slate-950/40 border-emerald-900/40 opacity-75'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      {getIcon(upgrade.iconName)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs sm:text-sm">{upgrade.name}</h4>
                      <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
                        {upgrade.category}
                      </span>
                    </div>
                  </div>

                  {upgrade.purchased ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>OWNED</span>
                    </span>
                  ) : (
                    <span className="font-mono font-bold text-xs text-amber-400">
                      {formatMoney(upgrade.cost)}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                  {upgrade.description}
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => onPurchaseUpgrade(upgrade.id)}
                  disabled={upgrade.purchased || !canAfford}
                  className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md ${
                    upgrade.purchased
                      ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                      : canAfford
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer active:scale-95'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>
                    {upgrade.purchased
                      ? 'Installed'
                      : canAfford
                      ? `Purchase (${formatMoney(upgrade.cost)})`
                      : `Need ${formatMoney(upgrade.cost)}`}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
