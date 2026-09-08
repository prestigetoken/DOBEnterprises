import React from 'react';
import { AlertOctagon, RefreshCcw, DollarSign, Users, ShieldAlert, HeartHandshake } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  debtAmount: number;
  onAcceptAngelBailout: () => void;
  onLiquidateStaff: () => void;
  onRestartChapter11: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  debtAmount,
  onAcceptAngelBailout,
  onLiquidateStaff,
  onRestartChapter11
}) => {
  if (!isOpen) return null;

  const formatMoney = (amount: number) => {
    const abs = Math.abs(amount);
    return `$${Math.floor(abs).toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="bg-slate-900 border-2 border-rose-600 rounded-2xl max-w-lg w-full shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in duration-200">
        <div className="w-14 h-14 rounded-full bg-rose-600/20 text-rose-500 border border-rose-500/30 flex items-center justify-center mx-auto animate-pulse">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-xl font-black text-white tracking-tight">
            INSOLVENCY & BANKRUPTCY CRISIS!
          </h3>
          <p className="text-xs text-rose-300 mt-1 font-mono font-bold">
            Outstanding Studio Debt: -{formatMoney(debtAmount)}
          </p>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Your studio's payroll and ongoing expenses have exceeded your commercial credit limits. Creditors have locked down operations! Select a resolution:
          </p>
        </div>

        <div className="space-y-2.5 text-left pt-2">
          {/* Option 1: Angel Bailout */}
          <button
            onClick={onAcceptAngelBailout}
            className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 text-left transition-all flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white text-xs sm:text-sm">Venture Capital Bailout</div>
                <div className="text-[11px] text-slate-400">
                  Investor injects capital to clear debt to $5,000 in exchange for 35% of your fans.
                </div>
              </div>
            </div>
          </button>

          {/* Option 2: Liquidate Staff */}
          <button
            onClick={onLiquidateStaff}
            className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-amber-500 text-left transition-all flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white text-xs sm:text-sm">Emergency Staff Liquidation</div>
                <div className="text-[11px] text-slate-400">
                  Lay off high-wage developers immediately and negotiate a $2,500 cash buffer.
                </div>
              </div>
            </div>
          </button>

          {/* Option 3: Chapter 11 Reset */}
          <button
            onClick={onRestartChapter11}
            className="w-full p-3 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/60 text-left transition-all flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <RefreshCcw className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-rose-300 text-xs sm:text-sm">Chapter 11 Full Reorganization</div>
                <div className="text-[11px] text-slate-400">
                  Wipe all liabilities, reset studio, and restart fresh with $5,000 cash.
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
