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

// Use the specific database ID from the config
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
  try {
    // We use getDocFromServer to force a network request and bypass cache
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline')) {
        console.error("Firebase Connection Error: The client is offline. Please check your Firebase configuration and internet connection.");
      } else if (error.message.includes('permission-denied')) {
        // This is expected if the user is not logged in, as the rule requires authentication
        console.log("Firebase Connection: SDK initialized. (Authentication required for data access)");
      } else {
        console.error("Firebase Connection Error:", error.message);
      }
    }
  }
}
testConnection();

export type { FirebaseUser };
