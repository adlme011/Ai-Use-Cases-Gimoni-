import React from 'react';
import { UserProfile } from '@/types';
import { FirebaseUser } from '@/lib/firebase';
import { LogOut, LayoutDashboard, Building2, Lightbulb, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  user: FirebaseUser;
  profile: UserProfile | null;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Layout({ children, user, profile, onLogout, activeTab, setActiveTab }: LayoutProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Target Accounts', icon: Building2 },
    { id: 'usecases', label: 'AI Use Cases', icon: Lightbulb },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-bottom border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm" />
              </div>
              <span className="font-bold text-xl text-slate-900 hidden sm:block">AI SWAT Hub</span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                    activeTab === item.id 
                      ? "bg-primary/10 text-primary" 
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-100 rounded-full">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-3 h-3 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-900 leading-none">{profile?.name}</span>
                  <span className="text-[10px] text-slate-500 leading-none mt-0.5">{profile?.role}</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-around z-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
              activeTab === item.id ? "text-primary" : "text-slate-500"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
