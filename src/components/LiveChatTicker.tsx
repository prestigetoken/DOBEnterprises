import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Radio, Volume2, Shield } from 'lucide-react';
import { ChatMessage } from '../types';
import { RANDOM_CHATTERS, RANDOM_CHAT_MESSAGES } from '../utils/codeSnippets';

interface LiveChatTickerProps {
  messages: ChatMessage[];
  playerStudioName: string;
  onSendMessage: (text: string) => void;
}

export const LiveChatTicker: React.FC<LiveChatTickerProps> = ({
  messages,
  playerStudioName,
  onSendMessage
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[320px]">
      {/* Header */}
      <div className="bg-slate-950 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-200">Global .io Room Chat & Live Ticker</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Room: <strong className="text-cyan-400">#US-East-1</strong> (Online: 4,821)
        </span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs font-mono">
        {messages.map((msg) => {
          const isMe = msg.isPlayer;

          if (msg.isSystem) {
            return (
              <div
                key={msg.id}
                className="bg-cyan-950/30 border border-cyan-500/20 text-cyan-300 px-2 py-1 rounded text-[11px] flex items-center gap-1.5"
              >
                <Shield className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="font-bold text-cyan-400">[SYSTEM]:</span>
                <span className="truncate">{msg.text}</span>
              </div>
            );
          }

          if (msg.type === 'sue') {
            return (
              <div
                key={msg.id}
                className="bg-amber-950/40 border border-amber-500/30 text-amber-200 px-2 py-1 rounded text-[11px]"
              >
                <strong className="text-amber-400">⚖️ COURT NOTICE:</strong> {msg.text}
              </div>
            );
          }

          if (msg.type === 'release') {
            return (
              <div
                key={msg.id}
                className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 px-2 py-1 rounded text-[11px]"
              >
                <strong className="text-emerald-400">🚀 GAME LAUNCH:</strong> {msg.text}
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-1.5 ${
                isMe ? 'text-emerald-300 font-semibold' : 'text-slate-300'
              }`}
            >
              <span className={`font-bold shrink-0 ${isMe ? 'text-emerald-400' : 'text-indigo-400'}`}>
                {msg.author}:
              </span>
              <span className="text-slate-200 break-words font-sans">{msg.text}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-2 bg-slate-950 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Chat as ${playerStudioName}...`}
          maxLength={100}
          className="flex-1 bg-slate-900 border border-slate-700 text-white text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
