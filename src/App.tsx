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
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  const profile: UserProfile = {
    uid: 'guest',
    name: 'Guest User',
    email: 'guest@example.com',
    role: 'Leadership', // Give full access by default
  };

  useEffect(() => {
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
  }, []);

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

  return (
    <Layout 
      user={null} 
      profile={profile} 
      onLogout={() => {}} 
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
