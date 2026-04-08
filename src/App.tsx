import React, { useState, useEffect } from 'react';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { UserProfile, Account, UseCase } from '@/types';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/components/Dashboard';
import { AccountList } from '@/components/AccountList';
import { UseCaseList } from '@/components/UseCaseList';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setProfile({ uid: firebaseUser.uid, ...userDoc.data() } as UserProfile);
          } else {
            // New user, default to Solution Advisor
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Anonymous',
              email: firebaseUser.email || '',
              role: 'Solution Advisor',
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              name: newProfile.name,
              email: newProfile.email,
              role: newProfile.role,
            });
            setProfile(newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const qAccounts = query(collection(db, 'accounts'), orderBy('name'));
    const unsubAccounts = onSnapshot(qAccounts, (snapshot) => {
      const accs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
      setAccounts(accs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'accounts'));

    const qUseCases = query(collection(db, 'useCases'), orderBy('createdAt', 'desc'));
    const unsubUseCases = onSnapshot(qUseCases, (snapshot) => {
      const ucs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UseCase));
      setUseCases(ucs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'useCases'));

    return () => {
      unsubAccounts();
      unsubUseCases();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Successfully logged in');
    } catch (error) {
      toast.error('Login failed');
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 bg-primary rounded-lg" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">AI SWAT Initiative</h1>
          <p className="text-slate-600 mb-8">
            Collaborative platform for Joule & WalkMe AI use case identification and development.
          </p>
          <button
            onClick={handleLogin}
            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      user={user} 
      profile={profile} 
      onLogout={handleLogout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard accounts={accounts} useCases={useCases} />
        )}
        {activeTab === 'accounts' && (
          <AccountList accounts={accounts} isAdmin={profile?.role === 'Leadership'} />
        )}
        {activeTab === 'usecases' && (
          <UseCaseList 
            useCases={useCases} 
            accounts={accounts} 
            profile={profile} 
          />
        )}
      </div>
      <Toaster position="top-right" />
    </Layout>
  );
}
