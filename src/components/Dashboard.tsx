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
      color: 'bg-primary',
      description: 'Total accounts in scope'
    },
    { 
      label: 'Selected Accounts', 
      value: accounts.filter(a => a.status === 'Selected').length, 
      icon: Target, 
      color: 'bg-primary/80',
      description: 'Accounts aligned with Sales/CSM'
    },
    { 
      label: 'AI Use Cases', 
      value: useCases.length, 
      icon: Lightbulb, 
      color: 'bg-primary/60',
      description: 'Total identified opportunities'
    },
    { 
      label: 'Productized', 
      value: useCases.filter(u => u.status === 'Productized').length, 
      icon: CheckCircle2, 
      color: 'bg-primary/40',
      description: 'Ready for scale'
    }
  ];

  const regionStats = {
    US: accounts.filter(a => a.region === 'US').length,
    Europe: accounts.filter(a => a.region === 'Europe').length,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Initiative Overview</h2>
        <p className="text-slate-500 max-w-3xl leading-relaxed">
          Identify compelling AI use cases within our joint Joule + WalkMe customer base that demonstrate the combined value of both platforms — deepening strategic relationships, validating the AI roadmap, and building a library of proven use cases for broader GTM efforts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-600">{stat.label}</CardTitle>
                <div className={cn("p-2 rounded-lg text-white", stat.color)}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Regional Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-8 h-48 pt-8">
              <div className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-primary rounded-t-xl transition-all duration-500" 
                  style={{ height: `${(regionStats.US / 10) * 100}%` }}
                />
                <span className="text-sm font-medium text-slate-600">US (Alex & Olga)</span>
                <span className="text-xs text-slate-400">{regionStats.US} / 5 Target</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-primary/60 rounded-t-xl transition-all duration-500" 
                  style={{ height: `${(regionStats.Europe / 10) * 100}%` }}
                />
                <span className="text-sm font-medium text-slate-600">Europe (Steven & Mark)</span>
                <span className="text-xs text-slate-400">{regionStats.Europe} / 5 Target</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              SWAT Team Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <h4 className="text-sm font-semibold text-slate-900 mb-1">Product & R&D</h4>
              <p className="text-xs text-slate-600">Dedicated support for proof-of-feasibility efforts.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <h4 className="text-sm font-semibold text-slate-900 mb-1">Sales & CSM</h4>
              <p className="text-xs text-slate-600">Alignment on account selection and success criteria.</p>
            </div>
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
              <h4 className="text-sm font-semibold text-primary mb-1">Core Objective</h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                Identify compelling AI use cases within our joint Joule + WalkMe customer base that demonstrate the combined value of both platforms — deepening strategic relationships, validating the AI roadmap, and building a library of proven use cases for broader GTM efforts.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
