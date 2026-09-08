import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Gamepad2, 
  Users, 
  Scale, 
  Trophy, 
  Sparkles, 
  MessageSquare, 
  Terminal, 
  AlertTriangle,
  Flame,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

import { 
  ActiveGame, 
  ReleasedGame, 
  Talent, 
  CompetitorStudio, 
  StudioUpgrade, 
  Lawsuit, 
  ChatMessage, 
  GameType, 
  GameGenre, 
  GameTheme 
} from './types';

import { 
  PLATFORM_CONFIGS, 
  INITIAL_COMPETITORS, 
  INITIAL_UPGRADES, 
  generateInitialCandidates, 
  generateCandidate 
} from './data/initialData';

import { RANDOM_CHATTERS, RANDOM_CHAT_MESSAGES } from './utils/codeSnippets';
import { soundManager } from './utils/audio';

import { Header } from './components/Header';
import { CodeTerminal } from './components/CodeTerminal';
import { GamesDashboard } from './components/GamesDashboard';
import { TalentManager } from './components/TalentManager';
import { LawsuitCenter } from './components/LawsuitCenter';
import { Leaderboard } from './components/Leaderboard';
import { UpgradesShop } from './components/UpgradesShop';
import { LiveChatTicker } from './components/LiveChatTicker';
import { NewGameModal } from './components/NewGameModal';
import { GameOverModal } from './components/GameOverModal';
import { MainScreen } from './components/MainScreen';
import { MultiplayerModal } from './components/MultiplayerModal';
import { AccountModal } from './components/AccountModal';
import { AdminModal } from './components/AdminModal';
import { 
  getOrCreatePlayerId, 
  syncStudioToLobby, 
  sendGlobalChatMessage,
  UserAccount,
  isUserAdmin,
  subscribeToAuth,
  saveGameToCloud
} from './firebase';

const STORAGE_KEY = 'DOB_ENTERPRISES_SAVE_V1';

export default function App() {
  // Navigation / Screen state
  const [currentScreen, setCurrentScreen] = useState<'main' | 'game'>('main');
  const [isMultiplayerModalOpen, setIsMultiplayerModalOpen] = useState<boolean>(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Studio Profile
  const [studioName, setStudioName] = useState<string>('DOB Enterprises');
  const [cash, setCash] = useState<number>(0); // Starts at $0 as in original Gameinc.io!
  const [followers, setFollowers] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'talent' | 'lawsuits' | 'leaderboard' | 'upgrades'>('pipeline');

  // Game projects
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [releasedGames, setReleasedGames] = useState<ReleasedGame[]>([]);

  // Team & Recruitment
  const [hiredTalent, setHiredTalent] = useState<Talent[]>([]);
  const [candidates, setCandidates] = useState<Talent[]>(() => generateInitialCandidates());

  // Competitors & Leaderboard
  const [competitors, setCompetitors] = useState<CompetitorStudio[]>(INITIAL_COMPETITORS);

  // Upgrades
  const [upgrades, setUpgrades] = useState<StudioUpgrade[]>(INITIAL_UPGRADES);

  // Lawsuits
  const [activeLawsuits, setActiveLawsuits] = useState<Lawsuit[]>([]);
  const [lawsuitHistory, setLawsuitHistory] = useState<Lawsuit[]>([]);

  // Global Chat & Logs
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'sys-1',
      author: 'System',
      text: 'Welcome to DOB Enterprises! Start typing on your keyboard or tap the terminal to code and earn cash.',
      timestamp: Date.now(),
      isSystem: true
    },
    {
      id: 'chat-init-1',
      author: 'ByteLord',
      text: 'reach $5,000 to unlock your first .io game project!',
      timestamp: Date.now() - 15000
    },
    {
      id: 'chat-init-2',
      author: 'xX_GamerPro_Xx',
      text: 'watch your payroll balance or you will go bankrupt fast lol',
      timestamp: Date.now() - 5000
    }
  ]);

  // Modals
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState<boolean>(false);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);

  // Load saved state once
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('GAMEINC_IO_SAVE_V1');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.studioName && data.studioName !== 'BitCrafters .io' && data.studioName !== 'Game Inc.') {
          setStudioName(data.studioName);
        } else {
          setStudioName('DOB Enterprises');
        }
        if (typeof data.cash === 'number') setCash(data.cash);
        if (typeof data.followers === 'number') setFollowers(data.followers);
        if (data.activeGame) setActiveGame(data.activeGame);
        if (Array.isArray(data.releasedGames)) setReleasedGames(data.releasedGames);
        if (Array.isArray(data.hiredTalent)) setHiredTalent(data.hiredTalent);
        if (Array.isArray(data.upgrades)) setUpgrades(data.upgrades);
        if (Array.isArray(data.lawsuitHistory)) setLawsuitHistory(data.lawsuitHistory);
      }
    } catch {
      // LocalStorage error fallback
    }
  }, []);

  // Auto-save local state
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        const stateToSave = {
          studioName,
          cash,
          followers,
          activeGame,
          releasedGames,
          hiredTalent,
          upgrades,
          lawsuitHistory
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      } catch {}
    }, 5000);
    return () => clearInterval(timer);
  }, [studioName, cash, followers, activeGame, releasedGames, hiredTalent, upgrades, lawsuitHistory]);

  // Subscribe to Firebase Authentication
  useEffect(() => {
    const unsub = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Serialize current game state for cloud saving
  const getCurrentGameState = useCallback(() => ({
    studioName,
    cash,
    followers,
    activeGame,
    releasedGames,
    hiredTalent,
    upgrades,
    lawsuitHistory,
    lastSaved: Date.now()
  }), [studioName, cash, followers, activeGame, releasedGames, hiredTalent, upgrades, lawsuitHistory]);

  // Load and apply a state restored from Cloud Save
  const handleApplyCloudSave = useCallback((loadedData: any) => {
    if (!loadedData) return;
    if (loadedData.studioName) setStudioName(loadedData.studioName);
    if (typeof loadedData.cash === 'number') setCash(loadedData.cash);
    if (typeof loadedData.followers === 'number') setFollowers(loadedData.followers);
    if (loadedData.activeGame !== undefined) setActiveGame(loadedData.activeGame);
    if (Array.isArray(loadedData.releasedGames)) setReleasedGames(loadedData.releasedGames);
    if (Array.isArray(loadedData.hiredTalent)) setHiredTalent(loadedData.hiredTalent);
    if (Array.isArray(loadedData.upgrades)) setUpgrades(loadedData.upgrades);
    if (Array.isArray(loadedData.lawsuitHistory)) setLawsuitHistory(loadedData.lawsuitHistory);
    soundManager.playCashChime();
  }, []);

  // Periodic Auto-Cloud Save every 45s if authenticated
  useEffect(() => {
    if (!currentUser?.userId || currentUser.isAnonymous) return;
    const cloudTimer = setInterval(async () => {
      try {
        await saveGameToCloud(currentUser.userId, studioName, getCurrentGameState());
      } catch {}
    }, 45000);
    return () => clearInterval(cloudTimer);
  }, [currentUser, studioName, getCurrentGameState]);

  const isAdmin = isUserAdmin(currentUser?.email, currentUser?.role);

  // Dynamic multipliers from upgrades
  const upgradeMultipliers = useMemo(() => {
    let locMult = 1.0;
    let typingMult = 1.0;
    let salesMult = 1.0;
    let passiveLoc = 0;
    let deskLimit = 2; // Default starting desks in garage

    upgrades.forEach((u) => {
      if (u.purchased) {
        if (u.locMultiplier) locMult *= u.locMultiplier;
        if (u.typingBonusMultiplier) typingMult *= u.typingBonusMultiplier;
        if (u.salesMultiplier) salesMult *= u.salesMultiplier;
        if (u.passiveLocPerSec) passiveLoc += u.passiveLocPerSec;
        if (u.deskLimit && u.deskLimit > deskLimit) deskLimit = u.deskLimit;
      }
    });

    return { locMult, typingMult, salesMult, passiveLoc, deskLimit };
  }, [upgrades]);

  // Dev speed (LOC/s)
  const totalTeamLocPerSec = useMemo(() => {
    const rawTalentLoc = hiredTalent.reduce((acc, t) => acc + t.locPerSec, 0);
    return Math.round(rawTalentLoc * upgradeMultipliers.locMult + upgradeMultipliers.passiveLoc);
  }, [hiredTalent, upgradeMultipliers]);

  // Financial flows
  const incomePerSec = useMemo(() => {
    const raw = releasedGames.reduce((acc, g) => acc + g.revenuePerSec, 0);
    return Math.round(raw * upgradeMultipliers.salesMult);
  }, [releasedGames, upgradeMultipliers.salesMult]);

  const expensesPerSec = useMemo(() => {
    return hiredTalent.reduce((acc, t) => acc + t.wagePerSec, 0);
  }, [hiredTalent]);

  // Net worth calculation
  const netWorth = useMemo(() => {
    const gamesValue = releasedGames.reduce((acc, g) => acc + g.totalEarnings * 0.4, 0);
    const talentValue = hiredTalent.reduce((acc, t) => acc + t.signingBonus * 0.8, 0);
    return Math.max(0, Math.round(cash + gamesValue + talentValue + followers * 10));
  }, [cash, releasedGames, hiredTalent, followers]);

  // Player Rank on Leaderboard
  const playerRank = useMemo(() => {
    const higherStudios = competitors.filter((c) => c.netWorth > netWorth);
    return higherStudios.length + 1;
  }, [competitors, netWorth]);

  // Player studio object for leaderboard
  const playerStudioObj: CompetitorStudio = useMemo(() => ({
    id: 'player-studio',
    name: studioName,
    rank: playerRank,
    netWorth: Math.max(0, netWorth),
    followers,
    topGame: releasedGames[0]?.title || 'Garage Prototype',
    legalDefenseLevel: 3
  }), [studioName, playerRank, netWorth, followers, releasedGames]);

  // Debt credit limit based on office tier
  const maxDebtLimit = useMemo(() => {
    return -1 * (50000 + upgradeMultipliers.deskLimit * 15000);
  }, [upgradeMultipliers.deskLimit]);

  // Main 1-Second Game Tick
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Update Cash Balance from Income and Payroll Expenses
      setCash((prevCash) => {
        const netFlow = incomePerSec - expensesPerSec;
        const newCash = prevCash + netFlow;

        // Check for severe bankruptcy limit
        if (newCash < maxDebtLimit && !isGameOverModalOpen) {
          setIsGameOverModalOpen(true);
          soundManager.playError();
        }

        return newCash;
      });

      // 2. Advance Active Game Development
      if (activeGame) {
        setActiveGame((prev) => {
          if (!prev) return null;
          if (prev.currentLoc >= prev.targetLoc) return prev; // Ready to publish

          const nextLoc = Math.min(prev.targetLoc, prev.currentLoc + totalTeamLocPerSec);
          // Random chance of bugs appearing if dev is happening
          const bugChance = Math.random();
          const nextBugs = bugChance > 0.82 ? prev.bugs + 1 : prev.bugs;

          return {
            ...prev,
            currentLoc: nextLoc,
            bugs: nextBugs
          };
        });
      }

      // 3. Gentle Sales Decay for Released Games over time
      setReleasedGames((prevGames) => {
        if (prevGames.length === 0) return prevGames;
        return prevGames.map((g) => {
          // Increment total earnings
          const currentEarning = g.revenuePerSec * upgradeMultipliers.salesMult;
          // Slowly decay revenue per sec (minimum $2/s)
          const decayedRevenue = Math.max(3, +(g.revenuePerSec * 0.998).toFixed(2));
          return {
            ...g,
            revenuePerSec: decayedRevenue,
            totalEarnings: g.totalEarnings + currentEarning
          };
        });
      });

      // 4. Competitor market fluctuations
      setCompetitors((prev) => {
        return prev.map((c) => {
          const delta = (Math.random() - 0.49) * 0.015;
          const newWorth = Math.round(c.netWorth * (1 + delta));
          return { ...c, netWorth: Math.max(10000, newWorth) };
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [incomePerSec, expensesPerSec, activeGame, totalTeamLocPerSec, maxDebtLimit, isGameOverModalOpen, upgradeMultipliers.salesMult]);

  // Periodic Random Rival Lawsuits & Chat Ticker (every 25-45 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Add random chat message from community
      const chatter = RANDOM_CHATTERS[Math.floor(Math.random() * RANDOM_CHATTERS.length)];
      const msgText = RANDOM_CHAT_MESSAGES[Math.floor(Math.random() * RANDOM_CHAT_MESSAGES.length)];
      setChatMessages((prev) => [
        ...prev.slice(-30),
        {
          id: 'chat-' + Date.now(),
          author: chatter,
          text: msgText,
          timestamp: Date.now()
        }
      ]);

      // 2. Chance of competitor filing a lawsuit against player if player has decent wealth
      if (netWorth > 150000 && activeLawsuits.filter((l) => l.type === 'incoming').length === 0) {
        if (Math.random() > 0.65) {
          const rival = competitors[Math.floor(Math.random() * competitors.length)];
          const lawsuitCost = Math.round(cash * 0.25 + 50000);
          const potentialClaim = Math.round(netWorth * 0.2 + 80000);

          const incoming: Lawsuit = {
            id: 'lawsuit-inc-' + Date.now(),
            type: 'incoming',
            targetStudioName: rival.name,
            claim: 'Alleged Infringement of Proprietary Multiplayer Netcode',
            lawyerTier: 'standard',
            cost: lawsuitCost,
            potentialSettlement: potentialClaim,
            winChance: 50,
            createdAt: Date.now(),
            resolved: false
          };

          setActiveLawsuits((prev) => [...prev, incoming]);
          soundManager.playError();

          setChatMessages((prev) => [
            ...prev,
            {
              id: 'chat-sue-' + Date.now(),
              author: 'Federal Court',
              text: `${rival.name} filed a major lawsuit against ${studioName}!`,
              timestamp: Date.now(),
              type: 'sue'
            }
          ]);
        }
      }
    }, 28000);

    return () => clearInterval(interval);
  }, [netWorth, cash, competitors, activeLawsuits, studioName]);

  // Periodic Firebase multiplayer heartbeat & studio sync
  useEffect(() => {
    const playerId = getOrCreatePlayerId();
    syncStudioToLobby(
      playerId,
      studioName,
      cash,
      netWorth,
      followers,
      releasedGames.length
    );

    const interval = setInterval(() => {
      syncStudioToLobby(
        playerId,
        studioName,
        cash,
        netWorth,
        followers,
        releasedGames.length
      );
    }, 12000);

    return () => clearInterval(interval);
  }, [studioName, cash, netWorth, followers, releasedGames.length]);

  // Keystroke typing handler
  const handleKeystrokeEarn = useCallback((cashAmount: number, locAmount: number) => {
    setCash((prev) => prev + cashAmount);

    // If active game is in progress, manual typing boosts progress directly!
    if (activeGame && activeGame.currentLoc < activeGame.targetLoc) {
      setActiveGame((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentLoc: Math.min(prev.targetLoc, prev.currentLoc + locAmount)
        };
      });
    }
  }, [activeGame]);

  // Start new game project
  const handleStartGame = (title: string, platform: GameType, genre: GameGenre, theme: GameTheme) => {
    const config = PLATFORM_CONFIGS[platform];
    if (cash < config.cost) return;

    setCash((prev) => prev - config.cost);
    soundManager.playCashChime();

    const newProject: ActiveGame = {
      id: 'game-' + Date.now(),
      title,
      platform,
      genre,
      theme,
      targetLoc: config.targetLoc,
      currentLoc: 0,
      bugs: 0,
      hype: 50,
      cost: config.cost,
      startedAt: Date.now()
    };

    setActiveGame(newProject);
    setActiveTab('pipeline');

    setChatMessages((prev) => [
      ...prev,
      {
        id: 'chat-' + Date.now(),
        author: studioName,
        text: `We just started development on "${title}" (${config.name})! 🎮`,
        timestamp: Date.now(),
        isPlayer: true
      }
    ]);
  };

  // Squash bugs in active game
  const handleFixBugs = () => {
    if (!activeGame) return;
    setActiveGame((prev) => {
      if (!prev) return null;
      return { ...prev, bugs: Math.max(0, prev.bugs - 5) };
    });
    soundManager.playKeyClick();
  };

  // Publish active game
  const handlePublishGame = () => {
    if (!activeGame || activeGame.currentLoc < activeGame.targetLoc) return;

    const config = PLATFORM_CONFIGS[activeGame.platform];
    // Calculate review score based on bugs & team quality
    const bugPenalty = Math.min(3.5, activeGame.bugs * 0.35);
    const rawScore = 9.8 - bugPenalty + (Math.random() * 0.8 - 0.4);
    const reviewScore = Math.max(5.0, Math.min(10.0, +rawScore.toFixed(1)));

    // Review quotes
    let quote = 'An innovative breath of fresh air for the gaming scene!';
    if (reviewScore >= 9.0) quote = 'Masterpiece of engineering! Instant viral phenomenon!';
    else if (reviewScore >= 7.5) quote = 'Great mechanics and high replay value. Highly recommended.';
    else quote = 'Fun core loop, though plagued by minor launch day bugs.';

    // Followers gained
    const scoreMultiplier = reviewScore / 7.5;
    const gainedFans = Math.round(config.baseFollowers * scoreMultiplier * (1 + hiredTalent.length * 0.1));

    // Initial launch sales spike
    const initialSales = Math.round(config.cost * 1.8 * scoreMultiplier);
    const startingRevenuePerSec = Math.round(config.baseRevenuePerSec * scoreMultiplier);

    const published: ReleasedGame = {
      id: activeGame.id,
      title: activeGame.title,
      platform: activeGame.platform,
      genre: activeGame.genre,
      theme: activeGame.theme,
      reviewScore,
      criticQuote: quote,
      revenuePerSec: startingRevenuePerSec,
      initialSales,
      totalEarnings: initialSales,
      releasedAt: Date.now(),
      fansGained: gainedFans,
      updatesCount: 0,
      lastUpdateAt: Date.now()
    };

    setReleasedGames((prev) => [published, ...prev]);
    setCash((prev) => prev + initialSales);
    setFollowers((prev) => prev + gainedFans);
    setActiveGame(null);

    // Sound & Confetti celebration
    soundManager.playGameRelease();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    setChatMessages((prev) => [
      ...prev,
      {
        id: 'chat-rel-' + Date.now(),
        author: 'IGN / Metacritic',
        text: `"${published.title}" scores ${reviewScore}/10! "${quote}"`,
        timestamp: Date.now(),
        type: 'release'
      }
    ]);

    // Broadcast to Firebase global ticker
    sendGlobalChatMessage(
      getOrCreatePlayerId(),
      studioName,
      `🚀 RELEASED "${published.title}"! Scored ${reviewScore}/10 and generated $${initialSales.toLocaleString()}!`,
      'release'
    );
  };

  // Push patch to released game
  const handlePushUpdate = (gameId: string) => {
    const cost = 2000;
    if (cash < cost) return;

    setCash((prev) => prev - cost);
    soundManager.playKeyClick();

    setReleasedGames((prev) =>
      prev.map((g) => {
        if (g.id === gameId) {
          return {
            ...g,
            revenuePerSec: +(g.revenuePerSec * 1.4).toFixed(2),
            updatesCount: g.updatesCount + 1,
            lastUpdateAt: Date.now()
          };
        }
        return g;
      })
    );
  };

  // Release DLC for game
  const handleReleaseDlc = (gameId: string) => {
    const cost = 15000;
    if (cash < cost) return;

    setCash((prev) => prev - cost);
    soundManager.playCashChime();

    setReleasedGames((prev) =>
      prev.map((g) => {
        if (g.id === gameId) {
          return {
            ...g,
            revenuePerSec: +(g.revenuePerSec * 2.2).toFixed(2),
            fansGained: g.fansGained + 500,
            updatesCount: g.updatesCount + 1,
            lastUpdateAt: Date.now()
          };
        }
        return g;
      })
    );
  };

  // Hire talent
  const handleHireTalent = (talent: Talent) => {
    if (cash < talent.signingBonus) return;
    if (hiredTalent.length >= upgradeMultipliers.deskLimit) return;

    setCash((prev) => prev - talent.signingBonus);
    soundManager.playCashChime();

    setHiredTalent((prev) => [...prev, talent]);
    setCandidates((prev) => prev.filter((c) => c.id !== talent.id));

    // Replenish with a fresh candidate
    setCandidates((prev) => [...prev, generateCandidate(Math.random() > 0.65)]);

    setChatMessages((prev) => [
      ...prev,
      {
        id: 'chat-hire-' + Date.now(),
        author: studioName,
        text: `Welcomed ${talent.name} (${talent.role}) to our dev squad! 🚀`,
        timestamp: Date.now(),
        isPlayer: true
      }
    ]);
  };

  // Fire talent
  const handleFireTalent = (talentId: string) => {
    const fired = hiredTalent.find((t) => t.id === talentId);
    setHiredTalent((prev) => prev.filter((t) => t.id !== talentId));
    if (fired) {
      soundManager.playError();
    }
  };

  // Reroll recruitment candidates
  const handleRerollCandidates = () => {
    if (cash < 500) return;
    setCash((prev) => prev - 500);
    soundManager.playKeyClick();
    setCandidates(generateInitialCandidates());
  };

  // File lawsuit against competitor studio
  const handleFileLawsuit = (
    targetStudio: CompetitorStudio,
    claim: string,
    lawyerTier: 'cheap' | 'standard' | 'shark'
  ) => {
    const tierCosts = { cheap: 50000, standard: 200000, shark: 650000 };
    const tierBoosts = { cheap: 0, standard: 25, shark: 45 };
    const cost = tierCosts[lawyerTier];

    if (cash < cost) return;
    setCash((prev) => prev - cost);

    const baseChance = 50;
    const defensePenalty = (targetStudio.legalDefenseLevel || 3) * 6;
    const winChance = Math.min(96, Math.max(15, baseChance + tierBoosts[lawyerTier] - defensePenalty));
    const roll = Math.random() * 100;
    const won = roll <= winChance;

    const settlement = Math.round(targetStudio.netWorth * 0.22 + 100000);

    let resultMsg = '';
    let payout = 0;

    if (won) {
      payout = settlement;
      setCash((prev) => prev + settlement);
      setFollowers((prev) => prev + Math.round(targetStudio.followers * 0.08));
      soundManager.playGameRelease();
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });

      resultMsg = `Court ruled in your favor! Awarded full damages of $${settlement.toLocaleString()} against ${targetStudio.name}.`;

      // Diminish competitor net worth
      setCompetitors((prev) =>
        prev.map((c) => (c.id === targetStudio.id ? { ...c, netWorth: Math.max(5000, c.netWorth - settlement) } : c))
      );
    } else {
      payout = Math.round(cost * 0.4);
      setCash((prev) => prev - payout); // Additional court fees
      soundManager.playError();
      resultMsg = `Case dismissed by judge. Ordered to pay $${payout.toLocaleString()} in counter legal fees to ${targetStudio.name}.`;
    }

    const recorded: Lawsuit = {
      id: 'lawsuit-out-' + Date.now(),
      type: 'outgoing',
      targetStudioName: targetStudio.name,
      claim,
      lawyerTier,
      cost,
      potentialSettlement: settlement,
      winChance,
      createdAt: Date.now(),
      resolved: true,
      won,
      resultMessage: resultMsg,
      damagesPaidOrReceived: won ? settlement : payout
    };

    setLawsuitHistory((prev) => [recorded, ...prev]);

    setChatMessages((prev) => [
      ...prev,
      {
        id: 'chat-verdict-' + Date.now(),
        author: 'Federal Court',
        text: `${studioName} vs ${targetStudio.name}: ${won ? 'PLAINTIFF VICTORY!' : 'DEFENSE VERDICT.'} (${resultMsg})`,
        timestamp: Date.now(),
        type: 'sue'
      }
    ]);
  };

  // Resolve incoming rival lawsuit
  const handleResolveIncomingLawsuit = (lawsuitId: string, action: 'settle' | 'fight') => {
    const lawsuit = activeLawsuits.find((l) => l.id === lawsuitId);
    if (!lawsuit) return;

    if (action === 'settle') {
      const settleAmount = Math.round(lawsuit.cost * 0.5);
      setCash((prev) => prev - settleAmount);
      soundManager.playGavel();

      setLawsuitHistory((prev) => [
        {
          ...lawsuit,
          resolved: true,
          won: false,
          resultMessage: `Settled out of court with ${lawsuit.targetStudioName}. Paid $${settleAmount.toLocaleString()}.`,
          damagesPaidOrReceived: settleAmount
        },
        ...prev
      ]);
    } else {
      // Fight in trial
      const defenseCost = lawsuit.cost;
      setCash((prev) => prev - defenseCost);
      const win = Math.random() > 0.45;

      if (win) {
        soundManager.playGameRelease();
        setLawsuitHistory((prev) => [
          {
            ...lawsuit,
            resolved: true,
            won: true,
            resultMessage: `Successfully defended against ${lawsuit.targetStudioName}! Judge dismissed all claims.`,
            damagesPaidOrReceived: 0
          },
          ...prev
        ]);
      } else {
        soundManager.playError();
        const penalty = lawsuit.potentialSettlement;
        setCash((prev) => prev - penalty);
        setLawsuitHistory((prev) => [
          {
            ...lawsuit,
            resolved: true,
            won: false,
            resultMessage: `Lost trial against ${lawsuit.targetStudioName}. Paid $${penalty.toLocaleString()} in damages.`,
            damagesPaidOrReceived: penalty
          },
          ...prev
        ]);
      }
    }

    setActiveLawsuits((prev) => prev.filter((l) => l.id !== lawsuitId));
  };

  // Purchase upgrade
  const handlePurchaseUpgrade = (upgradeId: string) => {
    const target = upgrades.find((u) => u.id === upgradeId);
    if (!target || target.purchased || cash < target.cost) return;

    setCash((prev) => prev - target.cost);
    soundManager.playCashChime();

    setUpgrades((prev) =>
      prev.map((u) => (u.id === upgradeId ? { ...u, purchased: true } : u))
    );
  };

  // Bankruptcy Crisis Options
  const handleAcceptAngelBailout = () => {
    setCash(5000);
    setFollowers((prev) => Math.round(prev * 0.65));
    setIsGameOverModalOpen(false);
  };

  const handleLiquidateStaff = () => {
    setHiredTalent([]);
    setCash(2500);
    setIsGameOverModalOpen(false);
  };

  const handleRestartChapter11 = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCash(5000);
    setFollowers(100);
    setHiredTalent([]);
    setReleasedGames([]);
    setActiveGame(null);
    setUpgrades(INITIAL_UPGRADES);
    setActiveLawsuits([]);
    setLawsuitHistory([]);
    setIsGameOverModalOpen(false);
    setCurrentScreen('main');
  };

  // Full reset game
  const handleResetGame = () => {
    if (window.confirm('Reset DOB Enterprises and start a completely new game studio from scratch?')) {
      handleRestartChapter11();
    }
  };

  // Chat message submit
  const handleSendChatMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: 'chat-user-' + Date.now(),
      author: studioName,
      text,
      timestamp: Date.now(),
      isPlayer: true
    };
    setChatMessages((prev) => [...prev, newMsg]);

    // Bot response after short delay
    setTimeout(() => {
      const bots = ['ByteLord', 'NeonDev', 'GlitchMaster', 'xX_GamerPro_Xx'];
      const bot = bots[Math.floor(Math.random() * bots.length)];
      const botReplies = [
        `gg ${studioName}! keep coding`,
        `nice moves on the leaderboard ${studioName}`,
        `watch out for ValveSoft, they counter-sue hard`,
        `whats your typing combo at right now?`,
        `hire a shader wizard if you can afford it, massive boost`
      ];
      setChatMessages((prev) => [
        ...prev,
        {
          id: 'bot-reply-' + Date.now(),
          author: bot,
          text: botReplies[Math.floor(Math.random() * botReplies.length)],
          timestamp: Date.now()
        }
      ]);
    }, 1800);
  };

  if (currentScreen === 'main') {
    return (
      <>
        <MainScreen
          currentStudioName={studioName}
          cash={cash}
          netWorth={netWorth}
          followers={followers}
          releasedGamesCount={releasedGames.length}
          onEnterGame={(chosenName) => {
            setStudioName(chosenName);
            setCurrentScreen('game');
          }}
          onResetGame={handleRestartChapter11}
          onOpenMultiplayer={() => setIsMultiplayerModalOpen(true)}
          currentUser={currentUser}
          isAdmin={isAdmin}
          onOpenAccount={() => setIsAccountModalOpen(true)}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
        />
        <MultiplayerModal
          isOpen={isMultiplayerModalOpen}
          onClose={() => setIsMultiplayerModalOpen(false)}
          myStudioName={studioName}
          cash={cash}
          netWorth={netWorth}
          followers={followers}
          releasedGamesCount={releasedGames.length}
          onDeductCash={(amount) => setCash((prev) => Math.max(0, prev - amount))}
          onAddCash={(amount) => setCash((prev) => prev + amount)}
          currentUser={currentUser}
          onOpenAccount={() => setIsAccountModalOpen(true)}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
        />
        <AccountModal
          isOpen={isAccountModalOpen}
          onClose={() => setIsAccountModalOpen(false)}
          currentUser={currentUser}
          currentGameState={getCurrentGameState()}
          onLoadGame={handleApplyCloudSave}
          onOpenAdminConsole={() => {
            setIsAccountModalOpen(false);
            setIsAdminModalOpen(true);
          }}
        />
        <AdminModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          currentUser={currentUser}
          onApplyGameStatePatch={(patch) => {
            if (typeof patch.cash === 'number') setCash(patch.cash);
            if (typeof patch.followers === 'number') setFollowers(patch.followers);
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 font-sans pb-8">
      {/* Top Header */}
      <Header
        studioName={studioName}
        onUpdateStudioName={setStudioName}
        cash={cash}
        netWorth={netWorth}
        followers={followers}
        totalLocPerSec={totalTeamLocPerSec}
        incomePerSec={incomePerSec}
        expensesPerSec={expensesPerSec}
        deskLimit={upgradeMultipliers.deskLimit}
        hiredCount={hiredTalent.length}
        onOpenOfficeUpgrades={() => setActiveTab('upgrades')}
        onResetGame={handleResetGame}
        onOpenMainScreen={() => setCurrentScreen('main')}
        onOpenMultiplayer={() => setIsMultiplayerModalOpen(true)}
        currentUser={currentUser}
        isAdmin={isAdmin}
        onOpenAccount={() => setIsAccountModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-4 pt-4 flex-1 flex flex-col gap-4">
        {/* Top Interactive Row: Code Terminal & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Coding Terminal (Signature Gameinc.io Typing Core) */}
          <div className="lg:col-span-8 h-full">
            <CodeTerminal
              cash={cash}
              hasUnlockedGames={releasedGames.length > 0 || !!activeGame || cash >= 5000}
              baseEarningsPerKeystroke={20}
              typingBonusMultiplier={upgradeMultipliers.typingMult}
              activeGameTitle={activeGame?.title}
              onKeystrokeEarn={handleKeystrokeEarn}
              onOpenNewGameModal={() => setIsNewGameModalOpen(true)}
            />
          </div>

          {/* Quick Studio Status / Rank Widget */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Global Standings
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-xs">
                    Rank #{playerRank}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between p-2 rounded bg-slate-950/70 border border-slate-800/80">
                    <span className="text-slate-400">Published Games:</span>
                    <strong className="text-white">{releasedGames.length}</strong>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-950/70 border border-slate-800/80">
                    <span className="text-slate-400">Total Dev Staff:</span>
                    <strong className="text-indigo-300">
                      {hiredTalent.length} / {upgradeMultipliers.deskLimit} Desks
                    </strong>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-950/70 border border-slate-800/80">
                    <span className="text-slate-400">Automated LOC Output:</span>
                    <strong className="text-cyan-400">{totalTeamLocPerSec} LOC/s</strong>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-950/70 border border-slate-800/80">
                    <span className="text-slate-400">Active Fanbase:</span>
                    <strong className="text-purple-300">{followers.toLocaleString()} fans</strong>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setIsNewGameModalOpen(true)}
                  disabled={cash < 5000 && !activeGame}
                  className={`w-full py-2.5 rounded-lg text-xs font-extrabold tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all ${
                    activeGame
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                      : cash >= 5000
                      ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white cursor-pointer active:scale-95'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>
                    {activeGame
                      ? `Developing: ${activeGame.title}`
                      : cash >= 5000
                      ? 'START NEW GAME PROJECT'
                      : 'EARN $5,000 TO UNLOCK GAMES'}
                  </span>
                </button>
              </div>
            </div>

            {/* Quick alert if in debt */}
            {cash < 0 && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-600/60 text-xs text-rose-200 flex items-center gap-2 animate-pulse shadow-lg">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <strong className="text-white block font-mono">DANGER: Negative Cash Flow!</strong>
                  Payroll exceeds earnings. Type code rapidly or lay off staff to avoid bankruptcy!
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pipeline'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/50'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Games & Portfolio</span>
            {activeGame && (
              <span className="w-2 h-2 rounded-full bg-cyan-300 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('talent')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'talent'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Recruit & Team</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono">
              {hiredTalent.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('lawsuits')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'lawsuits'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/50'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Lawsuits & Court</span>
            {activeLawsuits.filter((l) => l.type === 'incoming').length > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-black text-[10px] animate-bounce">
                SUED!
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'leaderboard'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>.io Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab('upgrades')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'upgrades'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-950/50'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Studio Upgrades</span>
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8">
            {activeTab === 'pipeline' && (
              <GamesDashboard
                cash={cash}
                activeGame={activeGame}
                releasedGames={releasedGames}
                totalLocPerSec={totalTeamLocPerSec}
                onOpenNewGameModal={() => setIsNewGameModalOpen(true)}
                onFixBugs={handleFixBugs}
                onPublishGame={handlePublishGame}
                onPushUpdate={handlePushUpdate}
                onReleaseDlc={handleReleaseDlc}
              />
            )}

            {activeTab === 'talent' && (
              <TalentManager
                cash={cash}
                candidates={candidates}
                hiredTalent={hiredTalent}
                deskLimit={upgradeMultipliers.deskLimit}
                onHireTalent={handleHireTalent}
                onFireTalent={handleFireTalent}
                onRerollCandidates={handleRerollCandidates}
                onOpenOfficeUpgrades={() => setActiveTab('upgrades')}
              />
            )}

            {activeTab === 'lawsuits' && (
              <LawsuitCenter
                cash={cash}
                competitors={competitors}
                activeLawsuits={activeLawsuits}
                lawsuitHistory={lawsuitHistory}
                onFileLawsuit={handleFileLawsuit}
                onResolveIncomingLawsuit={handleResolveIncomingLawsuit}
              />
            )}

            {activeTab === 'leaderboard' && (
              <Leaderboard
                playerRank={playerRank}
                playerStudio={playerStudioObj}
                competitors={competitors}
                onSelectStudioToSue={(studioId) => {
                  setActiveTab('lawsuits');
                }}
              />
            )}

            {activeTab === 'upgrades' && (
              <UpgradesShop
                cash={cash}
                upgrades={upgrades}
                onPurchaseUpgrade={handlePurchaseUpgrade}
              />
            )}
          </div>

          {/* Right Column: Live Chat & Global Events Feed */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <LiveChatTicker
              messages={chatMessages}
              playerStudioName={studioName}
              onSendMessage={handleSendChatMessage}
            />

            {/* How to Play / DOB Enterprises Quick Guide */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 text-xs space-y-2 text-slate-300">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-cyan-400">
                <Terminal className="w-3.5 h-3.5" />
                DOB Enterprises Master Guide
              </h3>
              <ul className="space-y-1.5 list-disc list-inside text-[11px] text-slate-400 leading-relaxed">
                <li><strong className="text-slate-200">Type on Keyboard</strong> to code lines and earn cash. Faster typing builds up to a 4.0x combo multiplier!</li>
                <li>Reach <strong className="text-emerald-400">$5,000</strong> to start developing your first video game project.</li>
                <li><strong className="text-slate-200">Hire Programmers</strong> to increase your lines of code per second (LOC/s). Mind their salaries!</li>
                <li>Accumulate <strong className="text-amber-400">$200,000</strong> to file lawsuits against rival studios to plunder their market share.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* New Game Project Creation Modal */}
      <NewGameModal
        isOpen={isNewGameModalOpen}
        cash={cash}
        onClose={() => setIsNewGameModalOpen(false)}
        onStartGame={handleStartGame}
      />

      {/* Insolvency / Bankruptcy Crisis Modal */}
      <GameOverModal
        isOpen={isGameOverModalOpen}
        debtAmount={cash}
        onAcceptAngelBailout={handleAcceptAngelBailout}
        onLiquidateStaff={handleLiquidateStaff}
        onRestartChapter11={handleRestartChapter11}
      />

      {/* Global & Friends Private Multiplayer Hub Modal */}
      <MultiplayerModal
        isOpen={isMultiplayerModalOpen}
        onClose={() => setIsMultiplayerModalOpen(false)}
        myStudioName={studioName}
        cash={cash}
        netWorth={netWorth}
        followers={followers}
        releasedGamesCount={releasedGames.length}
        onDeductCash={(amount) => setCash((prev) => Math.max(0, prev - amount))}
        onAddCash={(amount) => setCash((prev) => prev + amount)}
        currentUser={currentUser}
        onOpenAccount={() => setIsAccountModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
      />

      {/* User Account & Cloud Save Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        currentGameState={getCurrentGameState()}
        onLoadGame={handleApplyCloudSave}
        onOpenAdminConsole={() => {
          setIsAccountModalOpen(false);
          setIsAdminModalOpen(true);
        }}
      />

      {/* Executive Admin Management Console */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={currentUser}
        onApplyGameStatePatch={(patch) => {
          if (typeof patch.cash === 'number') setCash(patch.cash);
          if (typeof patch.followers === 'number') setFollowers(patch.followers);
        }}
      />
    </div>
  );
}
