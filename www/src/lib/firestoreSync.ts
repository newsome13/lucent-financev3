import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { FinanceData } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// --- ERROR HANDLING SPECS ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- CLOUD SYNC FUNCTIONS ---

// 1. Ledger Backup & Restore
export async function saveLedgerToFirestore(userId: string, data: FinanceData): Promise<void> {
  const path = `users/${userId}/data/ledger`;
  try {
    const docRef = doc(db, 'users', userId, 'data', 'ledger');
    await setDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadLedgerFromFirestore(userId: string): Promise<FinanceData | null> {
  const path = `users/${userId}/data/ledger`;
  try {
    const docRef = doc(db, 'users', userId, 'data', 'ledger');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return data as FinanceData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// 2. Preferences
export async function savePreferencesToFirestore(
  userId: string, 
  showActualName: boolean, 
  onboarded: boolean, 
  isDemoMode: boolean
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, {
      showActualName,
      onboarded,
      isDemoMode,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadPreferencesFromFirestore(
  userId: string
): Promise<{ showActualName: boolean; onboarded: boolean; isDemoMode: boolean } | null> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        showActualName: data.showActualName ?? false,
        onboarded: data.onboarded ?? false,
        isDemoMode: data.isDemoMode ?? false
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// 3. Complete Data Purge
export async function deleteUserDataFromFirestore(userId: string): Promise<void> {
  const ledgerPath = `users/${userId}/data/ledger`;
  const prefsPath = `users/${userId}`;
  const profilePath = `community_profiles/${userId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'data', 'ledger'));
    await deleteDoc(doc(db, 'users', userId));
    await deleteDoc(doc(db, 'community_profiles', userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${prefsPath} and ${ledgerPath}`);
  }
}

// 4. Community Profiles (Optional Opt-In Accountability Profiles)
export interface CommunityProfile {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string;
  level: number;
  xp: number;
  lifetimeXp: number;
  weeklyXp: number;
  monthlyXp: number;
  selectedTitle: string;
  unlockedTitles: string[];
  streakCount: number;
  earnedBadges: string[];
  pinnedBadges: string[];
  optedIn: boolean;
  updatedAt: string;
}

export async function saveCommunityProfileToFirestore(userId: string, profile: Partial<CommunityProfile>): Promise<void> {
  const path = `community_profiles/${userId}`;
  try {
    const docRef = doc(db, 'community_profiles', userId);
    await setDoc(docRef, {
      ...profile,
      uid: userId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadCommunityProfileFromFirestore(userId: string): Promise<CommunityProfile | null> {
  const path = `community_profiles/${userId}`;
  try {
    const docRef = doc(db, 'community_profiles', userId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as CommunityProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// 5. Live Community Posts
export interface DbCommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorTitle: string;
  authorLevel: number;
  content: string;
  achievementType: string;
  badgeId: string | null;
  timestamp: string;
  likes: string[];
  commentsCount: number;
}

export async function fetchLiveCommunityPosts(): Promise<DbCommunityPost[]> {
  const path = `community_posts`;
  try {
    const q = query(collection(db, 'community_posts'), orderBy('timestamp', 'desc'), limit(40));
    const querySnapshot = await getDocs(q);
    const posts: DbCommunityPost[] = [];
    querySnapshot.forEach((doc) => {
      posts.push(doc.data() as DbCommunityPost);
    });
    return posts;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createLiveCommunityPost(post: DbCommunityPost): Promise<void> {
  const path = `community_posts/${post.id}`;
  try {
    await setDoc(doc(db, 'community_posts', post.id), post);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function likeLiveCommunityPost(postId: string, userId: string, isLiking: boolean): Promise<void> {
  const path = `community_posts/${postId}`;
  try {
    const docRef = doc(db, 'community_posts', postId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as DbCommunityPost;
      let nextLikes = data.likes || [];
      if (isLiking) {
        if (!nextLikes.includes(userId)) {
          nextLikes.push(userId);
        }
      } else {
        nextLikes = nextLikes.filter(id => id !== userId);
      }
      await updateDoc(docRef, { likes: nextLikes });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
