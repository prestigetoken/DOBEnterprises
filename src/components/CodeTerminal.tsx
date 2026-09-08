import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, Zap, Flame, DollarSign, PlayCircle, Sparkles } from 'lucide-react';
import { CODE_SNIPPETS } from '../utils/codeSnippets';
import { soundManager } from '../utils/audio';

interface FloatingCash {
  id: number;
  text: string;
  x: number;
  y: number;
}

interface CodeTerminalProps {
  cash: number;
  hasUnlockedGames: boolean;
  baseEarningsPerKeystroke: number;
  typingBonusMultiplier: number;
  activeGameTitle?: string;
  onKeystrokeEarn: (cashAmount: number, locAmount: number) => void;
  onOpenNewGameModal: () => void;
}

export const CodeTerminal: React.FC<CodeTerminalProps> = ({
  cash,
  hasUnlockedGames,
  baseEarningsPerKeystroke,
  typingBonusMultiplier,
  activeGameTitle,
  onKeystrokeEarn,
  onOpenNewGameModal
}) => {
  const [codeLines, setCodeLines] = useState<string[]>([
    "// Welcome to DOB Enterprises",
    "// Press any keys on your keyboard (or click below) to code and earn cash!",
    "function initStartup() {",
    "  const studio = new DOBEnterprises({ target: '$5,000' });",
    "  studio.startCoding();",
    "}"
  ]);

  const [snippetIndex, setSnippetIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [combo, setCombo] = useState(1.0);
  const [keystrokeCount, setKeystrokeCount] = useState(0);
  const [floatingTexts, setFloatingTexts] = useState<FloatingCash[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const lastKeyTimeRef = useRef<number>(Date.now());
  const floatingIdRef = useRef(0);

  // Combo decay timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastKeyTimeRef.current;
      if (elapsed > 1200) {
        setCombo((prev) => Math.max(1.0, +(prev * 0.85).toFixed(1)));
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const triggerTyping = useCallback((clientX?: number, clientY?: number) => {
    const now = Date.now();
    const timeDelta = now - lastKeyTimeRef.current;
    lastKeyTimeRef.current = now;

    // Increase combo when typing rhythmically
    setCombo((prev) => {
      if (timeDelta < 350) {
        return Math.min(4.0, +(prev + 0.1).toFixed(1));
      } else {
        return Math.max(1.0, +(prev - 0.2).toFixed(1));
      }
    });

    // Sound effect
    soundManager.playKeyClick();

    // Advance code lines
    const currentSnippet = CODE_SNIPPETS[snippetIndex % CODE_SNIPPETS.length];
    const nextCharIndex = charIndex + 4; // Reveal 4 characters per keystroke for snappy feeling

    if (nextCharIndex >= currentSnippet.length) {
      setCodeLines((prev) => {
        const next = [...prev, currentSnippet];
        if (next.length > 14) next.shift();
        return next;
      });
      setSnippetIndex((i) => i + 1);
      setCharIndex(0);
    } else {
      setCharIndex(nextCharIndex);
      setCodeLines((prev) => {
        const lines = [...prev];
        const partial = currentSnippet.substring(0, nextCharIndex);
        if (lines.length > 0) {
          lines[lines.length - 1] = partial;
        } else {
          lines.push(partial);
        }
        return lines;
      });
    }

    setKeystrokeCount((c) => c + 1);

    // Calculate cash earned
    const effectiveMultiplier = typingBonusMultiplier * combo;
    const earnedCash = Math.round(baseEarningsPerKeystroke * effectiveMultiplier);
    // Extra LOC for any active game
    const earnedLoc = Math.round(3 * effectiveMultiplier);

    onKeystrokeEarn(earnedCash, earnedLoc);

    // Spawn floating cash particle
    const rect = terminalRef.current?.getBoundingClientRect();
    const x = clientX && rect ? clientX - rect.left : 40 + Math.random() * 200;
    const y = clientY && rect ? clientY - rect.top : 30 + Math.random() * 80;

    const newId = ++floatingIdRef.current;
    setFloatingTexts((prev) => [
      ...prev.slice(-8), // Keep max 8 floating texts
      { id: newId, text: `+$${earnedCash}`, x, y }
    ]);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== newId));
    }, 800);
  }, [baseEarningsPerKeystroke, typingBonusMultiplier, combo, snippetIndex, charIndex, onKeystrokeEarn]);

  // Global window keystroke listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger typing if the user is typing in an actual input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      // Ignore functional modifier keys alone
      if (['Control', 'Shift', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape'].includes(e.key)) {
        return;
      }
      e.preventDefault();
      triggerTyping();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerTyping]);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [codeLines]);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-full">
      {/* Terminal Titlebar */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="text-slate-400 font-mono flex items-center gap-1.5 ml-2 font-medium">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            main.cpp — Game Engine Core
          </span>
        </div>

        <div className="flex items-center gap-3">
          {activeGameTitle ? (
            <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded font-mono text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              Coding: <strong className="text-white">{activeGameTitle}</strong>
            </span>
          ) : (
            <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
              Idle Mode (Keystrokes = Direct Cash)
            </span>
          )}

          <div className="flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px]">
            <Flame className="w-3.5 h-3.5" />
            <span>{combo.toFixed(1)}x COMBO</span>
          </div>
        </div>
      </div>

      {/* Terminal Body & Code Output */}
      <div
        ref={terminalRef}
        onClick={(e) => triggerTyping(e.clientX, e.clientY)}
        className="relative flex-1 p-4 bg-slate-950/80 font-mono-code text-xs md:text-sm text-emerald-400/90 overflow-y-auto cursor-pointer select-none min-h-[160px] md:min-h-[220px]"
      >
        {/* Floating Cash Elements */}
        {floatingTexts.map((item) => (
          <div
            key={item.id}
            style={{ left: `${item.x}px`, top: `${item.y}px` }}
            className="absolute pointer-events-none text-emerald-400 font-extrabold text-sm sm:text-base animate-bounce drop-shadow-[0_2px_8px_rgba(16,185,129,0.7)]"
          >
            {item.text}
          </div>
        ))}

        {codeLines.map((line, idx) => (
          <div key={idx} className="leading-relaxed whitespace-pre-wrap break-all">
            <span className="text-slate-600 mr-3 select-none text-[11px] inline-block w-5 text-right">
              {idx + 1}
            </span>
            <span className={
              line.startsWith('//') ? 'text-slate-500 italic' :
              line.includes('function') || line.includes('const') || line.includes('let') || line.includes('import') ? 'text-cyan-300' :
              line.includes('return') || line.includes('class') ? 'text-purple-300' :
              line.includes('new') ? 'text-amber-300' :
              'text-emerald-400'
            }>
              {line}
            </span>
          </div>
        ))}
        
        {/* Blinking Cursor */}
        <span className="inline-block w-2.5 h-4 ml-1 bg-emerald-400 animate-pulse align-middle"></span>

        {/* Ambient Click Hint Overlay */}
        {keystrokeCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75 pointer-events-none">
            <div className="text-center p-4 rounded-xl border border-cyan-500/30 bg-slate-900/90 shadow-2xl">
              <Zap className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-bounce" />
              <div className="text-base font-bold text-white mb-1">TYPE ON YOUR KEYBOARD TO CODE!</div>
              <div className="text-xs text-slate-300 max-w-xs mx-auto">
                Press any physical keyboard keys rapidly or click/tap anywhere here to generate code, boost cash, and power your studio!
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Interactive Footer & Mobile Tap Button */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 text-xs text-slate-400 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 font-mono">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Yield: <strong className="text-emerald-400 font-bold">${Math.round(baseEarningsPerKeystroke * typingBonusMultiplier * combo)}</strong> / key</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>Keys: <strong className="text-white font-mono">{keystrokeCount}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Big Tap to Code Button for Touch/Mouse */}
          <button
            onClick={(e) => triggerTyping(e.clientX, e.clientY)}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold text-xs tracking-wide shadow-md shadow-emerald-900/40 flex items-center justify-center gap-2 transition-transform cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current text-amber-300" />
            <span>TYPE / TAP TO CODE</span>
          </button>

          {/* Prompt to start game when reaching $5,000 milestone */}
          {cash >= 5000 && (
            <button
              onClick={onOpenNewGameModal}
              className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs tracking-wide shadow-md shadow-indigo-900/40 flex items-center justify-center gap-1.5 transition-all animate-pulse"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Start Game ($5k+)</span>
            </button>
          )}
        </div>
      </div>

      {/* Target $5,000 banner for new players */}
      {!hasUnlockedGames && cash < 5000 && (
        <div className="bg-gradient-to-r from-cyan-950/90 to-indigo-950/90 border-t border-cyan-500/30 px-3 py-2 text-[11px] flex items-center justify-between text-cyan-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>First Objective: Earn <strong>$5,000</strong> to start developing your first game!</span>
          </div>
          <div className="font-mono font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-500/40">
            ${Math.max(0, Math.floor(cash))}/$5,000 ({Math.min(100, Math.floor((cash / 5000) * 100))}%)
          </div>
        </div>
      )}
    </div>
  );
};
