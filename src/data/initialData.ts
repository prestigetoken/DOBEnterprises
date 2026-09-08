import { GamePlatformConfig, Talent, CompetitorStudio, StudioUpgrade } from '../types';

export const PLATFORM_CONFIGS: Record<string, GamePlatformConfig> = {
  web: {
    id: 'web',
    name: 'Web .io Game',
    cost: 5000,
    targetLoc: 1500,
    baseRevenuePerSec: 35,
    baseFollowers: 250,
    description: 'Fast, lightweight browser game. High viral play rate, low entry cost.'
  },
  mobile: {
    id: 'mobile',
    name: 'Mobile Indie App',
    cost: 25000,
    targetLoc: 8000,
    baseRevenuePerSec: 140,
    baseFollowers: 1200,
    description: 'Freemium mobile hit with in-app purchases and ad monetization.'
  },
  pc: {
    id: 'pc',
    name: 'PC Steam Indie',
    cost: 75000,
    targetLoc: 25000,
    baseRevenuePerSec: 450,
    baseFollowers: 4500,
    description: 'Solid premium desktop release with loyal core gaming fanbase.'
  },
  console: {
    id: 'console',
    name: 'Console Exclusive',
    cost: 250000,
    targetLoc: 75000,
    baseRevenuePerSec: 1400,
    baseFollowers: 16000,
    description: 'High-definition console title with strong launch campaign.'
  },
  aaa: {
    id: 'aaa',
    name: 'AAA Blockbuster',
    cost: 1000000,
    targetLoc: 250000,
    baseRevenuePerSec: 5500,
    baseFollowers: 65000,
    description: 'Cutting-edge graphic marvel with global retail hype.'
  },
  mmo: {
    id: 'mmo',
    name: 'Metaverse MMO .io',
    cost: 3500000,
    targetLoc: 800000,
    baseRevenuePerSec: 18000,
    baseFollowers: 250000,
    description: 'Massive persistent multiplayer ecosystem with subscription revenue.'
  }
};

export const INITIAL_COMPETITORS: CompetitorStudio[] = [
  {
    id: 'comp-1',
    name: 'ValveSoft Inc.',
    rank: 1,
    netWorth: 12500000,
    followers: 850000,
    topGame: 'Counter-Craft: Global',
    legalDefenseLevel: 5
  },
  {
    id: 'comp-2',
    name: 'Riotous Studios',
    rank: 2,
    netWorth: 8200000,
    followers: 620000,
    topGame: 'League of Pixels',
    legalDefenseLevel: 4
  },
  {
    id: 'comp-3',
    name: 'Epic Loot Games',
    rank: 3,
    netWorth: 6400000,
    followers: 490000,
    topGame: 'FortBlock Battle',
    legalDefenseLevel: 4
  },
  {
    id: 'comp-4',
    name: 'Blizz-Art Ent.',
    rank: 4,
    netWorth: 4100000,
    followers: 340000,
    topGame: 'World of Voxelcraft',
    legalDefenseLevel: 3
  },
  {
    id: 'comp-5',
    name: 'EA Greedworks',
    rank: 5,
    netWorth: 2800000,
    followers: 210000,
    topGame: 'Ultimate Team 26',
    legalDefenseLevel: 4
  },
  {
    id: 'comp-6',
    name: 'Nintendoom Corp.',
    rank: 6,
    netWorth: 1950000,
    followers: 180000,
    topGame: 'Super Plumber Bros',
    legalDefenseLevel: 5
  },
  {
    id: 'comp-7',
    name: 'Mojangster Labs',
    rank: 7,
    netWorth: 1100000,
    followers: 120000,
    topGame: 'Mine & Craft',
    legalDefenseLevel: 3
  },
  {
    id: 'comp-8',
    name: 'Supercellar Tech',
    rank: 8,
    netWorth: 650000,
    followers: 85000,
    topGame: 'Clash of Castles',
    legalDefenseLevel: 2
  },
  {
    id: 'comp-9',
    name: 'ByteDancer .io',
    rank: 9,
    netWorth: 320000,
    followers: 45000,
    topGame: 'Slither Snake .io',
    legalDefenseLevel: 2
  },
  {
    id: 'comp-10',
    name: 'Indie Garage Dev',
    rank: 10,
    netWorth: 45000,
    followers: 5500,
    topGame: 'Flappy Clone 2D',
    legalDefenseLevel: 1
  }
];

export const TALENT_POOL: Omit<Talent, 'id'>[] = [
  {
    name: 'Alex "Curly" Chen',
    role: 'Junior JS Scripter',
    avatar: '👨‍💻',
    locPerSec: 15,
    wagePerSec: 8,
    signingBonus: 800,
    followerBoostPct: 5,
    flavorQuote: 'Can center a div and writes fast callbacks.'
  },
  {
    name: 'Samira Patel',
    role: 'Game Loop Engineer',
    avatar: '👩‍💻',
    locPerSec: 35,
    wagePerSec: 18,
    signingBonus: 2200,
    followerBoostPct: 10,
    flavorQuote: 'Refactors tick rates while sleeping.'
  },
  {
    name: 'Dave "BugHunter" Miller',
    role: 'QA & Systems Dev',
    avatar: '🧑‍🔧',
    locPerSec: 25,
    wagePerSec: 14,
    signingBonus: 1500,
    followerBoostPct: 8,
    flavorQuote: 'Finds null pointers before they hit production.'
  },
  {
    name: 'Elena Rostova',
    role: 'Graphics & Shader Wizard',
    avatar: '👩‍🎨',
    locPerSec: 75,
    wagePerSec: 42,
    signingBonus: 5000,
    followerBoostPct: 20,
    flavorQuote: 'Turns WebGL into pure digital velvet.'
  },
  {
    name: 'Kai Takahashi',
    role: 'Lead Network Architect',
    avatar: '👨‍🚀',
    locPerSec: 140,
    wagePerSec: 85,
    signingBonus: 12000,
    followerBoostPct: 35,
    flavorQuote: 'Zero packet loss under 100k CCU load.'
  },
  {
    name: 'Dr. Evelyn Vance',
    role: 'Principal AI Scientist',
    avatar: '🧙‍♀️',
    locPerSec: 320,
    wagePerSec: 210,
    signingBonus: 35000,
    followerBoostPct: 60,
    flavorQuote: 'Trained neural nets to write clean C++.'
  },
  {
    name: 'Victor "Phantom" Vance',
    role: 'Kernel Exploiter & Hacker',
    avatar: '🥷',
    locPerSec: 680,
    wagePerSec: 460,
    signingBonus: 90000,
    followerBoostPct: 100,
    flavorQuote: 'Compiles binaries directly from brain waves.'
  }
];

export const INITIAL_UPGRADES: StudioUpgrade[] = [
  // Office upgrades
  {
    id: 'office-coworking',
    name: 'Co-Working Desk Pod',
    category: 'office',
    cost: 25000,
    description: 'Move out of the garage. Unlocks 6 total staff desks and +15% team speed.',
    purchased: false,
    locMultiplier: 1.15,
    deskLimit: 6,
    iconName: 'Building'
  },
  {
    id: 'office-loft',
    name: 'Downtown Tech Loft',
    category: 'office',
    cost: 120000,
    description: 'Trendy brick & glass studio. Unlocks 12 desks and +30% team speed.',
    purchased: false,
    locMultiplier: 1.30,
    deskLimit: 12,
    iconName: 'Briefcase'
  },
  {
    id: 'office-campus',
    name: 'Silicon Valley Campus',
    category: 'office',
    cost: 850000,
    description: 'Multi-building game tech park. Unlocks 25 desks and +60% team speed.',
    purchased: false,
    locMultiplier: 1.60,
    deskLimit: 25,
    iconName: 'Landmark'
  },
  {
    id: 'office-skyscraper',
    name: 'Glass Mega HQ Skyscraper',
    category: 'office',
    cost: 4000000,
    description: 'Dominate the city skyline. Unlocks 60 desks and +120% team speed.',
    purchased: false,
    locMultiplier: 2.20,
    deskLimit: 60,
    iconName: 'Building2'
  },

  // Hardware upgrades
  {
    id: 'hw-mechanical-keyboards',
    name: 'Cherry MX Blue Keyboards',
    category: 'hardware',
    cost: 2500,
    description: 'Crisp mechanical tactile feedback. +100% money earned per manual typing key!',
    purchased: false,
    typingBonusMultiplier: 2.0,
    iconName: 'Keyboard'
  },
  {
    id: 'hw-dual-monitors',
    name: 'Ultrawide 4K Displays',
    category: 'hardware',
    cost: 8000,
    description: 'More screen real estate means fewer bugs and +25% typing speed.',
    purchased: false,
    typingBonusMultiplier: 1.5,
    iconName: 'Monitor'
  },
  {
    id: 'hw-cloud-cluster',
    name: 'Dedicated Kubernetes Cluster',
    category: 'hardware',
    cost: 65000,
    description: 'High-uptime distributed backend. Boosts released game sales by 30%.',
    purchased: false,
    salesMultiplier: 1.30,
    iconName: 'Server'
  },
  {
    id: 'hw-ai-copilot',
    name: 'Self-Hosted AI Code Model',
    category: 'hardware',
    cost: 250000,
    description: 'Neural copilot writes 50 LOC/s constantly in background without salary.',
    purchased: false,
    passiveLocPerSec: 50,
    iconName: 'Cpu'
  },

  // Team perks
  {
    id: 'perk-espresso',
    name: 'Commercial Italian Espresso Bar',
    category: 'perk',
    cost: 6000,
    description: 'Unlimited caffeine shots keep all devs coding +20% faster.',
    purchased: false,
    locMultiplier: 1.20,
    iconName: 'Coffee'
  },
  {
    id: 'perk-gaming-lounge',
    name: 'VR & Arcade Breakroom',
    category: 'perk',
    cost: 45000,
    description: 'Inspires creative game design. Boosts review scores and fan gain.',
    purchased: false,
    locMultiplier: 1.15,
    salesMultiplier: 1.20,
    iconName: 'Gamepad2'
  },

  // Marketing upgrades
  {
    id: 'mkt-social-bot',
    name: 'Viral TikTok & X Hype Engine',
    category: 'marketing',
    cost: 15000,
    description: 'Continuous social media marketing brings +25% more initial game fans.',
    purchased: false,
    salesMultiplier: 1.25,
    iconName: 'Share2'
  },
  {
    id: 'mkt-streamer-network',
    name: 'Top Twitch Streamer Sponsorships',
    category: 'marketing',
    cost: 180000,
    description: 'Massive live broadcasts multiply lifetime game revenue by +40%.',
    purchased: false,
    salesMultiplier: 1.40,
    iconName: 'Tv'
  }
];

export function generateCandidate(isMystery: boolean = false): Talent {
  const id = 'talent-' + Math.random().toString(36).substring(2, 9);
  
  if (isMystery) {
    // Mystery talent gamble: Could be a cracked prodigy or a goofy potato
    const roll = Math.random();
    if (roll > 0.65) {
      // Prodigy
      return {
        id,
        name: '❓ [Mystery] 10x Prodigy',
        role: 'Unknown Savant',
        avatar: '🧙‍♂️',
        locPerSec: Math.floor(60 + Math.random() * 180),
        wagePerSec: Math.floor(10 + Math.random() * 25),
        signingBonus: 3000,
        followerBoostPct: 35,
        isMystery: true,
        flavorQuote: 'Legendary developer who chose to remain anonymous.'
      };
    } else if (roll > 0.3) {
      // Balanced
      return {
        id,
        name: '❓ [Mystery] Bootcamper',
        role: 'Self-Taught Coder',
        avatar: '🤠',
        locPerSec: Math.floor(25 + Math.random() * 40),
        wagePerSec: Math.floor(15 + Math.random() * 25),
        signingBonus: 1500,
        followerBoostPct: 15,
        isMystery: true,
        flavorQuote: 'Very eager to prove themselves.'
      };
    } else {
      // Slacker / risky
      return {
        id,
        name: '❓ [Mystery] Coffee Sipper',
        role: 'Senior Procrastinator',
        avatar: '😴',
        locPerSec: Math.floor(5 + Math.random() * 12),
        wagePerSec: Math.floor(35 + Math.random() * 40),
        signingBonus: 2000,
        followerBoostPct: 5,
        isMystery: true,
        flavorQuote: 'Spends 90% of sprint arguing about tab spacing.'
      };
    }
  }

  // Regular talent from pool with variance
  const template = TALENT_POOL[Math.floor(Math.random() * TALENT_POOL.length)];
  const variance = 0.85 + Math.random() * 0.3;
  return {
    id,
    name: template.name,
    role: template.role,
    avatar: template.avatar,
    locPerSec: Math.max(8, Math.round(template.locPerSec * variance)),
    wagePerSec: Math.max(5, Math.round(template.wagePerSec * variance)),
    signingBonus: Math.round(template.signingBonus * variance),
    followerBoostPct: template.followerBoostPct,
    flavorQuote: template.flavorQuote
  };
}

export function generateInitialCandidates(): Talent[] {
  return [
    generateCandidate(false),
    generateCandidate(false),
    generateCandidate(true) // Always 1 mystery option like gameinc.io!
  ];
}
