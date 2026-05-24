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

// Export standard Firestore instance
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

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

  // Helper to test if database is active
  async function checkDbConnection(): Promise<boolean> {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
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
    const isOk = await checkDbConnection();
    if (isOk) {
      console.log("Firebase Connection: SDK initialized successfully.");
      return;
    }

    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  // If failed, log a warning
  console.warn("Firebase Connection Warning: Default connection check timed out. Operating in fallback cache mode.");
}
testConnection();

export type { FirebaseUser };
