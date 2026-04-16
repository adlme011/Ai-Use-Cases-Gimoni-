import React from 'react';
import { motion } from 'motion/react';
import { Rocket, Target, Zap, Users } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-900 text-white py-20 px-8 rounded-3xl mb-12">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">
            <Zap className="w-3 h-3" />
            Actionable AI Insights
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6 leading-[0.9]">
            Discover & Prioritize <br />
            <span className="text-primary">High-Impact AI</span> Use Cases
          </h1>
          
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto font-medium">
            For product managers, founders, and teams exploring AI opportunities. 
            Browse real-world implementation patterns with ROI analysis and technical blueprints.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <Users className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-bold text-white mb-2">Who it's for</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Strategic leaders and builders looking to bridge the gap between AI theory and production.
              </p>
            </div>
            
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <Target className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="font-bold text-white mb-2">What you get</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                100+ real-world use cases with ROI metrics, implementation difficulty, and tool stacks.
              </p>
            </div>
            
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <Rocket className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="font-bold text-white mb-2">Why it's different</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Actionable blueprints, not just abstract ideas. Focus on problem-solution-impact.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
