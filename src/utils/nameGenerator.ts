// Utility for generating random guest / non-account player names
// and extracting Google or Email account names for auto-fill

const PREFIXES = [
  'Pixel',
  'Cyber',
  'Neon',
  'Voxel',
  'Quantum',
  'Retro',
  'Hyper',
  'Bit',
  'Glitch',
  'Turbo',
  'Shadow',
  'Synth',
  'Aero',
  'Nova',
  'Echo',
  'Apex',
  'Zenith',
  'Iron',
  'Sonic',
  'Omega',
  'Cosmic',
  'Vector',
  'Pulse',
  'Ghost',
  'Vortex'
];

const SUFFIXES = [
  'Forge',
  'Byte',
  'Pulse',
  'Craft',
  'Storm',
  'Hero',
  'Games',
  'Studio',
  'Interactive',
  'Labs',
  'Works',
  'Wave',
  'Glitch',
  'Core',
  'Dynamics',
  'Drive',
  'Bytes',
  'Dev',
  'Pixels'
];

export function generateRandomGuestName(): string {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  
  // 40% chance of adding a number suffix (e.g. PixelForge 42 or CyberByte 07)
  const useNumber = Math.random() < 0.4;
  if (useNumber) {
    const num = Math.floor(Math.random() * 90) + 10;
    return `${prefix}${suffix} ${num}`;
  }
  
  // 30% chance of adding "Studio" or "Games" as a second word if not already
  if (suffix !== 'Studio' && suffix !== 'Games' && Math.random() < 0.5) {
    const term = Math.random() < 0.5 ? 'Studio' : 'Games';
    return `${prefix}${suffix} ${term}`;
  }

  return `${prefix}${suffix}`;
}

export function extractAccountName(user?: { displayName?: string; email?: string; studioName?: string } | null): string {
  if (!user) return '';

  // 1. Google display name
  if (user.displayName && user.displayName.trim()) {
    return user.displayName.trim();
  }

  // 2. Existing customized studioName (if it's not the generic default)
  if (user.studioName && user.studioName.trim() && user.studioName !== 'DOB Enterprises') {
    return user.studioName.trim();
  }

  // 3. Email username extraction
  if (user.email && user.email.includes('@')) {
    const rawUsername = user.email.split('@')[0].trim();
    if (rawUsername) {
      // Format username: capitalize first letter or clean dots/underscores
      const cleaned = rawUsername
        .replace(/[._-]+/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return cleaned || rawUsername;
    }
  }

  return '';
}
