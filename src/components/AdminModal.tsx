import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  DollarSign, 
  TrendingUp, 
  RotateCcw, 
  Ban, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Megaphone, 
  Edit3, 
  RefreshCw,
  Award,
  Gamepad2,
  Lock,
  Unlock
} from 'lucide-react';
import { 
  adminFetchAllPlayers, 
  adminUpdatePlayerValues, 
  adminSetPlayerBan, 
  adminResetLeaderboard, 
  adminBroadcastAnnouncement,
  AdminPlayerRecord
} from '../firebase';
import { soundManager } from '../utils/audio';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  currentAdminEmail?: string;
  onRefreshLeaderboard?: () => void;
  onApplyGameStatePatch?: (patch: any) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentAdminEmail,
  onRefreshLeaderboard,
  onApplyGameStatePatch
}) => {
  const [activeTab, setActiveTab] = useState<'players' | 'leaderboard' | 'broadcast'>('players');
  const [players, setPlayers] = useState<AdminPlayerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Value modification modal/panel
  const [selectedPlayer, setSelectedPlayer] = useState<AdminPlayerRecord | null>(null);
  const [editCash, setEditCash] = useState<number>(0);
  const [editNetWorth, setEditNetWorth] = useState<number>(0);
  const [editFollowers, setEditFollowers] = useState<number>(0);
  const [editGamesCount, setEditGamesCount] = useState<number>(0);
  const [editStudioName, setEditStudioName] = useState<string>('');

  // Ban management
  const [banReasonInput, setBanReasonInput] = useState('Terms of Service & Code of Conduct violation');

  // Global broadcast
  const [broadcastText, setBroadcastText] = useState('');
  
  // Feedback
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPlayers();
    }
  }, [isOpen]);

  const loadPlayers = async () => {
    setIsLoading(true);
    try {
      const records = await adminFetchAllPlayers();
      setPlayers(records);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Failed to load players: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleOpenEdit = (player: AdminPlayerRecord) => {
    setSelectedPlayer(player);
    setEditCash(player.cash);
    setEditNetWorth(player.netWorth);
    setEditFollowers(player.followers);
    setEditGamesCount(player.gamesCount);
    setEditStudioName(player.studioName);
    setStatusMessage(null);
  };

  const handleSaveValues = async () => {
    if (!selectedPlayer) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      await adminUpdatePlayerValues(selectedPlayer.id, {
        cash: editCash,
        netWorth: editNetWorth,
        followers: editFollowers,
        gamesCount: editGamesCount,
        studioName: editStudioName
      });
      soundManager.playCashSound();
      if (onApplyGameStatePatch && (currentUser?.userId === selectedPlayer.id || currentUser?.uid === selectedPlayer.id)) {
        onApplyGameStatePatch({
          cash: editCash,
          followers: editFollowers
        });
      }
      setStatusMessage({ type: 'success', text: `Updated values for ${editStudioName || selectedPlayer.id}!` });
      setSelectedPlayer(null);
      await loadPlayers();
      if (onRefreshLeaderboard) onRefreshLeaderboard();
    } catch (err: any) {
      soundManager.playError();
      setStatusMessage({ type: 'error', text: 'Failed to update values: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBan = async (player: AdminPlayerRecord) => {
    setIsLoading(true);
    setStatusMessage(null);
    const newBannedState = !player.isBanned;
    try {
      await adminSetPlayerBan(player.id, newBannedState, banReasonInput);
      soundManager.playGavel();
      setStatusMessage({
        type: 'success',
        text: newBannedState
          ? `Banned account "${player.studioName}"!`
          : `Restored account "${player.studioName}"!`
      });
      await loadPlayers();
      if (onRefreshLeaderboard) onRefreshLeaderboard();
    } catch (err: any) {
      soundManager.playError();
      setStatusMessage({ type: 'error', text: 'Failed to update ban status: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaderboardReset = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      await adminResetLeaderboard();
      soundManager.playGavel();
      setStatusMessage({ type: 'success', text: 'Global leaderboards successfully reset!' });
      setIsConfirmingReset(false);
      await loadPlayers();
      if (onRefreshLeaderboard) onRefreshLeaderboard();
    } catch (err: any) {
      soundManager.playError();
      setStatusMessage({ type: 'error', text: 'Reset failed: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      await adminBroadcastAnnouncement(broadcastText.trim());
      soundManager.playSuccess();
      setStatusMessage({ type: 'success', text: 'Executive announcement broadcast to all online players!' });
      setBroadcastText('');
    } catch (err: any) {
      soundManager.playError();
      setStatusMessage({ type: 'error', text: 'Failed to send broadcast: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPlayers = players.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.studioName.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.email && p.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#090b10] border border-amber-500/50 rounded-2xl shadow-2xl shadow-amber-950/70 flex flex-col max-h-[92vh] overflow-hidden text-slate-100 font-sans">
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  EXECUTIVE ADMINISTRATOR CONSOLE
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ROOT ACCESS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Authorized Admin: <strong className="text-amber-300">{currentAdminEmail || 'daleobeirned@gmail.com'}</strong> • Live database authority
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-[#06080d] flex gap-2">
          <button
            onClick={() => { setActiveTab('players'); setSelectedPlayer(null); }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'players'
                ? 'bg-slate-900 text-amber-300 border-amber-500/50 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>PLAYER ACCOUNTS & VALUES ({players.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('leaderboard'); setSelectedPlayer(null); }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'leaderboard'
                ? 'bg-slate-900 text-amber-300 border-amber-500/50 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>LEADERBOARD RESET</span>
          </button>

          <button
            onClick={() => { setActiveTab('broadcast'); setSelectedPlayer(null); }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'broadcast'
                ? 'bg-slate-900 text-amber-300 border-amber-500/50 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>SYSTEM BROADCAST</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div className={`mx-5 mt-3 p-3 rounded-xl border text-xs flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/80 border-red-500/40 text-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'players' && (
            <div className="space-y-4">
              {/* Search & Actions bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Studio, Email, or ID..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-white"
                  />
                </div>

                <button
                  onClick={loadPlayers}
                  disabled={isLoading}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 font-bold flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Registry</span>
                </button>
              </div>

              {/* Value Modifier Drawer if player selected */}
              {selectedPlayer && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 to-slate-900 border-2 border-amber-500/50 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-bold text-white">
                        Modify Corporate Values: <span className="text-amber-300">{selectedPlayer.studioName}</span>
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">({selectedPlayer.id})</span>
                    </div>
                    <button
                      onClick={() => setSelectedPlayer(null)}
                      className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Studio Name
                      </label>
                      <input
                        type="text"
                        value={editStudioName}
                        onChange={(e) => setEditStudioName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Liquid Cash ($)
                      </label>
                      <input
                        type="number"
                        value={editCash}
                        onChange={(e) => setEditCash(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-emerald-400 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Net Worth ($)
                      </label>
                      <input
                        type="number"
                        value={editNetWorth}
                        onChange={(e) => setEditNetWorth(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-amber-300 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Followers
                      </label>
                      <input
                        type="number"
                        value={editFollowers}
                        onChange={(e) => setEditFollowers(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-purple-300 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Games Released
                      </label>
                      <input
                        type="number"
                        value={editGamesCount}
                        onChange={(e) => setEditGamesCount(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-cyan-300 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setSelectedPlayer(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveValues}
                      disabled={isLoading}
                      className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950 shadow-md cursor-pointer transition-all disabled:opacity-50"
                    >
                      Save Override
                    </button>
                  </div>
                </div>
              )}

              {/* Player Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-mono uppercase text-[10px]">
                      <th className="p-3">Studio & Account</th>
                      <th className="p-3">Cash</th>
                      <th className="p-3">Net Worth</th>
                      <th className="p-3">Followers</th>
                      <th className="p-3">Titles</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500 font-mono">
                          No players found matching current query.
                        </td>
                      </tr>
                    ) : (
                      filteredPlayers.map((player) => (
                        <tr
                          key={player.id}
                          className={`hover:bg-slate-900/50 transition-colors ${
                            player.isBanned ? 'bg-red-950/20' : ''
                          }`}
                        >
                          <td className="p-3">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{player.studioName}</span>
                              {player.role === 'admin' && (
                                <span className="px-1 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {player.id} {player.email ? `• ${player.email}` : ''}
                            </div>
                          </td>
                          <td className="p-3 font-mono text-emerald-400 font-bold">
                            ${player.cash.toLocaleString()}
                          </td>
                          <td className="p-3 font-mono text-amber-300 font-bold">
                            ${player.netWorth.toLocaleString()}
                          </td>
                          <td className="p-3 font-mono text-purple-300">
                            {player.followers.toLocaleString()}
                          </td>
                          <td className="p-3 font-mono text-cyan-300">
                            {player.gamesCount}
                          </td>
                          <td className="p-3">
                            {player.isBanned ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800 flex items-center gap-1 w-fit">
                                <Lock className="w-3 h-3" />
                                BANNED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                ACTIVE
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(player)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                                title="Edit Cash, Net Worth, Followers"
                              >
                                <Edit3 className="w-3 h-3 text-amber-400" />
                                <span>Edit Values</span>
                              </button>

                              <button
                                onClick={() => handleToggleBan(player)}
                                className={`px-2 py-1 rounded border text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                  player.isBanned
                                    ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-600 text-emerald-300'
                                    : 'bg-red-950/80 hover:bg-red-900 border-red-600 text-red-300'
                                }`}
                                title={player.isBanned ? 'Unban Account' : 'Ban Account'}
                              >
                                {player.isBanned ? (
                                  <>
                                    <Unlock className="w-3 h-3" />
                                    <span>Unban</span>
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-3 h-3" />
                                    <span>Ban</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="max-w-2xl mx-auto space-y-6 py-4">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-red-500/40 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Reset Global Studios Leaderboard</h3>
                    <p className="text-xs text-slate-400">
                      Season wipe: Resets all studios to baseline startup valuation ($5,000 cash, 0 followers).
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  This action performs a batch update across the entire public <code>studios</code> collection in Firestore. It immediately levels the playing field for all publishers and announces a new season ticker event to active players.
                </p>

                {isConfirmingReset ? (
                  <div className="p-4 rounded-xl bg-red-950/90 border border-red-500 space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2 text-xs font-bold text-red-200">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>ARE YOU ABSOLUTELY SURE? THIS ACTION IS PERMANENT.</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleLeaderboardReset}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg cursor-pointer transition-all disabled:opacity-50"
                      >
                        {isLoading ? 'Resetting Leaderboard...' : 'YES, WIPE & RESET LEADERBOARDS'}
                      </button>
                      <button
                        onClick={() => setIsConfirmingReset(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsConfirmingReset(true)}
                    className="py-3 px-5 rounded-xl font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 shadow-lg shadow-red-950/60 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>INITIATE LEADERBOARD SEASON RESET</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'broadcast' && (
            <div className="max-w-2xl mx-auto space-y-4 py-4">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/40 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Broadcast Global System Announcement</h3>
                    <p className="text-xs text-slate-400">
                      Dispatches high-priority red/gold notice to all online studios in the live multiplayer lobby.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSendBroadcast} className="space-y-3">
                  <textarea
                    rows={4}
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="Enter urgent announcement or server notice to broadcast to all publishers..."
                    maxLength={280}
                    required
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-white resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {broadcastText.length}/280 characters
                    </span>
                    <button
                      type="submit"
                      disabled={isLoading || !broadcastText.trim()}
                      className="py-2.5 px-5 rounded-xl font-bold text-xs tracking-wider uppercase text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-950/60 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Megaphone className="w-4 h-4" />
                      <span>BROADCAST TO ALL PLAYERS</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
