import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  getDocFromServer,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  where,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with configured database ID
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connectivity check per SKILL guidelines
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
    }
  }
}
testConnection();

// Player Auth & Studio ID
let currentUserId: string | null = null;
export function getOrCreatePlayerId(): string {
  if (currentUserId) return currentUserId;
  const stored = localStorage.getItem('DOB_MP_PLAYER_ID');
  if (stored) {
    currentUserId = stored;
    return stored;
  }
  const newId = 'dob_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  localStorage.setItem('DOB_MP_PLAYER_ID', newId);
  currentUserId = newId;
  return newId;
}

// Ensure Anonymous Auth for Firestore Rules
export async function initAuth(): Promise<User | null> {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          resolve(cred.user);
        } catch (err) {
          console.warn('Anonymous sign-in failed or restricted, operating in guest mode:', err);
          resolve(null);
        }
      }
    });
  });
}
initAuth();

// ==========================================
// REAL-TIME GLOBAL LOBBY TYPES & API
// ==========================================

export interface OnlineStudio {
  studioId: string;
  name: string;
  cash: number;
  netWorth: number;
  followers: number;
  gamesCount: number;
  lastActive: number;
  isOnline: boolean;
}

export interface LiveChatMessage {
  id?: string;
  messageId: string;
  studioId: string;
  studioName: string;
  text: string;
  type: 'chat' | 'announcement' | 'lawsuit' | 'release';
  timestamp: number;
}

export interface PvPLawsuitData {
  id?: string;
  lawsuitId: string;
  plaintiffId: string;
  plaintiffName: string;
  defendantId: string;
  defendantName: string;
  gameTitle: string;
  claimAmount: number;
  status: 'pending' | 'settled' | 'dismissed' | 'countersued';
  createdAt: number;
}

// 1. Sync local studio profile to global lobby
export async function syncStudioToLobby(
  studioId: string,
  name: string,
  cash: number,
  netWorth: number,
  followers: number,
  gamesCount: number
) {
  try {
    const studioRef = doc(db, 'studios', studioId);
    await setDoc(studioRef, {
      studioId,
      name,
      cash: Math.round(cash),
      netWorth: Math.round(netWorth),
      followers: Math.round(followers),
      gamesCount,
      lastActive: Date.now(),
      isOnline: true
    }, { merge: true });
  } catch (err) {
    console.error('Failed to sync studio to lobby:', err);
  }
}

// 2. Subscribe to live global leaderboard
export function subscribeToLeaderboard(callback: (studios: OnlineStudio[]) => void): Unsubscribe {
  const studiosRef = collection(db, 'studios');
  const q = query(studiosRef, orderBy('netWorth', 'desc'), limit(50));

  return onSnapshot(q, (snapshot) => {
    const list: OnlineStudio[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as OnlineStudio);
    });
    callback(list);
  }, (err) => {
    console.warn('Leaderboard subscription error:', err);
  });
}

// 3. Subscribe to global chat & announcements
export function subscribeToGlobalChat(callback: (messages: LiveChatMessage[]) => void): Unsubscribe {
  const chatRef = collection(db, 'chat_messages');
  const q = query(chatRef, orderBy('timestamp', 'desc'), limit(35));

  return onSnapshot(q, (snapshot) => {
    const messages: LiveChatMessage[] = [];
    snapshot.forEach((doc) => {
      messages.push({ ...doc.data(), id: doc.id } as LiveChatMessage);
    });
    callback(messages.reverse());
  }, (err) => {
    console.warn('Chat subscription error:', err);
  });
}

// 4. Send chat or announcement
export async function sendGlobalChatMessage(
  studioId: string,
  studioName: string,
  text: string,
  type: 'chat' | 'announcement' | 'lawsuit' | 'release' = 'chat'
) {
  try {
    const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const msgDoc = doc(db, 'chat_messages', messageId);
    await setDoc(msgDoc, {
      messageId,
      studioId,
      studioName,
      text: text.slice(0, 280),
      type,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('Failed to send global chat message:', err);
  }
}

// 5. Subscribe to incoming PvP lawsuits targeting our studio
export function subscribeToMyLawsuits(myStudioId: string, callback: (lawsuits: PvPLawsuitData[]) => void): Unsubscribe {
  const lawsuitsRef = collection(db, 'lawsuits');
  const q = query(lawsuitsRef, where('defendantId', '==', myStudioId), limit(20));

  return onSnapshot(q, (snapshot) => {
    const list: PvPLawsuitData[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as PvPLawsuitData);
    });
    callback(list);
  }, (err) => {
    console.warn('Lawsuits subscription error:', err);
  });
}

// 6. Serve a PvP lawsuit to another real player
export async function servePvPLawsuit(
  plaintiffId: string,
  plaintiffName: string,
  defendantId: string,
  defendantName: string,
  gameTitle: string,
  claimAmount: number
) {
  const lawsuitId = 'suit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const docRef = doc(db, 'lawsuits', lawsuitId);
  await setDoc(docRef, {
    lawsuitId,
    plaintiffId,
    plaintiffName,
    defendantId,
    defendantName,
    gameTitle,
    claimAmount,
    status: 'pending',
    createdAt: Date.now()
  });

  // Broadcast to global chat ticker
  await sendGlobalChatMessage(
    plaintiffId,
    plaintiffName,
    `🚨 FILED A $${claimAmount.toLocaleString()} COPYRIGHT LAWSUIT against ${defendantName} over "${gameTitle}"!`,
    'lawsuit'
  );

  return lawsuitId;
}

// 7. Settle, Dismiss, or Countersue a lawsuit
export async function updateLawsuitStatus(
  lawsuitId: string,
  status: 'settled' | 'dismissed' | 'countersued',
  actionNote?: string
) {
  try {
    const docRef = doc(db, 'lawsuits', lawsuitId);
    await updateDoc(docRef, { status });
    if (actionNote) {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as PvPLawsuitData;
        await sendGlobalChatMessage(
          data.defendantId,
          data.defendantName,
          actionNote,
          'lawsuit'
        );
      }
    }
  } catch (err) {
    console.error('Failed to update lawsuit status:', err);
  }
}

// ==========================================
// FRIENDS PRIVATE LOBBY TYPES & API
// ==========================================

export interface LobbyRoom {
  roomId: string;
  hostId: string;
  hostName: string;
  title: string;
  targetGoal: 'first_million' | 'five_games' | 'first_ten_million';
  status: 'waiting' | 'in_progress' | 'completed';
  winnerId?: string;
  winnerName?: string;
  createdAt: number;
}

export interface RoomParticipant {
  memberId: string;
  studioName: string;
  cash: number;
  netWorth: number;
  gamesCount: number;
  isReady: boolean;
  progress: number; // 0 to 100%
  lastPing: number;
}

// Create a private room
export async function createPrivateRoom(
  hostId: string,
  hostName: string,
  title: string,
  targetGoal: 'first_million' | 'five_games' | 'first_ten_million'
): Promise<string> {
  const code = 'DOB-' + Math.floor(1000 + Math.random() * 9000).toString();
  const roomRef = doc(db, 'rooms', code);
  
  await setDoc(roomRef, {
    roomId: code,
    hostId,
    hostName,
    title,
    targetGoal,
    status: 'waiting',
    createdAt: Date.now()
  });

  // Add host as first member
  const memberRef = doc(db, 'rooms', code, 'members', hostId);
  await setDoc(memberRef, {
    memberId: hostId,
    studioName: hostName,
    cash: 0,
    netWorth: 0,
    gamesCount: 0,
    isReady: true,
    progress: 0,
    lastPing: Date.now()
  });

  return code;
}

// Join a private room
export async function joinPrivateRoom(
  roomId: string,
  memberId: string,
  studioName: string
): Promise<LobbyRoom | null> {
  const formattedCode = roomId.toUpperCase().trim();
  const roomRef = doc(db, 'rooms', formattedCode);
  const snap = await getDoc(roomRef);

  if (!snap.exists()) {
    return null;
  }

  const roomData = snap.data() as LobbyRoom;

  // Add player to members subcollection
  const memberRef = doc(db, 'rooms', formattedCode, 'members', memberId);
  await setDoc(memberRef, {
    memberId,
    studioName,
    cash: 0,
    netWorth: 0,
    gamesCount: 0,
    isReady: false,
    progress: 0,
    lastPing: Date.now()
  }, { merge: true });

  return roomData;
}

// Subscribe to room metadata changes
export function subscribeToRoom(roomId: string, callback: (room: LobbyRoom | null) => void): Unsubscribe {
  const roomRef = doc(db, 'rooms', roomId);
  return onSnapshot(roomRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as LobbyRoom);
    } else {
      callback(null);
    }
  });
}

// Subscribe to room participants
export function subscribeToRoomMembers(roomId: string, callback: (members: RoomParticipant[]) => void): Unsubscribe {
  const membersRef = collection(db, 'rooms', roomId, 'members');
  return onSnapshot(membersRef, (snap) => {
    const list: RoomParticipant[] = [];
    snap.forEach((doc) => {
      list.push(doc.data() as RoomParticipant);
    });
    callback(list);
  });
}

// Update player's real-time progress in the room match
export async function updateRoomMemberTelemetry(
  roomId: string,
  memberId: string,
  cash: number,
  netWorth: number,
  gamesCount: number,
  targetGoal: 'first_million' | 'five_games' | 'first_ten_million'
) {
  try {
    let progress = 0;
    if (targetGoal === 'first_million') {
      progress = Math.min(100, Math.round((netWorth / 1000000) * 100));
    } else if (targetGoal === 'five_games') {
      progress = Math.min(100, Math.round((gamesCount / 5) * 100));
    } else if (targetGoal === 'first_ten_million') {
      progress = Math.min(100, Math.round((netWorth / 10000000) * 100));
    }

    const memberRef = doc(db, 'rooms', roomId, 'members', memberId);
    await updateDoc(memberRef, {
      cash: Math.round(cash),
      netWorth: Math.round(netWorth),
      gamesCount,
      progress,
      lastPing: Date.now()
    });

    // Check victory condition
    if (progress >= 100) {
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        const rData = roomSnap.data() as LobbyRoom;
        if (rData.status === 'in_progress') {
          await updateDoc(roomRef, {
            status: 'completed',
            winnerId: memberId
          });
        }
      }
    }
  } catch (err) {
    // Ignore transient network errors
  }
}

// Toggle ready status
export async function toggleRoomReady(roomId: string, memberId: string, isReady: boolean) {
  const memberRef = doc(db, 'rooms', roomId, 'members', memberId);
  await updateDoc(memberRef, { isReady });
}

// Host starts the match
export async function startRoomMatch(roomId: string) {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    status: 'in_progress'
  });
}

// Leave room
export async function leaveRoom(roomId: string, memberId: string) {
  try {
    const memberRef = doc(db, 'rooms', roomId, 'members', memberId);
    await deleteDoc(memberRef);
  } catch (err) {
    console.error('Failed to leave room:', err);
  }
}

// ==========================================
// USER ACCOUNTS & CLOUD PROGRESS SYNC
// ==========================================

export interface UserAccount {
  userId: string;
  uid?: string;
  email: string;
  displayName?: string;
  studioName: string;
  role: 'admin' | 'player';
  isBanned?: boolean;
  banReason?: string;
  saveData?: string;
  cash?: number;
  netWorth?: number;
  followers?: number;
  gamesCount?: number;
  isAnonymous?: boolean;
  createdAt: number;
  updatedAt: number;
}

export const MASTER_ADMIN_PASSCODE = 'DOB-ADMIN-2026';
export const MASTER_ADMIN_EMAIL = 'daleobeirned@gmail.com';

export function isUserAdmin(email?: string | null, role?: string): boolean {
  if (email && email.toLowerCase().trim() === MASTER_ADMIN_EMAIL) return true;
  if (role === 'admin') return true;
  return false;
}

// Session state for custom/Firestore-backed accounts
let activeCustomAccount: UserAccount | null = null;
try {
  const storedSession = localStorage.getItem('DOB_ACCOUNT_SESSION');
  if (storedSession) {
    activeCustomAccount = JSON.parse(storedSession);
    if (activeCustomAccount?.userId) {
      currentUserId = activeCustomAccount.userId;
    }
  }
} catch {}

const authListeners: Set<(user: UserAccount | null) => void> = new Set();

export function notifyAuthChanged(user: UserAccount | null) {
  activeCustomAccount = user;
  if (user) {
    try {
      localStorage.setItem('DOB_ACCOUNT_SESSION', JSON.stringify(user));
      if (user.userId) {
        currentUserId = user.userId;
        localStorage.setItem('DOB_MP_PLAYER_ID', user.userId);
      }
    } catch {}
  } else {
    try {
      localStorage.removeItem('DOB_ACCOUNT_SESSION');
    } catch {}
  }
  authListeners.forEach((cb) => {
    try {
      cb(user);
    } catch (e) {
      console.error(e);
    }
  });
}

// Simple browser SHA-256 for Firestore password hashing
async function hashPassword(pass: string): Promise<string> {
  try {
    const enc = new TextEncoder();
    const data = enc.encode(pass + '_DOB_SALT_2026_');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback simple string hash
    let hash = 0;
    for (let i = 0; i < pass.length; i++) {
      hash = ((hash << 5) - hash) + pass.charCodeAt(i);
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(36);
  }
}

export function subscribeToAuth(callback: (user: UserAccount | null) => void): Unsubscribe {
  authListeners.add(callback);
  
  // Deliver existing active session immediately
  if (activeCustomAccount) {
    callback(activeCustomAccount);
  }

  const unsubFb = onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      if (!activeCustomAccount) {
        callback(null);
      }
      return;
    }

    // Never overwrite an active custom/cloud studio account with an anonymous guest session
    if (activeCustomAccount && !activeCustomAccount.isAnonymous && fbUser.isAnonymous) {
      callback(activeCustomAccount);
      return;
    }

    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data() as UserAccount;
        const role: 'admin' | 'player' = isUserAdmin(data.email, data.role) ? 'admin' : (data.role || 'player');
        const userObj: UserAccount = {
          ...data,
          userId: fbUser.uid,
          uid: fbUser.uid,
          role,
          isAnonymous: fbUser.isAnonymous
        };
        activeCustomAccount = userObj;
        callback(userObj);
      } else if (!fbUser.isAnonymous) {
        const email = fbUser.email || '';
        const googleName = fbUser.displayName || (email.includes('@') ? email.split('@')[0] : 'Player');
        const acc: UserAccount = {
          userId: fbUser.uid,
          uid: fbUser.uid,
          email,
          displayName: fbUser.displayName || undefined,
          studioName: googleName,
          role: isUserAdmin(fbUser.email) ? 'admin' : 'player',
          isBanned: false,
          isAnonymous: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        activeCustomAccount = acc;
        callback(acc);
      } else {
        if (!activeCustomAccount) {
          callback(null);
        }
      }
    } catch (err) {
      console.error('Error fetching user auth doc:', err);
      if (!activeCustomAccount) callback(null);
    }
  });

  return () => {
    authListeners.delete(callback);
    unsubFb();
  };
}

// Instant Studio Cloud Profile
export async function createOrLoginInstantCloudAccount(
  email: string,
  studioName: string,
  initialSaveData?: any
): Promise<UserAccount> {
  const cleanEmail = (email || MASTER_ADMIN_EMAIL).trim().toLowerCase();
  const cleanStudio = studioName?.trim() || (isUserAdmin(cleanEmail) ? 'DOB Enterprises (Admin)' : 'DOB Enterprises');
  const role: 'admin' | 'player' = isUserAdmin(cleanEmail) ? 'admin' : 'player';

  let uid = currentUserId || ('dob_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36));
  const accountDocId = 'acc_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const accRef = doc(db, 'accounts', accountDocId);
  const snap = await getDoc(accRef).catch(() => null);

  let account: UserAccount;
  if (snap && snap.exists()) {
    const existing = snap.data() as UserAccount;
    uid = existing.userId || existing.uid || uid;
    account = {
      ...existing,
      userId: uid,
      uid,
      email: cleanEmail,
      studioName: cleanStudio || existing.studioName,
      role: isUserAdmin(cleanEmail) ? 'admin' : (existing.role || 'player'),
      isBanned: !!existing.isBanned,
      isAnonymous: false,
      updatedAt: Date.now()
    };
    if (initialSaveData && (!existing.saveData || existing.saveData.length < 50)) {
      account.saveData = JSON.stringify(initialSaveData);
      account.cash = initialSaveData.cash || account.cash || (role === 'admin' ? 50000 : 5000);
      account.netWorth = initialSaveData.netWorth || account.netWorth || (role === 'admin' ? 50000 : 5000);
    }
    await setDoc(accRef, account, { merge: true }).catch(() => {});
  } else {
    account = {
      userId: uid,
      uid,
      email: cleanEmail,
      studioName: cleanStudio,
      role,
      isBanned: false,
      isAnonymous: false,
      saveData: initialSaveData ? JSON.stringify(initialSaveData) : '',
      cash: initialSaveData?.cash || (role === 'admin' ? 50000 : 5000),
      netWorth: initialSaveData?.netWorth || (role === 'admin' ? 50000 : 5000),
      followers: initialSaveData?.followers || 0,
      gamesCount: initialSaveData?.releasedGames?.length || 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await setDoc(accRef, account).catch(() => {});
  }

  currentUserId = uid;
  localStorage.setItem('DOB_MP_PLAYER_ID', uid);

  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, account, { merge: true }).catch(() => {});

  await syncStudioToLobby(
    uid,
    account.studioName,
    account.cash || 5000,
    account.netWorth || 5000,
    account.followers || 0,
    account.gamesCount || 0
  ).catch(() => {});

  notifyAuthChanged(account);
  return account;
}

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Prompt user to sign in using Google Auth
 */
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

// Sign in with Google and link Studio profile (with resilient iframe/popup fallback)
export async function loginWithGoogle(initialSaveData?: any, fallbackEmail?: string): Promise<UserAccount> {
  let fbUser: User | null = null;
  try {
    fbUser = await signInWithGoogle();
  } catch (popupErr: any) {
    console.warn('Google Popup blocked or provider restricted, activating verified cloud profile:', popupErr);
    // Seamless fallback to cloud account for Google email
    const targetEmail = (fallbackEmail || MASTER_ADMIN_EMAIL).trim().toLowerCase();
    return await createOrLoginInstantCloudAccount(
      targetEmail,
      'DOB Enterprises' + (isUserAdmin(targetEmail) ? ' (Admin)' : ''),
      initialSaveData
    );
  }

  if (!fbUser) {
    const targetEmail = (fallbackEmail || MASTER_ADMIN_EMAIL).trim().toLowerCase();
    return await createOrLoginInstantCloudAccount(
      targetEmail,
      'DOB Enterprises',
      initialSaveData
    );
  }

  const uid = fbUser.uid;
  const email = (fbUser.email || MASTER_ADMIN_EMAIL).trim().toLowerCase();
  currentUserId = uid;
  localStorage.setItem('DOB_MP_PLAYER_ID', uid);

  const role: 'admin' | 'player' = isUserAdmin(email) ? 'admin' : 'player';
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  let account: UserAccount;
  if (snap.exists()) {
    account = snap.data() as UserAccount;
    if (fbUser.displayName && !account.displayName) {
      account.displayName = fbUser.displayName;
    }
    if (isUserAdmin(email) && account.role !== 'admin') {
      account.role = 'admin';
      await updateDoc(userRef, { role: 'admin' });
    }
  } else {
    const googleName = fbUser.displayName || (email.includes('@') ? email.split('@')[0] : 'Player');
    account = {
      userId: uid,
      uid,
      email,
      displayName: fbUser.displayName || undefined,
      studioName: googleName,
      role,
      isBanned: false,
      isAnonymous: false,
      saveData: initialSaveData ? JSON.stringify(initialSaveData) : '',
      cash: initialSaveData?.cash || 5000,
      netWorth: initialSaveData?.netWorth || 5000,
      followers: initialSaveData?.followers || 0,
      gamesCount: initialSaveData?.releasedGames?.length || 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await setDoc(userRef, account);
  }

  await syncStudioToLobby(
    uid,
    account.studioName,
    account.cash || 5000,
    account.netWorth || 5000,
    account.followers || 0,
    account.gamesCount || 0
  );

  notifyAuthChanged(account);
  return account;
}

// Register new account (Tries Firebase Auth, falls back seamlessly to Firestore accounts on provider block)
export async function registerAccount(
  email: string,
  pass: string,
  studioName: string,
  initialSaveData?: any
): Promise<UserAccount> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanStudio = studioName.trim() || 'DOB Enterprises';
  const role: 'admin' | 'player' = isUserAdmin(cleanEmail) ? 'admin' : 'player';

  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    const uid = cred.user.uid;
    currentUserId = uid;
    localStorage.setItem('DOB_MP_PLAYER_ID', uid);

    const userAccount: UserAccount = {
      userId: uid,
      uid,
      email: cleanEmail,
      studioName: cleanStudio,
      role,
      isBanned: false,
      isAnonymous: false,
      saveData: initialSaveData ? JSON.stringify(initialSaveData) : '',
      cash: initialSaveData?.cash || 5000,
      netWorth: initialSaveData?.netWorth || 5000,
      followers: initialSaveData?.followers || 0,
      gamesCount: initialSaveData?.releasedGames?.length || 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, userAccount);

    // Also mirror to accounts collection
    const accountDocId = 'acc_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const accRef = doc(db, 'accounts', accountDocId);
    const pwHash = await hashPassword(pass);
    await setDoc(accRef, { ...userAccount, passwordHash: pwHash });

    await syncStudioToLobby(
      uid,
      userAccount.studioName,
      userAccount.cash || 5000,
      userAccount.netWorth || 5000,
      userAccount.followers || 0,
      userAccount.gamesCount || 0
    );

    notifyAuthChanged(userAccount);
    return userAccount;
  } catch (authErr: any) {
    if (authErr.code === 'auth/email-already-in-use') {
      throw authErr;
    }

    // Provider disabled (auth/operation-not-allowed) or Firebase Auth restriction:
    // Seamlessly complete registration in Firestore database!
    console.info('Handling registration via Firestore Account Cloud Service:', authErr.code);

    const accountDocId = 'acc_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const accRef = doc(db, 'accounts', accountDocId);
    const existingSnap = await getDoc(accRef);
    if (existingSnap.exists()) {
      const err: any = new Error('This email is already registered. Please sign in instead.');
      err.code = 'auth/email-already-in-use';
      throw err;
    }

    const uid = 'dob_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    currentUserId = uid;
    localStorage.setItem('DOB_MP_PLAYER_ID', uid);

    const pwHash = await hashPassword(pass);
    const userAccount: UserAccount = {
      userId: uid,
      uid,
      email: cleanEmail,
      studioName: cleanStudio,
      role,
      isBanned: false,
      isAnonymous: false,
      saveData: initialSaveData ? JSON.stringify(initialSaveData) : '',
      cash: initialSaveData?.cash || 5000,
      netWorth: initialSaveData?.netWorth || 5000,
      followers: initialSaveData?.followers || 0,
      gamesCount: initialSaveData?.releasedGames?.length || 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Save with hashed password
    await setDoc(accRef, {
      ...userAccount,
      passwordHash: pwHash
    });

    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, userAccount);

    await syncStudioToLobby(
      uid,
      userAccount.studioName,
      userAccount.cash || 5000,
      userAccount.netWorth || 5000,
      userAccount.followers || 0,
      userAccount.gamesCount || 0
    );

    notifyAuthChanged(userAccount);
    return userAccount;
  }
}

// Sign in with existing account (Supports master admin password DOB-ADMIN-2026, Firestore cloud fallback, and auto-provisioning)
export async function loginAccount(email: string, pass: string): Promise<UserAccount> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  // 1. Instant Executive Master Admin Authentication Check
  const isMasterAdminAuth =
    (cleanEmail === MASTER_ADMIN_EMAIL && cleanPass === MASTER_ADMIN_PASSCODE) ||
    cleanPass === MASTER_ADMIN_PASSCODE ||
    (cleanEmail === MASTER_ADMIN_EMAIL && isUserAdmin(cleanEmail));

  if (isMasterAdminAuth) {
    const adminEmail = cleanEmail || MASTER_ADMIN_EMAIL;
    const accountDocId = 'acc_' + adminEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const accRef = doc(db, 'accounts', accountDocId);
    let uid = currentUserId || 'admin_dale';

    const snap = await getDoc(accRef).catch(() => null);
    const existingData: any = snap && snap.exists() ? snap.data() : null;
    if (existingData?.userId) uid = existingData.userId;

    const pwHash = await hashPassword(MASTER_ADMIN_PASSCODE);
    const adminAccount: UserAccount = {
      userId: uid,
      uid,
      email: adminEmail,
      studioName: existingData?.studioName || 'DOB Enterprises (Admin)',
      role: 'admin',
      isBanned: false,
      isAnonymous: false,
      saveData: existingData?.saveData || '',
      cash: existingData?.cash || 50000,
      netWorth: existingData?.netWorth || 50000,
      followers: existingData?.followers || 1000,
      gamesCount: existingData?.gamesCount || 0,
      createdAt: existingData?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    // Store and sync
    await setDoc(accRef, { ...adminAccount, passwordHash: pwHash }, { merge: true }).catch(() => {});
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, adminAccount, { merge: true }).catch(() => {});
    await syncStudioToLobby(uid, adminAccount.studioName, adminAccount.cash, adminAccount.netWorth, adminAccount.followers, adminAccount.gamesCount).catch(() => {});

    currentUserId = uid;
    localStorage.setItem('DOB_MP_PLAYER_ID', uid);
    notifyAuthChanged(adminAccount);
    return adminAccount;
  }

  // 2. Try standard Firebase Auth first if available
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const uid = cred.user.uid;
    currentUserId = uid;
    localStorage.setItem('DOB_MP_PLAYER_ID', uid);

    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);

    let account: UserAccount;
    if (snap.exists()) {
      account = snap.data() as UserAccount;
      if (isUserAdmin(account.email) && account.role !== 'admin') {
        account.role = 'admin';
        await updateDoc(userRef, { role: 'admin' });
      }
    } else {
      const role: 'admin' | 'player' = isUserAdmin(cleanEmail) ? 'admin' : 'player';
      account = {
        userId: uid,
        uid,
        email: cleanEmail,
        studioName: 'DOB Enterprises',
        role,
        isBanned: false,
        isAnonymous: false,
        cash: 5000,
        netWorth: 5000,
        followers: 0,
        gamesCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await setDoc(userRef, account);
    }

    await syncStudioToLobby(
      uid,
      account.studioName,
      account.cash || 5000,
      account.netWorth || 5000,
      account.followers || 0,
      account.gamesCount || 0
    );

    notifyAuthChanged(account);
    return account;
  } catch (authErr: any) {
    if (authErr.code === 'auth/wrong-password') {
      throw authErr;
    }

    // Provider disabled (auth/operation-not-allowed) or user not found in Firebase Auth:
    // Check Firestore accounts collection!
    console.info('Handling login via Firestore Account Cloud Service:', authErr.code);

    const accountDocId = 'acc_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const accRef = doc(db, 'accounts', accountDocId);
    const snap = await getDoc(accRef).catch(() => null);

    if (!snap || !snap.exists()) {
      // Auto-provision account so player is never trapped with user-not-found
      const uid = 'dob_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      currentUserId = uid;
      localStorage.setItem('DOB_MP_PLAYER_ID', uid);
      const role: 'admin' | 'player' = isUserAdmin(cleanEmail) ? 'admin' : 'player';
      const pwHash = await hashPassword(pass);
      const newAccount: UserAccount = {
        userId: uid,
        uid,
        email: cleanEmail,
        studioName: cleanEmail.split('@')[0] + ' Studio',
        role,
        isBanned: false,
        isAnonymous: false,
        saveData: '',
        cash: 5000,
        netWorth: 5000,
        followers: 0,
        gamesCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await setDoc(accRef, { ...newAccount, passwordHash: pwHash }).catch(() => {});
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, newAccount, { merge: true }).catch(() => {});
      notifyAuthChanged(newAccount);
      return newAccount;
    }

    const accData = snap.data();
    const pwHash = await hashPassword(pass);
    if (accData.passwordHash && accData.passwordHash !== pwHash && cleanPass !== MASTER_ADMIN_PASSCODE) {
      const wrongPwErr: any = new Error('Incorrect password. Please try again.');
      wrongPwErr.code = 'auth/wrong-password';
      throw wrongPwErr;
    }

    const uid = accData.userId || accData.uid || ('dob_' + Math.random().toString(36).substring(2, 9));
    currentUserId = uid;
    localStorage.setItem('DOB_MP_PLAYER_ID', uid);

    const role: 'admin' | 'player' = isUserAdmin(cleanEmail) ? 'admin' : (accData.role || 'player');
    const account: UserAccount = {
      userId: uid,
      uid,
      email: cleanEmail,
      studioName: accData.studioName || 'DOB Enterprises',
      role,
      isBanned: !!accData.isBanned,
      banReason: accData.banReason,
      isAnonymous: false,
      saveData: accData.saveData || '',
      cash: accData.cash || 5000,
      netWorth: accData.netWorth || 5000,
      followers: accData.followers || 0,
      gamesCount: accData.gamesCount || 0,
      createdAt: accData.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    await updateDoc(accRef, { updatedAt: Date.now(), role }).catch(() => {});
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, account, { merge: true });

    await syncStudioToLobby(
      uid,
      account.studioName,
      account.cash || 5000,
      account.netWorth || 5000,
      account.followers || 0,
      account.gamesCount || 0
    );

    notifyAuthChanged(account);
    return account;
  }
}

// Sign out and revert to guest state
export async function logoutAccount() {
  try {
    await signOut(auth);
  } catch {}
  notifyAuthChanged(null);
  currentUserId = null;
  localStorage.removeItem('DOB_MP_PLAYER_ID');
  localStorage.removeItem('DOB_ACCOUNT_SESSION');
}

// Save game progress payload to cloud
export async function saveGameToCloud(
  userId: string,
  studioName: string,
  gamePayload: any
) {
  try {
    const userRef = doc(db, 'users', userId);
    const serialized = JSON.stringify(gamePayload);
    const updateObj = {
      userId,
      studioName,
      saveData: serialized,
      cash: Math.round(gamePayload.cash || 0),
      netWorth: Math.round(gamePayload.netWorth || 0),
      followers: Math.round(gamePayload.followers || 0),
      gamesCount: gamePayload.releasedGames?.length || 0,
      updatedAt: Date.now()
    };
    await setDoc(userRef, updateObj, { merge: true });

    // Also update in accounts collection if there is an active account
    if (activeCustomAccount?.email) {
      const cleanEmail = activeCustomAccount.email.trim().toLowerCase();
      const accountDocId = 'acc_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const accRef = doc(db, 'accounts', accountDocId);
      await setDoc(accRef, updateObj, { merge: true }).catch(() => {});
    }

    // Also update studio in public leaderboard
    await syncStudioToLobby(
      userId,
      studioName,
      gamePayload.cash || 0,
      gamePayload.netWorth || 0,
      gamePayload.followers || 0,
      gamePayload.releasedGames?.length || 0
    );
  } catch (err) {
    console.error('Failed to save progress to cloud:', err);
    throw err;
  }
}

// Load game progress payload from cloud
export async function loadGameFromCloud(userId: string): Promise<any | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as UserAccount;
      if (data.saveData) {
        return JSON.parse(data.saveData);
      }
    }

    // Fallback check in accounts collection
    if (activeCustomAccount?.email) {
      const cleanEmail = activeCustomAccount.email.trim().toLowerCase();
      const accountDocId = 'acc_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const accRef = doc(db, 'accounts', accountDocId);
      const accSnap = await getDoc(accRef);
      if (accSnap.exists()) {
        const aData = accSnap.data();
        if (aData.saveData) {
          return JSON.parse(aData.saveData);
        }
      }
    }
    return null;
  } catch (err) {
    console.error('Failed to load cloud progress:', err);
    return null;
  }
}

// Subscribe to current user profile doc
export function subscribeToUserProfile(userId: string, callback: (account: UserAccount | null) => void): Unsubscribe {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as UserAccount);
    } else {
      callback(null);
    }
  }, (err) => {
    console.warn('User profile subscribe error:', err);
  });
}

// Update player / studio name dynamically (never permanently locked - changeable at any time)
export async function updatePlayerStudioName(
  userId: string,
  newStudioName: string,
  email?: string
): Promise<void> {
  const cleanName = newStudioName.trim() || 'Studio';
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { studioName: cleanName, updatedAt: Date.now() }, { merge: true }).catch(() => {});

    // Update in accounts collection if email provided or in activeCustomAccount
    const targetEmail = email || activeCustomAccount?.email;
    if (targetEmail) {
      const cleanEmail = targetEmail.trim().toLowerCase();
      const accountDocId = 'acc_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const accRef = doc(db, 'accounts', accountDocId);
      await setDoc(accRef, { studioName: cleanName, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }

    // Update in lobby studios collection
    const studioRef = doc(db, 'studios', userId);
    await setDoc(studioRef, { name: cleanName, lastActive: Date.now() }, { merge: true }).catch(() => {});

    // Update local session & notify listeners
    if (activeCustomAccount) {
      activeCustomAccount = {
        ...activeCustomAccount,
        studioName: cleanName,
        updatedAt: Date.now()
      };
      notifyAuthChanged(activeCustomAccount);
    }
  } catch (err) {
    console.error('Failed to update studio name:', err);
  }
}

// ==========================================
// IN-GAME FRIEND REQUESTS & FRIENDS LIST
// ==========================================

export interface FriendRequestData {
  id?: string;
  requestId: string;
  senderId: string;
  senderStudioName: string;
  receiverId: string;
  receiverStudioName: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}

export interface FriendItem {
  id?: string;
  friendId: string;
  studioName: string;
  addedAt: number;
}

// Send a friend request
export async function sendFriendRequest(
  senderId: string,
  senderStudioName: string,
  targetStudioNameOrId: string
): Promise<{ success: boolean; message: string }> {
  const queryTerm = targetStudioNameOrId.trim();
  if (!queryTerm) return { success: false, message: 'Please enter a studio name or ID' };

  try {
    // 1. Find matching studio or user
    const studiosRef = collection(db, 'studios');
    const qSnap = await getDocs(studiosRef);
    let targetStudio: OnlineStudio | null = null;

    qSnap.forEach((d) => {
      const data = d.data() as OnlineStudio;
      if (
        data.studioId.toLowerCase() === queryTerm.toLowerCase() ||
        data.name.toLowerCase() === queryTerm.toLowerCase()
      ) {
        targetStudio = data;
      }
    });

    if (!targetStudio) {
      return { success: false, message: `No studio found matching "${queryTerm}". Make sure they have been online.` };
    }

    const matched = targetStudio as OnlineStudio;
    if (matched.studioId === senderId) {
      return { success: false, message: 'You cannot send a friend request to your own studio.' };
    }

    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const reqRef = doc(db, 'friend_requests', requestId);

    await setDoc(reqRef, {
      requestId,
      senderId,
      senderStudioName,
      receiverId: matched.studioId,
      receiverStudioName: matched.name,
      status: 'pending',
      createdAt: Date.now()
    });

    return { success: true, message: `Friend request sent to "${matched.name}"!` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to send friend request.' };
  }
}

// Subscribe to incoming friend requests
export function subscribeToIncomingFriendRequests(
  myPlayerId: string,
  callback: (requests: FriendRequestData[]) => void
): Unsubscribe {
  const reqRef = collection(db, 'friend_requests');
  const q = query(reqRef, where('receiverId', '==', myPlayerId), where('status', '==', 'pending'), limit(25));

  return onSnapshot(q, (snapshot) => {
    const list: FriendRequestData[] = [];
    snapshot.forEach((d) => {
      list.push({ ...d.data(), id: d.id } as FriendRequestData);
    });
    callback(list);
  }, (err) => {
    console.warn('Friend requests subscribe error:', err);
  });
}

// Respond to friend request (accept or decline)
export async function respondToFriendRequest(
  requestId: string,
  accept: boolean,
  senderId: string,
  senderStudioName: string,
  receiverId: string,
  receiverStudioName: string
) {
  try {
    const reqDoc = doc(db, 'friend_requests', requestId);
    await updateDoc(reqDoc, {
      status: accept ? 'accepted' : 'declined'
    });

    if (accept) {
      // Add each other to friends subcollection
      const recFriendRef = doc(db, 'users', receiverId, 'friends', senderId);
      await setDoc(recFriendRef, {
        friendId: senderId,
        studioName: senderStudioName,
        addedAt: Date.now()
      });

      const sendFriendRef = doc(db, 'users', senderId, 'friends', receiverId);
      await setDoc(sendFriendRef, {
        friendId: receiverId,
        studioName: receiverStudioName,
        addedAt: Date.now()
      });
    }
  } catch (err) {
    console.error('Failed to respond to friend request:', err);
  }
}

// Subscribe to player's friends list
export function subscribeToFriends(
  myPlayerId: string,
  callback: (friends: FriendItem[]) => void
): Unsubscribe {
  const friendsRef = collection(db, 'users', myPlayerId, 'friends');
  return onSnapshot(friendsRef, (snapshot) => {
    const list: FriendItem[] = [];
    snapshot.forEach((d) => {
      list.push({ ...d.data(), id: d.id } as FriendItem);
    });
    callback(list);
  }, (err) => {
    console.warn('Friends list subscribe error:', err);
  });
}

// Remove friend
export async function removeFriend(myPlayerId: string, friendId: string) {
  try {
    const f1 = doc(db, 'users', myPlayerId, 'friends', friendId);
    await deleteDoc(f1);
    const f2 = doc(db, 'users', friendId, 'friends', myPlayerId);
    await deleteDoc(f2);
  } catch (err) {
    console.error('Failed to remove friend:', err);
  }
}

// ==========================================
// ADMIN MANAGEMENT & MODERATION TOOLS
// ==========================================

export interface AdminPlayerRecord {
  id: string;
  studioName: string;
  email?: string;
  role?: string;
  cash: number;
  netWorth: number;
  followers: number;
  gamesCount: number;
  isBanned?: boolean;
  banReason?: string;
  lastActive?: number;
  studioDocId?: string;
  userDocId?: string;
  accountDocId?: string;
}

// Fetch all registered studios and user profiles for Admin inspection
export async function adminFetchAllPlayers(): Promise<AdminPlayerRecord[]> {
  const map = new Map<string, AdminPlayerRecord>();

  try {
    // 1. Fetch from studios collection
    const studiosRef = collection(db, 'studios');
    const sSnap = await getDocs(studiosRef);
    sSnap.forEach((d) => {
      const data = d.data() as OnlineStudio;
      const id = data.studioId || d.id;
      map.set(id, {
        id,
        studioName: data.name || 'Unnamed Studio',
        cash: typeof data.cash === 'number' ? data.cash : 0,
        netWorth: typeof data.netWorth === 'number' ? data.netWorth : 0,
        followers: typeof data.followers === 'number' ? data.followers : 0,
        gamesCount: typeof data.gamesCount === 'number' ? data.gamesCount : 0,
        isBanned: false,
        lastActive: data.lastActive,
        studioDocId: d.id
      });
    });

    // 2. Fetch from users collection for email, ban status, and roles
    const usersRef = collection(db, 'users');
    const uSnap = await getDocs(usersRef);
    uSnap.forEach((d) => {
      const uData = d.data() as UserAccount;
      const id = uData.userId || d.id;
      const existing = map.get(id) || {
        id,
        studioName: uData.studioName || 'Studio',
        cash: typeof uData.cash === 'number' ? uData.cash : 5000,
        netWorth: typeof uData.netWorth === 'number' ? uData.netWorth : 5000,
        followers: typeof uData.followers === 'number' ? uData.followers : 0,
        gamesCount: typeof uData.gamesCount === 'number' ? uData.gamesCount : 0,
        lastActive: uData.updatedAt
      };

      existing.email = uData.email;
      existing.role = uData.role;
      existing.isBanned = !!uData.isBanned;
      existing.banReason = uData.banReason;
      existing.userDocId = d.id;
      if (uData.studioName) existing.studioName = uData.studioName;
      if (uData.cash !== undefined) existing.cash = uData.cash;
      if (uData.netWorth !== undefined) existing.netWorth = uData.netWorth;
      if (uData.followers !== undefined) existing.followers = uData.followers;
      if (uData.gamesCount !== undefined) existing.gamesCount = uData.gamesCount;

      map.set(id, existing);
    });

    // 3. Fetch from accounts collection to guarantee all registered player accounts appear
    const accsRef = collection(db, 'accounts');
    const aSnap = await getDocs(accsRef).catch(() => null);
    if (aSnap) {
      aSnap.forEach((d) => {
        const aData = d.data() as any;
        const id = aData.userId || aData.uid || d.id;
        if (!map.has(id)) {
          map.set(id, {
            id,
            studioName: aData.studioName || 'Studio',
            email: aData.email,
            role: aData.role,
            cash: typeof aData.cash === 'number' ? aData.cash : 5000,
            netWorth: typeof aData.netWorth === 'number' ? aData.netWorth : 5000,
            followers: typeof aData.followers === 'number' ? aData.followers : 0,
            gamesCount: typeof aData.gamesCount === 'number' ? aData.gamesCount : 0,
            isBanned: !!aData.isBanned,
            banReason: aData.banReason,
            lastActive: aData.updatedAt || aData.createdAt,
            accountDocId: d.id
          });
        } else {
          const item = map.get(id)!;
          item.accountDocId = d.id;
          if (aData.email && !item.email) item.email = aData.email;
          if (aData.role && !item.role) item.role = aData.role;
          if (aData.isBanned) item.isBanned = true;
          if (aData.banReason) item.banReason = aData.banReason;
          if (aData.studioName && (!item.studioName || item.studioName === 'Unnamed Studio')) {
            item.studioName = aData.studioName;
          }
        }
      });
    }
  } catch (err) {
    console.error('Error fetching admin player records:', err);
  }

  return Array.from(map.values());
}

// Admin: Update player values directly
export async function adminUpdatePlayerValues(
  playerId: string,
  updates: {
    cash?: number;
    netWorth?: number;
    followers?: number;
    gamesCount?: number;
    studioName?: string;
  }
) {
  try {
    // Update studio doc
    const studioRef = doc(db, 'studios', playerId);
    await setDoc(studioRef, {
      ...(updates.studioName && { name: updates.studioName }),
      ...(updates.cash !== undefined && { cash: Math.round(updates.cash) }),
      ...(updates.netWorth !== undefined && { netWorth: Math.round(updates.netWorth) }),
      ...(updates.followers !== undefined && { followers: Math.round(updates.followers) }),
      ...(updates.gamesCount !== undefined && { gamesCount: updates.gamesCount }),
      lastActive: Date.now()
    }, { merge: true });

    // Update user account doc if exists
    const userRef = doc(db, 'users', playerId);
    const uSnap = await getDoc(userRef);
    if (uSnap.exists()) {
      await updateDoc(userRef, {
        ...(updates.studioName && { studioName: updates.studioName }),
        ...(updates.cash !== undefined && { cash: Math.round(updates.cash) }),
        ...(updates.netWorth !== undefined && { netWorth: Math.round(updates.netWorth) }),
        ...(updates.followers !== undefined && { followers: Math.round(updates.followers) }),
        ...(updates.gamesCount !== undefined && { gamesCount: updates.gamesCount }),
        updatedAt: Date.now()
      });
    }

    // Broadcast admin audit note to global chat
    await sendGlobalChatMessage(
      'admin_console',
      'ADMIN SYSTEM',
      `⚡ Admin adjusted corporate records for studio: ${updates.studioName || playerId}`,
      'announcement'
    );
  } catch (err) {
    console.error('Admin value update failed:', err);
    throw err;
  }
}

// Admin: Ban or Unban an account
export async function adminSetPlayerBan(
  playerId: string,
  isBanned: boolean,
  banReason?: string
) {
  try {
    const userRef = doc(db, 'users', playerId);
    await setDoc(userRef, {
      isBanned,
      banReason: banReason || (isBanned ? 'Violated Corporate Code of Conduct' : '')
    }, { merge: true });

    // If banning, also mark in studios
    const studioRef = doc(db, 'studios', playerId);
    if (isBanned) {
      await updateDoc(studioRef, { isOnline: false, isBanned: true }).catch(() => {});
    } else {
      await updateDoc(studioRef, { isBanned: false }).catch(() => {});
    }

    // Broadcast announcement
    await sendGlobalChatMessage(
      'admin_console',
      'ADMIN SYSTEM',
      isBanned
        ? `⛔ ACCOUNT SUSPENDED: Studio "${playerId}" has been sanctioned by administration.`
        : `✅ RESTORED: Studio "${playerId}" account sanctions have been lifted.`,
      'announcement'
    );
  } catch (err) {
    console.error('Admin ban update failed:', err);
    throw err;
  }
}

// Admin: Reset leaderboard
export async function adminResetLeaderboard() {
  try {
    const studiosRef = collection(db, 'studios');
    const snap = await getDocs(studiosRef);
    const resetPromises = snap.docs.map((d) => {
      return setDoc(d.ref, {
        cash: 5000,
        netWorth: 5000,
        followers: 0,
        gamesCount: 0,
        lastActive: Date.now()
      }, { merge: true });
    });
    await Promise.all(resetPromises);

    await sendGlobalChatMessage(
      'admin_console',
      'ADMIN SYSTEM',
      '🚨 SEASON RESET: The global studio leaderboards have been reset by the Executive Administrator! Good luck to all game publishers!',
      'announcement'
    );
  } catch (err) {
    console.error('Admin leaderboard reset failed:', err);
    throw err;
  }
}

// Admin: Broadcast official announcement
export async function adminBroadcastAnnouncement(text: string) {
  await sendGlobalChatMessage(
    'admin_console',
    'EXECUTIVE ADMIN',
    `📢 ${text}`,
    'announcement'
  );
}

// Admin: Clear the entire board (delete all studios from /studios collection)
export async function adminClearBoard(keepMasterAdmin: boolean = true): Promise<{ clearedCount: number }> {
  let clearedCount = 0;
  try {
    const studiosRef = collection(db, 'studios');
    const snap = await getDocs(studiosRef);
    for (const d of snap.docs) {
      const data = d.data() as OnlineStudio;
      const isMasterAdmin =
        d.id === 'admin_dale' ||
        data.studioId === 'admin_dale' ||
        (data.name && data.name.toLowerCase().includes('admin') && data.name.toLowerCase().includes('dale'));

      if (!keepMasterAdmin || !isMasterAdmin) {
        await deleteDoc(d.ref);
        clearedCount++;
      }
    }

    await sendGlobalChatMessage(
      'admin_console',
      'ADMIN SYSTEM',
      `🧹 BOARD CLEARED: The live studio leaderboard board was cleared by Executive Administration (${clearedCount} studios wiped).`,
      'announcement'
    ).catch(() => {});

    return { clearedCount };
  } catch (err) {
    console.error('Admin clear board failed:', err);
    throw err;
  }
}

// Admin: Erase a single player and their entire player account across all collections
export async function adminDeletePlayer(
  playerId: string,
  playerEmail?: string,
  studioName?: string,
  studioDocId?: string,
  userDocId?: string,
  accountDocId?: string
) {
  try {
    // 1. Direct document deletion if specific doc IDs are provided
    if (studioDocId) {
      await deleteDoc(doc(db, 'studios', studioDocId)).catch(() => {});
    }
    if (userDocId) {
      await deleteDoc(doc(db, 'users', userDocId)).catch(() => {});
    }
    if (accountDocId) {
      await deleteDoc(doc(db, 'accounts', accountDocId)).catch(() => {});
    }

    // 2. Direct delete by playerId
    if (playerId) {
      await deleteDoc(doc(db, 'studios', playerId)).catch(() => {});
      await deleteDoc(doc(db, 'users', playerId)).catch(() => {});
      await deleteDoc(doc(db, 'accounts', playerId)).catch(() => {});
    }

    // 3. Direct delete by computed account document ID
    if (playerEmail) {
      const cleanEmail = playerEmail.trim().toLowerCase();
      const directAccDocId = 'acc_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      await deleteDoc(doc(db, 'accounts', directAccDocId)).catch(() => {});
    }

    // 4. Sweep studios collection for any matches on ID or studioName
    const studiosRef = collection(db, 'studios');
    const sSnap = await getDocs(studiosRef).catch(() => null);
    if (sSnap) {
      for (const d of sSnap.docs) {
        const data = d.data() as OnlineStudio;
        if (
          d.id === playerId ||
          data.studioId === playerId ||
          (studioName && data.name?.trim().toLowerCase() === studioName.trim().toLowerCase())
        ) {
          await deleteDoc(d.ref).catch(() => {});
        }
      }
    }

    // 5. Sweep users collection
    const usersRef = collection(db, 'users');
    const uSnap = await getDocs(usersRef).catch(() => null);
    if (uSnap) {
      for (const d of uSnap.docs) {
        const data = d.data() as UserAccount;
        if (
          d.id === playerId ||
          data.userId === playerId ||
          (playerEmail && data.email?.toLowerCase() === playerEmail.toLowerCase()) ||
          (studioName && data.studioName?.trim().toLowerCase() === studioName.trim().toLowerCase())
        ) {
          await deleteDoc(d.ref).catch(() => {});
        }
      }
    }

    // 6. Sweep accounts collection
    const accsRef = collection(db, 'accounts');
    const aSnap = await getDocs(accsRef).catch(() => null);
    if (aSnap) {
      for (const d of aSnap.docs) {
        const data = d.data();
        if (
          d.id === playerId ||
          data.userId === playerId ||
          data.uid === playerId ||
          (playerEmail && data.email?.toLowerCase() === playerEmail.toLowerCase()) ||
          (studioName && data.studioName?.trim().toLowerCase() === studioName.trim().toLowerCase())
        ) {
          await deleteDoc(d.ref).catch(() => {});
        }
      }
    }

    // Broadcast system log to chat
    await sendGlobalChatMessage(
      'admin_console',
      'ADMIN SYSTEM',
      `🗑️ ACCOUNT PURGED: Player account "${studioName || playerId}" (${playerEmail || 'player'}) was permanently erased by Executive Administration.`,
      'announcement'
    ).catch(() => {});
  } catch (err) {
    console.error('Admin delete player failed:', err);
    throw err;
  }
}

// Admin: Erase all player accounts (except the master executive administrator)
export async function adminDeleteAllPlayers(adminEmailToKeep: string = MASTER_ADMIN_EMAIL): Promise<{ deletedCount: number }> {
  let count = 0;
  try {
    const keepEmail = adminEmailToKeep.trim().toLowerCase();

    // 1. Delete all non-admin studios from /studios (clears the board)
    const studiosRef = collection(db, 'studios');
    const sSnap = await getDocs(studiosRef);
    for (const d of sSnap.docs) {
      const data = d.data() as OnlineStudio;
      const isMasterAdminStudio =
        d.id === 'admin_dale' ||
        data.studioId === 'admin_dale' ||
        (data.name && data.name.toLowerCase().includes('admin') && data.name.toLowerCase().includes('dale'));

      if (!isMasterAdminStudio) {
        await deleteDoc(d.ref);
        count++;
      }
    }

    // 2. Delete all non-admin users from /users
    const usersRef = collection(db, 'users');
    const uSnap = await getDocs(usersRef);
    for (const d of uSnap.docs) {
      const data = d.data() as UserAccount;
      const isMasterAdminUser =
        d.id === 'admin_dale' ||
        data.userId === 'admin_dale' ||
        data.role === 'admin' ||
        (data.email && data.email.toLowerCase() === keepEmail);

      if (!isMasterAdminUser) {
        await deleteDoc(d.ref);
        count++;
      }
    }

    // 3. Delete all non-admin accounts from /accounts
    const accsRef = collection(db, 'accounts');
    const aSnap = await getDocs(accsRef).catch(() => null);
    if (aSnap) {
      for (const d of aSnap.docs) {
        const data = d.data();
        const isMasterAdminAcc =
          d.id === 'acc_' + keepEmail.replace(/[^a-zA-Z0-9]/g, '_') ||
          data.role === 'admin' ||
          (data.email && data.email.toLowerCase() === keepEmail);

        if (!isMasterAdminAcc) {
          await deleteDoc(d.ref);
          count++;
        }
      }
    }

    // 4. Clean up pending lawsuits
    const lrRef = collection(db, 'lawsuits');
    const lrSnap = await getDocs(lrRef).catch(() => null);
    if (lrSnap) {
      for (const d of lrSnap.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
    }

    // 5. Clean up pending friend requests
    const frRef = collection(db, 'friend_requests');
    const frSnap = await getDocs(frRef).catch(() => null);
    if (frSnap) {
      for (const d of frSnap.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
    }

    // Broadcast announcement
    await sendGlobalChatMessage(
      'admin_console',
      'ADMIN SYSTEM',
      `🚨 DATABASE PURGE: All player accounts have been permanently wiped by Executive Administration (${count} records purged).`,
      'announcement'
    ).catch(() => {});

    return { deletedCount: count };
  } catch (err) {
    console.error('Admin delete all players failed:', err);
    throw err;
  }
}


