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

export function isUserAdmin(email?: string | null, role?: string): boolean {
  if (email && email.toLowerCase().trim() === 'daleobeirned@gmail.com') return true;
  if (role === 'admin') return true;
  return false;
}

export function subscribeToAuth(callback: (user: UserAccount | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      callback(null);
      return;
    }
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data() as UserAccount;
        const role: 'admin' | 'player' = isUserAdmin(data.email, data.role) ? 'admin' : (data.role || 'player');
        callback({
          ...data,
          userId: fbUser.uid,
          uid: fbUser.uid,
          role,
          isAnonymous: fbUser.isAnonymous
        });
      } else if (!fbUser.isAnonymous) {
        const acc: UserAccount = {
          userId: fbUser.uid,
          uid: fbUser.uid,
          email: fbUser.email || '',
          studioName: fbUser.displayName || 'DOB Enterprises',
          role: isUserAdmin(fbUser.email) ? 'admin' : 'player',
          isBanned: false,
          isAnonymous: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        callback(acc);
      } else {
        // Anonymous guest with no saved studio profile yet
        callback(null);
      }
    } catch (err) {
      console.error('Error fetching user auth doc:', err);
      callback(null);
    }
  });
}

// Instant Studio Cloud Profile (Works even if Email/Password provider is disabled in Firebase console)
export async function createOrLoginInstantCloudAccount(
  email: string,
  studioName: string,
  initialSaveData?: any
): Promise<UserAccount> {
  if (!auth.currentUser) {
    await initAuth();
  }
  const uid = auth.currentUser?.uid || currentUserId || ('dob_' + Math.random().toString(36).substring(2, 9));
  currentUserId = uid;
  localStorage.setItem('DOB_MP_PLAYER_ID', uid);

  const cleanEmail = email.trim();
  const cleanStudio = studioName.trim() || 'DOB Enterprises';
  const role: 'admin' | 'player' = isUserAdmin(cleanEmail) ? 'admin' : 'player';

  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  let account: UserAccount;
  if (snap.exists()) {
    const existing = snap.data() as UserAccount;
    account = {
      ...existing,
      userId: uid,
      uid,
      email: cleanEmail || existing.email,
      studioName: cleanStudio || existing.studioName,
      role: isUserAdmin(cleanEmail) ? 'admin' : existing.role,
      updatedAt: Date.now()
    };
    await updateDoc(userRef, {
      email: account.email,
      studioName: account.studioName,
      role: account.role,
      updatedAt: Date.now()
    });
  } else {
    account = {
      userId: uid,
      uid,
      email: cleanEmail,
      studioName: cleanStudio,
      role,
      isBanned: false,
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

  return account;
}

// Sign in with Google
export async function loginWithGoogle(initialSaveData?: any): Promise<UserAccount> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const uid = cred.user.uid;
  const email = cred.user.email || '';
  currentUserId = uid;
  localStorage.setItem('DOB_MP_PLAYER_ID', uid);

  const role: 'admin' | 'player' = isUserAdmin(email) ? 'admin' : 'player';
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  let account: UserAccount;
  if (snap.exists()) {
    account = snap.data() as UserAccount;
    if (isUserAdmin(email) && account.role !== 'admin') {
      account.role = 'admin';
      await updateDoc(userRef, { role: 'admin' });
    }
  } else {
    account = {
      userId: uid,
      uid,
      email,
      studioName: cred.user.displayName || 'DOB Enterprises',
      role,
      isBanned: false,
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

  return account;
}

// Register new account
export async function registerAccount(
  email: string,
  pass: string,
  studioName: string,
  initialSaveData?: any
): Promise<UserAccount> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const uid = cred.user.uid;
  currentUserId = uid;
  localStorage.setItem('DOB_MP_PLAYER_ID', uid);

  const role: 'admin' | 'player' = isUserAdmin(email) ? 'admin' : 'player';

  const userAccount: UserAccount = {
    userId: uid,
    uid,
    email: email.trim(),
    studioName: studioName.trim() || 'DOB Enterprises',
    role,
    isBanned: false,
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

  // Sync to public studios lobby
  await syncStudioToLobby(
    uid,
    userAccount.studioName,
    userAccount.cash || 5000,
    userAccount.netWorth || 5000,
    userAccount.followers || 0,
    userAccount.gamesCount || 0
  );

  return userAccount;
}

// Sign in with existing account
export async function loginAccount(email: string, pass: string): Promise<UserAccount> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const uid = cred.user.uid;
  currentUserId = uid;
  localStorage.setItem('DOB_MP_PLAYER_ID', uid);

  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  let account: UserAccount;
  if (snap.exists()) {
    account = snap.data() as UserAccount;
    // Check if auto-admin matches
    if (isUserAdmin(account.email) && account.role !== 'admin') {
      account.role = 'admin';
      await updateDoc(userRef, { role: 'admin' });
    }
  } else {
    // If user document didn't exist yet, bootstrap it
    const role: 'admin' | 'player' = isUserAdmin(email) ? 'admin' : 'player';
    account = {
      userId: uid,
      uid,
      email: email.trim(),
      studioName: 'DOB Enterprises',
      role,
      isBanned: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await setDoc(userRef, account);
  }

  return account;
}

// Sign out and revert to guest state
export async function logoutAccount() {
  await signOut(auth);
  currentUserId = null;
  localStorage.removeItem('DOB_MP_PLAYER_ID');
  // Re-sign in anonymously for lobby access
  await initAuth();
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
    await setDoc(userRef, {
      userId,
      studioName,
      saveData: serialized,
      cash: Math.round(gamePayload.cash || 0),
      netWorth: Math.round(gamePayload.netWorth || 0),
      followers: Math.round(gamePayload.followers || 0),
      gamesCount: gamePayload.releasedGames?.length || 0,
      updatedAt: Date.now()
    }, { merge: true });

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
    if (!snap.exists()) return null;
    const data = snap.data() as UserAccount;
    if (data.saveData) {
      return JSON.parse(data.saveData);
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
}

// Fetch all registered studios and user profiles for Admin inspection
export async function adminFetchAllPlayers(): Promise<AdminPlayerRecord[]> {
  const map = new Map<string, AdminPlayerRecord>();

  try {
    // 1. Fetch from studios
    const studiosRef = collection(db, 'studios');
    const sSnap = await getDocs(studiosRef);
    sSnap.forEach((d) => {
      const data = d.data() as OnlineStudio;
      map.set(data.studioId, {
        id: data.studioId,
        studioName: data.name || 'Unnamed Studio',
        cash: data.cash || 0,
        netWorth: data.netWorth || 0,
        followers: data.followers || 0,
        gamesCount: data.gamesCount || 0,
        isBanned: false,
        lastActive: data.lastActive
      });
    });

    // 2. Fetch from users collection for email, ban status, and roles
    const usersRef = collection(db, 'users');
    const uSnap = await getDocs(usersRef);
    uSnap.forEach((d) => {
      const uData = d.data() as UserAccount;
      const existing = map.get(uData.userId) || {
        id: uData.userId,
        studioName: uData.studioName || 'Studio',
        cash: uData.cash || 5000,
        netWorth: uData.netWorth || 5000,
        followers: uData.followers || 0,
        gamesCount: uData.gamesCount || 0,
        lastActive: uData.updatedAt
      };

      existing.email = uData.email;
      existing.role = uData.role;
      existing.isBanned = !!uData.isBanned;
      existing.banReason = uData.banReason;
      if (uData.studioName) existing.studioName = uData.studioName;
      if (uData.cash !== undefined) existing.cash = uData.cash;
      if (uData.netWorth !== undefined) existing.netWorth = uData.netWorth;
      if (uData.followers !== undefined) existing.followers = uData.followers;
      if (uData.gamesCount !== undefined) existing.gamesCount = uData.gamesCount;

      map.set(uData.userId, existing);
    });
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

