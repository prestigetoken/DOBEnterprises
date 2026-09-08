import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Users, 
  Trophy, 
  X, 
  Send, 
  Scale, 
  AlertTriangle, 
  Check, 
  Copy, 
  Play, 
  Sparkles, 
  ArrowRight, 
  ShieldAlert, 
  MessageSquare,
  Flame,
  Radio,
  RefreshCw,
  Clock,
  User,
  UserPlus,
  UserCheck,
  UserX,
  Gift,
  ShieldCheck,
  Search,
  CheckCircle2
} from 'lucide-react';
import { 
  getOrCreatePlayerId,
  subscribeToLeaderboard,
  subscribeToGlobalChat,
  sendGlobalChatMessage,
  subscribeToMyLawsuits,
  servePvPLawsuit,
  updateLawsuitStatus,
  createPrivateRoom,
  joinPrivateRoom,
  subscribeToRoom,
  subscribeToRoomMembers,
  updateRoomMemberTelemetry,
  toggleRoomReady,
  startRoomMatch,
  leaveRoom,
  OnlineStudio,
  LiveChatMessage,
  PvPLawsuitData,
  LobbyRoom,
  RoomParticipant,
  UserAccount,
  FriendRequestData,
  FriendItem,
  sendFriendRequest,
  subscribeToIncomingFriendRequests,
  respondToFriendRequest,
  subscribeToFriends,
  removeFriend,
  isUserAdmin
} from '../firebase';
import { soundManager } from '../utils/audio';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  myStudioName: string;
  cash: number;
  netWorth: number;
  followers: number;
  releasedGamesCount: number;
  onDeductCash: (amount: number) => void;
  onAddCash: (amount: number) => void;
  currentUser?: UserAccount | null;
  onOpenAccount?: () => void;
  onOpenAdmin?: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  myStudioName,
  cash,
  netWorth,
  followers,
  releasedGamesCount,
  onDeductCash,
  onAddCash,
  currentUser,
  onOpenAccount,
  onOpenAdmin
}) => {
  const [activeTab, setActiveTab] = useState<'global' | 'friends' | 'social'>('global');
  const myPlayerId = getOrCreatePlayerId();

  // Friend Requests & Friends List state
  const [friendRequests, setFriendRequests] = useState<FriendRequestData[]>([]);
  const [friendsList, setFriendsList] = useState<FriendItem[]>([]);
  const [friendTargetInput, setFriendTargetInput] = useState('');
  const [friendActionStatus, setFriendActionStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSendingFriendReq, setIsSendingFriendReq] = useState(false);

  // Global Lobby State
  const [leaderboard, setLeaderboard] = useState<OnlineStudio[]>([]);
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [myLawsuits, setMyLawsuits] = useState<PvPLawsuitData[]>([]);

  // Lawsuit Filing Submodal
  const [suingTarget, setSuingTarget] = useState<OnlineStudio | null>(null);
  const [lawsuitGameTitle, setLawsuitGameTitle] = useState('Cyber Theft 2077');
  const [lawsuitClaimAmount, setLawsuitClaimAmount] = useState<number>(50000);
  const [isFilingLawsuit, setIsFilingLawsuit] = useState(false);

  // Private Friends Room State
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<LobbyRoom | null>(null);
  const [roomMembers, setRoomMembers] = useState<RoomParticipant[]>([]);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [roomChallengeGoal, setRoomChallengeGoal] = useState<'first_million' | 'five_games' | 'first_ten_million'>('first_million');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // Subscribe to real-time Firebase listeners
  useEffect(() => {
    if (!isOpen) return;

    const unsubLeaderboard = subscribeToLeaderboard((studios) => {
      setLeaderboard(studios);
    });

    const unsubChat = subscribeToGlobalChat((messages) => {
      setChatMessages(messages);
    });

    const unsubLawsuits = subscribeToMyLawsuits(myPlayerId, (suits) => {
      setMyLawsuits(suits);
    });

    const unsubFriendReqs = subscribeToIncomingFriendRequests(myPlayerId, (reqs) => {
      setFriendRequests(reqs);
    });

    const unsubFriends = subscribeToFriends(myPlayerId, (friends) => {
      setFriendsList(friends);
    });

    return () => {
      unsubLeaderboard();
      unsubChat();
      unsubLawsuits();
      unsubFriendReqs();
      unsubFriends();
    };
  }, [isOpen, myPlayerId]);

  // Subscribe to private room when active
  useEffect(() => {
    if (!currentRoomCode) return;

    const unsubRoom = subscribeToRoom(currentRoomCode, (room) => {
      setRoomData(room);
    });

    const unsubMembers = subscribeToRoomMembers(currentRoomCode, (members) => {
      setRoomMembers(members);
    });

    return () => {
      unsubRoom();
      unsubMembers();
    };
  }, [currentRoomCode]);

  // Real-time progress synchronization for private room
  useEffect(() => {
    if (!currentRoomCode || !roomData) return;
    updateRoomMemberTelemetry(
      currentRoomCode,
      myPlayerId,
      cash,
      netWorth,
      releasedGamesCount,
      roomData.targetGoal
    );
  }, [currentRoomCode, roomData?.targetGoal, cash, netWorth, releasedGamesCount, myPlayerId]);

  if (!isOpen) return null;

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    soundManager.playKeyClick();
    const text = chatInput.trim();
    setChatInput('');
    await sendGlobalChatMessage(myPlayerId, myStudioName, text, 'chat');
  };

  const handleFileLawsuit = async () => {
    if (!suingTarget) return;
    setIsFilingLawsuit(true);
    soundManager.playGavel();
    await servePvPLawsuit(
      myPlayerId,
      myStudioName,
      suingTarget.studioId,
      suingTarget.name,
      lawsuitGameTitle,
      lawsuitClaimAmount
    );
    setIsFilingLawsuit(false);
    setSuingTarget(null);
  };

  const handleSettleLawsuit = async (suit: PvPLawsuitData) => {
    if (cash < suit.claimAmount) {
      alert(`Insufficient liquidity to settle! You need $${suit.claimAmount.toLocaleString()} but only have $${cash.toLocaleString()}`);
      return;
    }
    soundManager.playCashChime();
    onDeductCash(suit.claimAmount);
    await updateLawsuitStatus(
      suit.lawsuitId,
      'settled',
      `🤝 SETTLED LAWSUIT: ${suit.defendantName} settled $${suit.claimAmount.toLocaleString()} damages with ${suit.plaintiffName}!`
    );
  };

  const handleCountersue = async (suit: PvPLawsuitData) => {
    soundManager.playGavel();
    await updateLawsuitStatus(
      suit.lawsuitId,
      'countersued',
      `⚔️ COUNTER-SUED: ${suit.defendantName} counter-sued ${suit.plaintiffName} for frivolous prosecution!`
    );
  };

  const handleCreateRoom = async () => {
    setIsCreatingRoom(true);
    soundManager.playKeyClick();
    const code = await createPrivateRoom(
      myPlayerId,
      myStudioName,
      `${myStudioName}'s Sprint Arena`,
      roomChallengeGoal
    );
    setCurrentRoomCode(code);
    setIsCreatingRoom(false);
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    if (!joinCodeInput.trim()) return;
    soundManager.playKeyClick();
    const joined = await joinPrivateRoom(joinCodeInput.trim(), myPlayerId, myStudioName);
    if (joined) {
      setCurrentRoomCode(joined.roomId);
    } else {
      setJoinError(`Room "${joinCodeInput.toUpperCase().trim()}" not found. Verify room code.`);
    }
  };

  const handleLeaveRoom = async () => {
    if (currentRoomCode) {
      await leaveRoom(currentRoomCode, myPlayerId);
      setCurrentRoomCode(null);
      setRoomData(null);
      setRoomMembers([]);
    }
  };

  const handleCopyRoomCode = () => {
    if (currentRoomCode) {
      navigator.clipboard.writeText(currentRoomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Friend Handlers
  const handleSendFriendRequest = async (targetQuery: string) => {
    if (!targetQuery.trim()) return;
    setIsSendingFriendReq(true);
    setFriendActionStatus(null);
    try {
      const res = await sendFriendRequest(myPlayerId, myStudioName, targetQuery.trim());
      if (res.success) {
        soundManager.playSuccess();
        setFriendActionStatus({ type: 'success', text: res.message });
        setFriendTargetInput('');
      } else {
        soundManager.playError();
        setFriendActionStatus({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      soundManager.playError();
      setFriendActionStatus({ type: 'error', text: err.message || 'Failed to send request' });
    } finally {
      setIsSendingFriendReq(false);
    }
  };

  const handleRespondFriendRequest = async (req: FriendRequestData, accept: boolean) => {
    try {
      await respondToFriendRequest(
        req.requestId,
        accept,
        req.senderId,
        req.senderStudioName,
        req.receiverId,
        req.receiverStudioName
      );
      if (accept) {
        soundManager.playCashSound();
        setFriendActionStatus({ type: 'success', text: `Accepted friend request from "${req.senderStudioName}"!` });
      } else {
        soundManager.playKeyClick();
        setFriendActionStatus({ type: 'success', text: `Declined request from "${req.senderStudioName}".` });
      }
    } catch (err: any) {
      setFriendActionStatus({ type: 'error', text: 'Error responding to friend request: ' + err.message });
    }
  };

  const handleRemoveFriend = async (friend: FriendItem) => {
    try {
      await removeFriend(myPlayerId, friend.friendId);
      soundManager.playKeyClick();
      setFriendActionStatus({ type: 'success', text: `Removed "${friend.studioName}" from friends.` });
    } catch (err: any) {
      setFriendActionStatus({ type: 'error', text: 'Error removing friend: ' + err.message });
    }
  };

  const handleGiftFriend = async (friend: FriendItem) => {
    const giftAmount = 5000;
    if (cash < giftAmount) {
      setFriendActionStatus({ type: 'error', text: `You need at least $${giftAmount.toLocaleString()} to wire a gift package.` });
      return;
    }
    onDeductCash(giftAmount);
    soundManager.playCashSound();
    await sendGlobalChatMessage(
      myPlayerId,
      myStudioName,
      `🎁 Wired a $${giftAmount.toLocaleString()} corporate endowment to friendly studio: ${friend.studioName}!`,
      'chat'
    );
    setFriendActionStatus({ type: 'success', text: `Gift package of $${giftAmount.toLocaleString()} wired to ${friend.studioName}!` });
  };

  const isHost = roomData?.hostId === myPlayerId;
  const myParticipant = roomMembers.find(m => m.memberId === myPlayerId);
  const userIsAdmin = isUserAdmin(currentUser?.email, currentUser?.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#090d16] border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/60 flex flex-col max-h-[92vh] overflow-hidden text-slate-100 font-sans">
        
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  REAL-TIME MULTIPLAYER HUB
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE FIREBASE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Studio: <strong className="text-cyan-300">{myStudioName}</strong> • Real players connected online
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAccount && (
              <button
                onClick={onOpenAccount}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                title="Account Authentication & Cloud Save"
              >
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="max-w-[130px] truncate">{currentUser?.email ? currentUser.email : 'Sign In / Account'}</span>
              </button>
            )}

            {userIsAdmin && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-xs text-amber-300 font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-950/40"
                title="Open Executive Admin Console"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-[#070b13] flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setActiveTab('global')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'global'
                ? 'bg-slate-900 text-cyan-400 border-cyan-500/50 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>GLOBAL LOBBY & PvP</span>
            {leaderboard.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">
                {leaderboard.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'friends'
                ? 'bg-slate-900 text-amber-400 border-amber-500/50 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>CHALLENGE ROOMS</span>
            {currentRoomCode && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">
                IN ROOM
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('social')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'social'
                ? 'bg-slate-900 text-purple-400 border-purple-500/50 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>FRIENDS & REQUESTS</span>
            {friendRequests.length > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-600 text-white animate-bounce">
                {friendRequests.length} PENDING
              </span>
            ) : friendsList.length > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-950 text-purple-300 border border-purple-800">
                {friendsList.length}
              </span>
            ) : null}
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-gradient-to-b from-[#070b13] to-[#04060a]">
          
          {/* ========================================================= */}
          {/* TAB 1: GLOBAL LOBBY & PvP */}
          {/* ========================================================= */}
          {activeTab === 'global' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Column: Live Global Leaderboard (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Incoming Lawsuits Alert Box */}
                {myLawsuits.filter(s => s.status === 'pending').length > 0 && (
                  <div className="p-3.5 rounded-xl bg-rose-950/50 border-2 border-rose-500/70 text-slate-200 shadow-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                        <ShieldAlert className="w-4 h-4 animate-bounce" />
                        <span>INCOMING FEDERAL LAWSUIT SERVED!</span>
                      </div>
                      <span className="text-[10px] bg-rose-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full">
                        ACTION REQUIRED
                      </span>
                    </div>

                    {myLawsuits.filter(s => s.status === 'pending').map((suit) => (
                      <div key={suit.lawsuitId} className="p-2.5 rounded-lg bg-slate-950/80 border border-rose-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div>
                          <div className="font-bold text-white">
                            {suit.plaintiffName} claims copyright infringement
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Game: <span className="text-cyan-300 font-mono">"{suit.gameTitle}"</span> • Damages: <strong className="text-rose-400 font-mono">${suit.claimAmount.toLocaleString()}</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSettleLawsuit(suit)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Settle (${suit.claimAmount.toLocaleString()})
                          </button>
                          <button
                            onClick={() => handleCountersue(suit)}
                            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Counter-Sue
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Leaderboard Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                      Global Tycoon Leaderboard
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {leaderboard.length} Studios Active
                  </span>
                </div>

                {/* Leaderboard Table */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                  <div className="grid grid-cols-12 px-3 py-2 bg-slate-900/90 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-4">Studio</div>
                    <div className="col-span-3 text-right">Net Worth</div>
                    <div className="col-span-2 text-right">Games</div>
                    <div className="col-span-2 text-center">PvP</div>
                  </div>

                  <div className="divide-y divide-slate-900 max-h-80 overflow-y-auto">
                    {leaderboard.map((studio, idx) => {
                      const isMe = studio.studioId === myPlayerId;
                      return (
                        <div 
                          key={studio.studioId}
                          className={`grid grid-cols-12 px-3 py-2.5 text-xs items-center transition-colors ${
                            isMe ? 'bg-cyan-950/40 border-l-2 border-cyan-400' : 'hover:bg-slate-900/50'
                          }`}
                        >
                          <div className="col-span-1 text-center font-mono font-bold">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                          </div>

                          <div className="col-span-4 truncate">
                            <div className="font-bold text-white truncate flex items-center gap-1.5">
                              <span>{studio.name}</span>
                              {isMe && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-900 text-cyan-200 uppercase font-mono">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ${studio.cash.toLocaleString()} liquid
                            </div>
                          </div>

                          <div className="col-span-3 text-right font-mono font-bold text-amber-300">
                            ${studio.netWorth.toLocaleString()}
                          </div>

                          <div className="col-span-2 text-right font-mono text-slate-300">
                            {studio.gamesCount} <span className="text-[10px] text-slate-500">titles</span>
                          </div>

                          <div className="col-span-2 text-center">
                            {!isMe ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleSendFriendRequest(studio.name)}
                                  className="p-1 rounded bg-purple-950/60 hover:bg-purple-900 border border-purple-700/60 text-purple-300 font-bold text-[10px] transition-colors cursor-pointer flex items-center justify-center"
                                  title={`Send friend request to ${studio.name}`}
                                >
                                  <UserPlus className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setSuingTarget(studio)}
                                  className="px-1.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-bold text-[10px] transition-colors cursor-pointer flex items-center justify-center gap-0.5"
                                  title={`File copyright infringement against ${studio.name}`}
                                >
                                  <Scale className="w-3 h-3" />
                                  <span>SUE</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-600 font-mono">-</span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {leaderboard.length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-500 font-mono">
                        Connecting to global leaderboard telemetry...
                      </div>
                    )}
                  </div>
                </div>

                {/* Lawsuit Submodal */}
                {suingTarget && (
                  <div className="p-4 rounded-xl bg-slate-900 border-2 border-rose-500/80 shadow-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase font-mono">
                        <Scale className="w-4 h-4" />
                        <span>FILE PVP COPYRIGHT LAWSUIT</span>
                      </div>
                      <button 
                        onClick={() => setSuingTarget(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-300">
                      Serve federal copyright injunction against <strong className="text-rose-400">{suingTarget.name}</strong> for alleged code and asset theft.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                          Infringed Title
                        </label>
                        <input
                          type="text"
                          value={lawsuitGameTitle}
                          onChange={(e) => setLawsuitGameTitle(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                          Damage Claim (USD)
                        </label>
                        <select
                          value={lawsuitClaimAmount}
                          onChange={(e) => setLawsuitClaimAmount(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                        >
                          <option value={25000}>$25,000 (Misdemeanor)</option>
                          <option value={50000}>$50,000 (Major Infringement)</option>
                          <option value={100000}>$100,000 (Trade Secret Theft)</option>
                          <option value={500000}>$500,000 (Antitrust Monopoly)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        disabled={isFilingLawsuit}
                        onClick={handleFileLawsuit}
                        className="flex-1 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>{isFilingLawsuit ? 'Filing Injunction...' : `Serve Subpoena to ${suingTarget.name}`}</span>
                      </button>
                      <button
                        onClick={() => setSuingTarget(null)}
                        className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Live Global Ticker & Chat (5 cols) */}
              <div className="lg:col-span-5 flex flex-col h-full space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                      Global Broadcast Ticker
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Real-time feed
                  </span>
                </div>

                {/* Chat & Broadcast Messages Container */}
                <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2 overflow-y-auto max-h-[380px] min-h-[300px]">
                  {chatMessages.map((msg) => {
                    const isLawsuit = msg.type === 'lawsuit';
                    const isRelease = msg.type === 'release';
                    const isAnnouncement = msg.type === 'announcement';

                    return (
                      <div 
                        key={msg.id || msg.messageId}
                        className={`p-2 rounded-lg text-xs font-sans ${
                          isLawsuit 
                            ? 'bg-rose-950/40 border border-rose-800/50 text-rose-200'
                            : isRelease 
                            ? 'bg-amber-950/40 border border-amber-800/50 text-amber-200'
                            : isAnnouncement
                            ? 'bg-indigo-950/40 border border-indigo-800/50 text-indigo-200'
                            : 'bg-slate-900/60 border border-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-cyan-400 font-mono text-[11px]">
                            {msg.studioName}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed break-words">
                          {msg.text}
                        </p>
                      </div>
                    );
                  })}

                  {chatMessages.length === 0 && (
                    <div className="text-center py-10 text-xs text-slate-500 font-mono">
                      Broadcasting open. Say hello to online studios!
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Broadcast to all studios..."
                    maxLength={280}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: FRIENDS PRIVATE LOBBY */}
          {/* ========================================================= */}
          {activeTab === 'friends' && (
            <div className="space-y-6">
              
              {!currentRoomCode ? (
                /* Mode A: Not in Room - Create or Join */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Create Private Room Card */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/40 shadow-xl space-y-4">
                    <div className="flex items-center gap-2.5 text-amber-400">
                      <Sparkles className="w-5 h-5" />
                      <h3 className="font-bold text-sm uppercase tracking-wider font-mono">
                        Host Private Sprint Battle
                      </h3>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Generate a private lobby room code and invite friends to compete in a synchronized game development race.
                    </p>

                    <div>
                      <label className="text-xs text-slate-400 font-mono block mb-1.5 font-bold uppercase">
                        Select Victory Condition
                      </label>
                      <div className="space-y-2">
                        <label className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                          roomChallengeGoal === 'first_million' 
                            ? 'bg-amber-950/40 border-amber-500 text-white' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}>
                          <input
                            type="radio"
                            name="challengeGoal"
                            checked={roomChallengeGoal === 'first_million'}
                            onChange={() => setRoomChallengeGoal('first_million')}
                            className="text-amber-500"
                          />
                          <div>
                            <div className="font-bold">First to $1,000,000 Net Worth</div>
                            <div className="text-[10px] text-slate-400">Fast sprint, build hits & hype quickly</div>
                          </div>
                        </label>

                        <label className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                          roomChallengeGoal === 'five_games' 
                            ? 'bg-amber-950/40 border-amber-500 text-white' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}>
                          <input
                            type="radio"
                            name="challengeGoal"
                            checked={roomChallengeGoal === 'five_games'}
                            onChange={() => setRoomChallengeGoal('five_games')}
                            className="text-amber-500"
                          />
                          <div>
                            <div className="font-bold">First to Release 5 Smash Games</div>
                            <div className="text-[10px] text-slate-400">Dev speed sprint, hire developers fast</div>
                          </div>
                        </label>

                        <label className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                          roomChallengeGoal === 'first_ten_million' 
                            ? 'bg-amber-950/40 border-amber-500 text-white' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}>
                          <input
                            type="radio"
                            name="challengeGoal"
                            checked={roomChallengeGoal === 'first_ten_million'}
                            onChange={() => setRoomChallengeGoal('first_ten_million')}
                            className="text-amber-500"
                          />
                          <div>
                            <div className="font-bold">First to $10,000,000 Enterprise</div>
                            <div className="text-[10px] text-slate-400">Full tycoon marathon with office expansions</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={handleCreateRoom}
                      disabled={isCreatingRoom}
                      className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>{isCreatingRoom ? 'Generating Room...' : 'Create Private Room'}</span>
                    </button>
                  </div>

                  {/* Join Room by Code Card */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5 text-cyan-400">
                        <Users className="w-5 h-5" />
                        <h3 className="font-bold text-sm uppercase tracking-wider font-mono">
                          Join Friend's Room
                        </h3>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        Enter the room code shared by your friend (e.g. <span className="font-mono text-cyan-300">DOB-7821</span>) to connect to their race lobby.
                      </p>

                      <form onSubmit={handleJoinRoom} className="space-y-3">
                        <div>
                          <label className="text-xs text-slate-400 font-mono block mb-1.5 font-bold uppercase">
                            Room Code
                          </label>
                          <input
                            type="text"
                            value={joinCodeInput}
                            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                            placeholder="e.g. DOB-1234"
                            maxLength={10}
                            className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono tracking-widest text-center text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        {joinError && (
                          <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono">
                            {joinError}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={!joinCodeInput.trim()}
                          className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-600/20 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <ArrowRight className="w-4 h-4" />
                          <span>Join Room</span>
                        </button>
                      </form>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 font-mono">
                      💡 Tip: Open this game in another browser tab or share the URL with a friend to test real-time multiplayer!
                    </div>
                  </div>

                </div>
              ) : (
                /* Mode B: Inside Room Lobby & Active Race Arena */
                <div className="space-y-5">
                  
                  {/* Room Status Top Bar */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono uppercase">Private Room:</span>
                        <span className="text-base font-extrabold font-mono text-amber-400 tracking-wider">
                          {currentRoomCode}
                        </span>
                        <button
                          onClick={handleCopyRoomCode}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedCode ? 'COPIED!' : 'Copy Code'}</span>
                        </button>
                      </div>

                      <div className="text-xs text-slate-300 mt-1">
                        Goal: <strong className="text-white">
                          {roomData?.targetGoal === 'first_million' ? 'Race to $1,000,000 Net Worth' :
                           roomData?.targetGoal === 'five_games' ? 'Race to Release 5 Games' :
                           'Race to $10,000,000 Enterprise'}
                        </strong> • Host: <span className="text-cyan-300">{roomData?.hostName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                        roomData?.status === 'in_progress' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 animate-pulse'
                          : roomData?.status === 'completed'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                      }`}>
                        {roomData?.status === 'in_progress' ? '⚔️ RACE IN PROGRESS' :
                         roomData?.status === 'completed' ? '🏆 RACE FINISHED' :
                         '⏳ WAITING FOR PLAYERS'}
                      </span>

                      <button
                        onClick={handleLeaveRoom}
                        className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Leave Room
                      </button>
                    </div>
                  </div>

                  {/* Winner Banner if completed */}
                  {roomData?.status === 'completed' && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/60 via-amber-900/40 to-purple-900/60 border-2 border-amber-400 text-center space-y-1 animate-in zoom-in-95 duration-300">
                      <div className="text-2xl">👑</div>
                      <h4 className="text-lg font-extrabold text-amber-300 font-mono tracking-wider">
                        CHAMPION: {roomMembers.find(m => m.progress >= 100)?.studioName || roomData.winnerName || 'Winner'}!
                      </h4>
                      <p className="text-xs text-slate-300">
                        Goal reached! The sprint challenge has completed.
                      </p>
                    </div>
                  )}

                  {/* Competitors Roster & Live Progress Bars */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">
                      Live Race Progress ({roomMembers.length} Studios)
                    </h4>

                    <div className="grid grid-cols-1 gap-3">
                      {roomMembers.map((member) => {
                        const isMe = member.memberId === myPlayerId;
                        return (
                          <div 
                            key={member.memberId}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isMe 
                                ? 'bg-slate-900/90 border-cyan-500/70 shadow-lg' 
                                : 'bg-slate-950/70 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">
                                  {member.studioName}
                                </span>
                                {isMe && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-900 text-cyan-200 uppercase font-mono">
                                    YOU
                                  </span>
                                )}
                                {member.isReady ? (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase font-mono flex items-center gap-1">
                                    <Check className="w-2.5 h-2.5" /> READY
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 uppercase font-mono">
                                    NOT READY
                                  </span>
                                )}
                              </div>

                              <div className="text-right font-mono text-xs text-slate-300">
                                <strong className="text-amber-300">${member.netWorth.toLocaleString()}</strong> net worth • {member.gamesCount} games
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                <span>Race Progress</span>
                                <span className="font-bold text-cyan-300">{member.progress}%</span>
                              </div>
                              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 rounded-full ${
                                    member.progress >= 100 
                                      ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' 
                                      : isMe 
                                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-500' 
                                      : 'bg-gradient-to-r from-amber-500 to-rose-500'
                                  }`}
                                  style={{ width: `${Math.max(2, member.progress)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Host Match Launch Controls */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-slate-300">
                      {roomData?.status === 'waiting' ? (
                        <span>
                          {isHost ? 'As the host, you can launch the race once players are assembled.' : 'Waiting for host to initiate the countdown...'}
                        </span>
                      ) : (
                        <span>
                          Type code, hire talent, and release games to advance your progress bar to 100%!
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {roomData?.status === 'waiting' && myParticipant && (
                        <button
                          onClick={() => toggleRoomReady(currentRoomCode, myPlayerId, !myParticipant.isReady)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer ${
                            myParticipant.isReady 
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {myParticipant.isReady ? '✓ You Are Ready' : 'Click to Ready Up'}
                        </button>
                      )}

                      {isHost && roomData?.status === 'waiting' && (
                        <button
                          onClick={() => startRoomMatch(currentRoomCode)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Start Match</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: FRIENDS & IN-GAME REQUESTS */}
          {/* ========================================================= */}
          {activeTab === 'social' && (
            <div className="space-y-5">
              {/* Feedback status banner */}
              {friendActionStatus && (
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  friendActionStatus.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                    : 'bg-red-950/80 border-red-500/40 text-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {friendActionStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span>{friendActionStatus.text}</span>
                  </div>
                  <button
                    onClick={() => setFriendActionStatus(null)}
                    className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Add Friend Input Box */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-purple-500/40 shadow-xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      SEND IN-GAME FRIEND REQUEST
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Enter the exact Studio Name or Multiplayer Player ID of any game developer
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendFriendRequest(friendTargetInput);
                  }}
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={friendTargetInput}
                      onChange={(e) => setFriendTargetInput(e.target.value)}
                      placeholder="e.g. Acme Interactive or dob_xyz123..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 focus:outline-none text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingFriendReq || !friendTargetInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-950/50 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSendingFriendReq ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    <span>Send Request</span>
                  </button>
                </form>
              </div>

              {/* Grid: Pending Requests & Friends List */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Left: Incoming Pending Requests (5 cols) */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      <span>Incoming Requests</span>
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                      {friendRequests.length}
                    </span>
                  </div>

                  {friendRequests.length === 0 ? (
                    <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center text-xs text-slate-500 font-mono">
                      No incoming friend requests right now.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {friendRequests.map((req) => (
                        <div
                          key={req.requestId}
                          className="p-3.5 rounded-xl bg-slate-900 border border-purple-500/50 shadow-md space-y-2.5 animate-in fade-in"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                <span>{req.senderStudioName}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Sent {new Date(req.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                              PENDING
                            </span>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleRespondFriendRequest(req, true)}
                              className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>
                            <button
                              onClick={() => handleRespondFriendRequest(req, false)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Confirmed Friends Network (7 cols) */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>My Friends Network</span>
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {friendsList.length} Connected
                    </span>
                  </div>

                  {friendsList.length === 0 ? (
                    <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center space-y-2">
                      <Users className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400 font-mono">
                        No friends added yet. Connect with other publishers to form alliances or launch private room sprints!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-96 overflow-y-auto">
                      {friendsList.map((friend) => (
                        <div
                          key={friend.friendId}
                          className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{friend.studioName}</span>
                              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Connected" />
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Partnered {new Date(friend.addedAt).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => {
                                handleGiftFriend(friend);
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-950 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                              title="Wire $5,000 cash grant to friend"
                            >
                              <Gift className="w-3 h-3 text-emerald-400" />
                              <span>Gift $5k</span>
                            </button>

                            <button
                              onClick={() => {
                                setActiveTab('friends');
                              }}
                              className="px-2 py-1 rounded bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/60 text-amber-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                              title="Invite to challenge room"
                            >
                              <Play className="w-3 h-3 text-amber-400" />
                              <span>Challenge</span>
                            </button>

                            <button
                              onClick={() => handleRemoveFriend(friend)}
                              className="p-1 rounded bg-slate-800 hover:bg-red-950/80 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-300 cursor-pointer transition-colors"
                              title="Remove friend"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer Bar */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-900/70 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Multiplayer ID: <strong className="text-slate-300">{myPlayerId.slice(0, 12)}...</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Close Hub
          </button>
        </div>

      </div>
    </div>
  );
};
