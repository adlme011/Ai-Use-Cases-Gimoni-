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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setProfile({ uid: currentUser.uid, ...userDocSnap.data() } as UserProfile);
          } else {
            // Auto-provision initial user profile document in Firestore
            const isMeir = currentUser.email?.toLowerCase() === 'meir.adler@walkme.com';
            const defaultProfile: UserProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName || 'Unnamed User',
              email: currentUser.email || '',
              role: isMeir ? 'Leadership' : 'Solution Advisor'
            };
            await setDoc(userDocRef, defaultProfile);
            setProfile(defaultProfile);
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
          // Graceful runtime fallback
          const isMeir = currentUser.email?.toLowerCase() === 'meir.adler@walkme.com';
          setProfile({
            uid: currentUser.uid,
            name: currentUser.displayName || 'Unnamed User',
            email: currentUser.email || '',
            role: isMeir ? 'Leadership' : 'Solution Advisor'
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setUseCases([]);
      return;
    }

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
      console.log('Attempting login with popup...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Login successful:', result.user.email);
      toast.success('Successfully logged in');
    } catch (error: any) {
      console.error('Login error details:', error);
      toast.error(`Login failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 p-4 relative overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative w-full max-w-md bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-8 rounded-[32px] shadow-2xl flex flex-col items-center text-center">
          {/* Visual Logo Ring */}
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-6 relative">
            <div className="w-8 h-8 bg-white rounded-lg" />
            <div className="absolute -inset-1 border border-primary/20 rounded-2xl animate-pulse pointer-events-none" />
          </div>

          <h1 className="text-2xl font-black tracking-tight mb-2">AI SWAT Hub</h1>
          <p className="text-slate-400 text-sm mb-8 max-w-sm">
            Please authenticate using your Google account to view active accounts and collaborate on SWAT use cases.
          </p>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 font-bold px-6 py-4 rounded-2xl shadow-xl hover:shadow-white/5 transition-all active:scale-[0.98] group cursor-pointer"
          >
            {/* Google Vector Icon */}
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.137C18.237 1.7 15.534 1 12.24 1 6.16 1 1.25 5.926 1.25 12s4.91 11 10.99 11c6.35 0 10.57-4.47 10.57-10.77 0-.726-.077-1.284-.176-1.564H12.24z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-8 text-[9px] text-slate-500 font-mono tracking-wider uppercase">
            SECURE ACCESS SYSTEM • FIRESTORE ACTIVE
          </p>
        </div>
        <Toaster position="top-right" />
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
