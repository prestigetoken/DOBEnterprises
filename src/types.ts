export type GameType = 'web' | 'mobile' | 'pc' | 'console' | 'aaa' | 'mmo';

export type GameGenre = 
  | 'Action'
  | 'Battle Royale'
  | 'Arcade .io'
  | 'RPG'
  | 'Strategy'
  | 'Simulation'
  | 'Puzzle'
  | 'Horror';

export type GameTheme =
  | 'Cyberpunk'
  | 'Zombies'
  | 'Space Sci-Fi'
  | 'Medieval Fantasy'
  | 'Pixel Roguelike'
  | 'Dungeon Crawler'
  | 'Hacker Cyberwar'
  | 'Cute Animals';

export interface GamePlatformConfig {
  id: GameType;
  name: string;
  cost: number;
  targetLoc: number;
  baseRevenuePerSec: number;
  baseFollowers: number;
  description: string;
}

export interface ActiveGame {
  id: string;
  title: string;
  platform: GameType;
  genre: GameGenre;
  theme: GameTheme;
  targetLoc: number;
  currentLoc: number;
  bugs: number;
  hype: number;
  cost: number;
  startedAt: number;
}

export interface ReleasedGame {
  id: string;
  title: string;
  platform: GameType;
  genre: GameGenre;
  theme: GameTheme;
  reviewScore: number;
  criticQuote: string;
  revenuePerSec: number;
  initialSales: number;
  totalEarnings: number;
  releasedAt: number;
  fansGained: number;
  updatesCount: number;
  lastUpdateAt: number;
}

export interface Talent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  locPerSec: number;
  wagePerSec: number;
  signingBonus: number;
  followerBoostPct: number;
  isMystery?: boolean;
  flavorQuote?: string;
}

export interface CompetitorStudio {
  id: string;
  name: string;
  rank: number;
  netWorth: number;
  followers: number;
  topGame: string;
  isPlayer?: boolean;
  legalDefenseLevel: number; // 1 to 5
}

export interface Lawsuit {
  id: string;
  type: 'outgoing' | 'incoming';
  targetStudioName: string;
  claim: string;
  lawyerTier: 'cheap' | 'standard' | 'shark';
  cost: number;
  potentialSettlement: number;
  winChance: number;
  createdAt: number;
  resolved: boolean;
  won?: boolean;
  resultMessage?: string;
  damagesPaidOrReceived?: number;
}

export interface StudioUpgrade {
  id: string;
  name: string;
  category: 'office' | 'hardware' | 'perk' | 'marketing';
  cost: number;
  description: string;
  purchased: boolean;
  locMultiplier?: number;
  typingBonusMultiplier?: number;
  deskLimit?: number;
  passiveLocPerSec?: number;
  salesMultiplier?: number;
  iconName: string;
}

export interface ChatMessage {
  id: string;
  author: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  isPlayer?: boolean;
  type?: 'chat' | 'sue' | 'release' | 'bankruptcy';
}
