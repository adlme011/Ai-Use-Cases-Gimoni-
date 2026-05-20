import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import firebaseConfigImport from '../../firebase-applet-config.json';

// Fallback to environment variables if the config file is missing or contains placeholders
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigImport.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigImport.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigImport.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigImport.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigImport.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigImport.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigImport.firestoreDatabaseId || '(default)'
};

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Dynamic DB allocation using a Proxy for resilience
let activeDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const db = new Proxy({}, {
  get(target, prop) {
    const value = Reflect.get(activeDb, prop);
    if (typeof value === 'function') {
      return value.bind(activeDb);
    }
    return value;
  }
}) as ReturnType<typeof getFirestore>;

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error Handling Utility
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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection
async function testConnection() {
  const maxRetries = 3;
  const retryDelay = 1500; // ms

  // Helper to test if a specific database is accessible
  async function checkDbConnection(databaseInstance: typeof activeDb): Promise<boolean> {
    try {
      await getDocFromServer(doc(databaseInstance, 'test', 'connection'));
      return true; // Succeeded!
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          // This is expected and means the Firestore is online and reached (rules block unauthenticated doc check)
          return true; 
        }
      }
      return false; // Failed/Offline
    }
  }

  // First, wait a moment for the Firestore client socket to start up asynchronously 
  await new Promise(resolve => setTimeout(resolve, 800));

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const isOk = await checkDbConnection(activeDb);
    if (isOk) {
      console.log("Firebase Connection: SDK initialized successfully.");
      return;
    }
    
    // If it failed and we are using a custom database, try fallback to (default)
    if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
      console.warn(`Custom database connection failed, testing default database fallback (attempt ${attempt})...`);
      const fallbackDb = getFirestore(app, '(default)');
      const fallbackOk = await checkDbConnection(fallbackDb);
      if (fallbackOk) {
        console.log("Firebase Connection: Switched to fallback '(default)' database.");
        activeDb = fallbackDb;
        return;
      }
    }

    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  // If both failed after all retries, log a gentle warning to avoid blocking UI checks and active application
  console.warn("Firebase Connection Warning: Default connection check timed out. Operating in offline/resilient cache mode.");
}
testConnection();

export type { FirebaseUser };
