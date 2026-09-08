import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
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
