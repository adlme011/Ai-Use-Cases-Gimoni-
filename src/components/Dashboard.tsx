import React from 'react';
import { Account, UseCase } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Lightbulb, CheckCircle2, Target, Users, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface DashboardProps {
  accounts: Account[];
  useCases: UseCase[];
}

export function Dashboard({ accounts, useCases }: DashboardProps) {
  const stats = [
    { 
      label: 'Target Accounts', 
      value: accounts.length, 
      icon: Building2, 
      gradient: 'from-blue-500 to-indigo-600',
      description: 'Total accounts in scope'
    },
    { 
      label: 'Selected', 
      value: accounts.filter(a => a.status === 'Selected').length, 
      icon: Target, 
      gradient: 'from-indigo-500 to-purple-600',
      description: 'Aligned with Sales/CSM'
    },
    { 
      label: 'AI Use Cases', 
      value: useCases.length, 
      icon: Lightbulb, 
      gradient: 'from-purple-500 to-pink-600',
      description: 'Identified opportunities'
    },
    { 
      label: 'Productized', 
      value: useCases.filter(u => u.status === 'Productized').length, 
      icon: CheckCircle2, 
      gradient: 'from-emerald-500 to-teal-600',
      description: 'Ready for scale'
    }
  ];

  const regionStats = {
    US: accounts.filter(a => a.region === 'US').length,
    Europe: accounts.filter(a => a.region === 'Europe').length,
  };

  return (
    <div className="space-y-10 p-2">
      <div className="flex flex-col gap-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full w-fit">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">SWAT Initiative Hub</span>
        </div>
        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
          Initiative <span className="text-gradient">Overview</span>
        </h2>
        <p className="text-slate-500 max-w-3xl leading-relaxed text-lg">
          Identify compelling AI use cases within our joint Joule + WalkMe customer base that demonstrate the combined value of both platforms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden group">
              <div className={cn("h-1 w-full bg-gradient-to-r", stat.gradient)} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</CardTitle>
                <div className={cn("p-2 rounded-xl text-white shadow-lg transition-transform group-hover:rotate-12 bg-gradient-to-br", stat.gradient)}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wide">{stat.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              Regional Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-12 h-64 pt-12 px-8">
              <div className="flex-1 flex flex-col items-center gap-4 group">
                <div className="relative w-full flex flex-col items-center justify-end h-full">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(regionStats.US / 10) * 100}%` }}
                    className="w-full max-w-[120px] bg-gradient-to-t from-primary to-indigo-400 rounded-2xl shadow-lg shadow-primary/20 relative group-hover:brightness-110 transition-all"
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {regionStats.US} Accounts
                    </div>
                  </motion.div>
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-slate-900 block">US Region</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Alex Lustig</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center gap-4 group">
                <div className="relative w-full flex flex-col items-center justify-end h-full">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(regionStats.Europe / 10) * 100}%` }}
                    className="w-full max-w-[120px] bg-gradient-to-t from-indigo-500 to-purple-400 rounded-2xl shadow-lg shadow-indigo-500/20 relative group-hover:brightness-110 transition-all"
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {regionStats.Europe} Accounts
                    </div>
                  </motion.div>
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-slate-900 block">Europe Region</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Mark Joseph</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-200/50 bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -mr-16 -mt-16" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-white/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              SWAT Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Product & R&D</h4>
                  <p className="text-sm text-slate-300">Dedicated support for proof-of-feasibility efforts.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Sales & CSM</h4>
                  <p className="text-sm text-slate-300">Alignment on account selection and success criteria.</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Core Objective</h4>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                "Identify compelling AI use cases that demonstrate combined value, deepening strategic relationships and building a library of proven successes."
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
