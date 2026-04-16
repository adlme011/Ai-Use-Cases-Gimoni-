import React, { useState } from 'react';
import { UseCase, Account, UserProfile } from '@/types';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Hero } from './Hero';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, Filter, ArrowRight, BarChart3, Layers, Code, Quote, Info, 
  ExternalLink, Copy, Bookmark, Sparkles, Loader2,
  Lightbulb, Pencil, Hammer, CheckCircle2, Rocket, TrendingUp, Download, 
  Plus, Clock, CheckCircle, Circle, X, User as UserIcon, Calendar, Trash2, Mail, Wand2
} from 'lucide-react';
import { generateImplementationPlan, generateSimilarUseCases, generateUseCaseFromPrompt } from '@/services/geminiService';
import Markdown from 'react-markdown';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface UseCaseListProps {
  useCases: UseCase[];
  accounts: Account[];
  profile: UserProfile | null;
}

export function UseCaseList({ useCases, accounts, profile }: UseCaseListProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUseCase, setEditingUseCase] = useState<UseCase | null>(null);
  const [formData, setFormData] = useState<Partial<UseCase>>({
    accountId: '',
    title: '',
    summary: '',
    description: '',
    problemStatement: '',
    solution: '',
    valueProposition: '',
    status: 'Idea',
    businessProblem: '',
    aiCapability: '',
    walkmeFeature: '',
    solutionAdvisor: '',
    userPersona: '',
    impactMetrics: '',
    jouleUsage: '',
    walkmeUsage: '',
    roiLevel: 'Medium',
    implementationEffort: 'Medium',
    useCaseType: 'Automation',
    businessFunction: 'Operations',
    realWorldExample: '',
    architectureDiagram: '',
    examplePrompt: '',
    tasks: [],
    demoPresented: false,
    recordingLink: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    function: 'all',
    roi: 'all',
    effort: 'all'
  });
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null);
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [similarIdeas, setSimilarIdeas] = useState<any[]>([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [showPrioritizer, setShowPrioritizer] = useState(false);
  const [prioritizationGoal, setPrioritizationGoal] = useState('all');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingFromPrompt, setIsGeneratingFromPrompt] = useState(false);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    toast.success(bookmarkedIds.includes(id) ? 'Removed from bookmarks' : 'Added to bookmarks');
  };

  const handleGeneratePlan = async () => {
    if (!selectedUseCase) return;
    setIsGeneratingPlan(true);
    try {
      const plan = await generateImplementationPlan(selectedUseCase);
      setAiPlan(plan || 'Failed to generate plan.');
    } catch (error) {
      toast.error('Failed to generate AI plan');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleGenerateIdeas = async () => {
    if (!selectedUseCase) return;
    setIsGeneratingIdeas(true);
    try {
      const ideas = await generateSimilarUseCases(selectedUseCase);
      setSimilarIdeas(ideas);
    } catch (error) {
      toast.error('Failed to generate similar ideas');
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const [newTask, setNewTask] = useState({ actionItem: '', owner: '', dueDate: '', status: 'Pending' as const });

  const addTask = () => {
    if (!newTask.actionItem) return;
    const tasks = formData.tasks || [];
    setFormData({
      ...formData,
      tasks: [...tasks, { ...newTask, id: Math.random().toString(36).substr(2, 9) }]
    });
    setNewTask({ actionItem: '', owner: '', dueDate: '', status: 'Pending' });
  };

  const removeTask = (id: string) => {
    setFormData({
      ...formData,
      tasks: (formData.tasks || []).filter(t => t.id !== id)
    });
  };

  const handleExport = () => {
    const headers = [
      'Customer Name', 'Region / Country', 'Account Owner / CSM', 'Department', 'POCs', 'Other AI Tools',
      'Use-Case Title', 'Stage', 'Use-Case Description', 'Business Problem / Pain', 
      'AI Capability Used', 'WalkMe Product / Feature Involved', 'Solution Advisor', 
      'User Persona', 'Impact Metrics', 'SAP Joule Usage', 'WalkMe AI Usage', 'Tasks', 'Demo Presented', 'Recording Link', 'Author', 'Created At'
    ];

    const rows = useCases.map(uc => {
      const account = accounts.find(a => a.id === uc.accountId);
      const tasksStr = (uc.tasks || []).map(t => `${t.actionItem} (${t.owner}, ${t.dueDate}, ${t.status})`).join(' | ');
      return [
        account?.name || uc.accountName || '',
        account?.region || '',
        account?.leads || '',
        account?.department || '',
        account?.pocs || '',
        account?.otherAiTools || '',
        uc.title || '',
        uc.status || '',
        (uc.description || '').replace(/\n/g, ' '),
        (uc.businessProblem || '').replace(/\n/g, ' '),
        uc.aiCapability || '',
        uc.walkmeFeature || '',
        uc.solutionAdvisor || '',
        uc.userPersona || '',
        (uc.impactMetrics || '').replace(/\n/g, ' '),
        (uc.jouleUsage || '').replace(/\n/g, ' '),
        (uc.walkmeUsage || '').replace(/\n/g, ' '),
        tasksStr,
        uc.demoPresented ? 'Yes' : 'No',
        uc.recordingLink || '',
        uc.authorName || '',
        uc.createdAt?.seconds ? format(new Date(uc.createdAt.seconds * 1000), 'yyyy-MM-dd') : ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `AI_SWAT_Initiative_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported to CSV successfully');
  };

  const walkmeOwners = [
    'Alex Lustig',
    'Mark Joseph',
    'Terry Dray',
    'Devin Simpson',
    'Gary Wong',
    'Jon Green',
    'Mike Granucci',
    'Craig Garfinkel',
    'Avi G',
    'Alex Loh',
    'Shachar Hess',
    'Katie Beech',
    'Benjamin Bertram',
    'Sara Eyal',
    'Steven',
    'Olga'
  ].sort();

  const aiCapabilities = [
    'Generative AI (LLMs)',
    'Chatbots / Conversational AI',
    'Natural Language Processing (NLP)',
    'Text Summarization / Extraction',
    'Sentiment Analysis',
    'Language Translation',
    'Image / Video Recognition',
    'Speech-to-Text / Text-to-Speech',
    'Predictive Analytics',
    'Recommendation Engines',
    'Anomaly Detection',
    'Classification / Tagging',
    'Process Automation (RPA/AI)',
    'Other'
  ];

  const walkmeFeatures = [
    'ActionBot',
    'Smart Walk-Thru',
    'SmartTips',
    'ShoutOuts',
    'Resources',
    'Menus',
    'Onboarding Task List',
    'Search',
    'Workstation',
    'DAP (Digital Adoption Platform)',
    'Other'
  ];

  const handleSave = async () => {
    if (!formData.accountId || !formData.title) {
      toast.error('Account and Title are required');
      return;
    }

    const account = accounts.find(a => a.id === formData.accountId);

    try {
      if (editingUseCase) {
        await updateDoc(doc(db, 'useCases', editingUseCase.id), {
          ...formData,
          accountName: account?.name,
        });
        toast.success('Use case updated');
      } else {
        await addDoc(collection(db, 'useCases'), {
          ...formData,
          accountName: account?.name,
          authorId: profile?.uid,
          authorName: profile?.name,
          createdAt: serverTimestamp(),
        });
        toast.success('Use case added');
      }
      setIsAddOpen(false);
      setEditingUseCase(null);
      setFormData({ 
        accountId: '', 
        title: '', 
        summary: '',
        description: '', 
        problemStatement: '',
        solution: '',
        valueProposition: '', 
        status: 'Idea', 
        businessProblem: '',
        aiCapability: '',
        walkmeFeature: '',
        solutionAdvisor: '',
        userPersona: '',
        impactMetrics: '',
        jouleUsage: '',
        walkmeUsage: '',
        roiLevel: 'Medium',
        implementationEffort: 'Medium',
        useCaseType: 'Automation',
        businessFunction: 'Operations',
        realWorldExample: '',
        architectureDiagram: '',
        examplePrompt: '',
        tasks: [],
        demoPresented: false,
        recordingLink: '',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'useCases');
    }
  };

  const handleGenerateFromPrompt = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a description of the use case');
      return;
    }

    setIsGeneratingFromPrompt(true);
    try {
      const generatedData = await generateUseCaseFromPrompt(aiPrompt);
      setFormData(prev => ({
        ...prev,
        ...generatedData
      }));
      toast.success('Use case drafted by AI! Review the fields below.');
    } catch (error) {
      toast.error('Failed to generate use case. Please try again.');
    } finally {
      setIsGeneratingFromPrompt(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this use case?')) return;
    try {
      await deleteDoc(doc(db, 'useCases', id));
      toast.success('Use case deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `useCases/${id}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Idea': return <Lightbulb className="w-4 h-4" />;
      case 'Draft': return <Pencil className="w-4 h-4" />;
      case 'Feasibility': return <Hammer className="w-4 h-4" />;
      case 'Validated': return <CheckCircle2 className="w-4 h-4" />;
      case 'Productized': return <Rocket className="w-4 h-4" />;
      case 'POC': return <TrendingUp className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Idea': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Draft': return 'bg-blue-50 text-primary border-primary/20';
      case 'Feasibility': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Validated': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Productized': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'POC': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const filteredUseCases = useCases.filter(uc => {
    const safeSearch = (searchQuery || '').toLowerCase();
    const matchesSearch = 
      (uc.title?.toLowerCase() || '').includes(safeSearch) ||
      (uc.summary?.toLowerCase() || '').includes(safeSearch) ||
      (uc.description?.toLowerCase() || '').includes(safeSearch) ||
      (uc.accountName?.toLowerCase() || '').includes(safeSearch);
    
    const matchesType = filters.type === 'all' ? true : filters.type === 'bookmarked' ? bookmarkedIds.includes(uc.id) : uc.useCaseType === filters.type;
    const matchesFunction = filters.function === 'all' || uc.businessFunction === filters.function;
    const matchesROI = filters.roi === 'all' || uc.roiLevel === filters.roi;
    const matchesEffort = filters.effort === 'all' || uc.implementationEffort === filters.effort;
    const matchesGoal = prioritizationGoal === 'all' || 
      (prioritizationGoal === 'efficiency' && uc.roiLevel === 'High' && uc.implementationEffort === 'Low') ||
      (prioritizationGoal === 'innovation' && uc.useCaseType === 'Content Generation') ||
      (prioritizationGoal === 'adoption' && uc.walkmeFeature === 'DAP');

    return matchesSearch && matchesType && matchesFunction && matchesROI && matchesEffort && matchesGoal;
  });

  const getROIColor = (roi: string) => {
    switch (roi) {
      case 'High': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'Medium': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'Experimental': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'Low': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'Medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'High': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <Hero />

      {/* Prioritization Wizard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 mb-12">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-black tracking-tight text-slate-900">Find Your Next AI Win</h3>
              <p className="text-slate-500 font-medium">Select your primary goal to see recommended use cases.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'all', label: 'All Cases', icon: Layers },
                { id: 'efficiency', label: 'Quick Wins', icon: Rocket },
                { id: 'innovation', label: 'GenAI Innovation', icon: Lightbulb },
                { id: 'adoption', label: 'Drive Adoption', icon: TrendingUp },
              ].map((goal) => (
                <Button
                  key={goal.id}
                  variant={prioritizationGoal === goal.id ? 'default' : 'outline'}
                  onClick={() => setPrioritizationGoal(goal.id)}
                  className="rounded-full px-6 gap-2 h-12 font-bold"
                >
                  <goal.icon className="w-4 h-4" />
                  {goal.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Sidebar Filters */}
        <aside className="lg:w-64 shrink-0 space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saved Items</label>
                <Button 
                  variant={filters.type === 'bookmarked' ? 'default' : 'outline'} 
                  className="w-full justify-start gap-2 rounded-xl h-11 font-bold"
                  onClick={() => setFilters({ ...filters, type: filters.type === 'bookmarked' ? 'all' : 'bookmarked' })}
                >
                  <Bookmark className={cn("w-4 h-4", filters.type === 'bookmarked' && "fill-current")} />
                  {bookmarkedIds.length} Bookmarked
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Use Case Type</label>
                <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                  <SelectTrigger className="bg-white border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Automation">Automation</SelectItem>
                    <SelectItem value="Content Generation">Content Generation</SelectItem>
                    <SelectItem value="Decision Support">Decision Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Business Function</label>
                <Select value={filters.function} onValueChange={(v) => setFilters({ ...filters, function: v })}>
                  <SelectTrigger className="bg-white border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Functions</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Customer Support">Customer Support</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">ROI Level</label>
                <Select value={filters.roi} onValueChange={(v) => setFilters({ ...filters, roi: v })}>
                  <SelectTrigger className="bg-white border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ROI</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Experimental">Experimental</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Implementation Effort</label>
                <Select value={filters.effort} onValueChange={(v) => setFilters({ ...filters, effort: v })}>
                  <SelectTrigger className="bg-white border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Effort</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-500 hover:text-slate-900"
            onClick={() => setFilters({ type: 'all', function: 'all', roi: 'all', effort: 'all' })}
          >
            Clear all filters
          </Button>
        </aside>

        {/* Main Catalog Area */}
        <div className="flex-1 space-y-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input 
                placeholder="Search by problem, tool, or outcome..." 
                className="pl-12 h-14 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="h-14 px-6 gap-2 rounded-2xl border-slate-200" onClick={handleExport}>
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger render={
                  <Button className="h-14 px-8 gap-2 rounded-2xl shadow-lg shadow-primary/20">
                    <Plus className="w-5 h-5" />
                    Add Use Case
                  </Button>
                } />
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingUseCase ? 'Edit Use Case' : 'Identify New AI Use Case'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              {!editingUseCase && (
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">AI Draft Assistant</span>
                  </div>
                  <p className="text-xs text-slate-500">Describe the use case in plain English and let AI fill in the details.</p>
                  <div className="flex gap-2">
                    <Textarea 
                      placeholder="e.g., A way to help HR managers automatically summarize candidate resumes using LLMs and show the summary in a WalkMe popup..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="text-sm bg-white border-primary/20 focus:ring-primary min-h-[80px]"
                    />
                    <Button 
                      size="icon"
                      className="h-auto w-12 shrink-0"
                      onClick={handleGenerateFromPrompt}
                      disabled={isGeneratingFromPrompt}
                    >
                      {isGeneratingFromPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Account</label>
                  <Select 
                    value={formData.accountId} 
                    onValueChange={(v) => {
                      const account = accounts.find(acc => acc.id === v);
                      setFormData({ 
                        ...formData, 
                        accountId: v,
                        solutionAdvisor: account?.leads || formData.solutionAdvisor
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account">
                        {accounts.find(acc => acc.id === formData.accountId)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stage</label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Idea">Idea</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="POC">POC</SelectItem>
                      <SelectItem value="Feasibility">Feasibility</SelectItem>
                      <SelectItem value="Validated">Validated</SelectItem>
                      <SelectItem value="Productized">Productized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Use-Case Title</label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Automated Expense Categorization"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">One-Line Summary</label>
                <Input 
                  value={formData.summary} 
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="A punchy 1-line summary for the card view"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Problem Statement (Before AI)</label>
                <Textarea 
                  value={formData.problemStatement} 
                  onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
                  placeholder="What is the current manual process or pain point?"
                  className="min-h-[60px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Solution (What AI Does)</label>
                <Textarea 
                  value={formData.solution} 
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  placeholder="How does AI solve this problem specifically?"
                  className="min-h-[60px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Detailed Description</label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Full technical or process details..."
                  className="min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Use Case Type</label>
                  <Select 
                    value={formData.useCaseType} 
                    onValueChange={(v: any) => setFormData({ ...formData, useCaseType: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Automation">Automation</SelectItem>
                      <SelectItem value="Content Generation">Content Generation</SelectItem>
                      <SelectItem value="Decision Support">Decision Support</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Function</label>
                  <Select 
                    value={formData.businessFunction} 
                    onValueChange={(v: any) => setFormData({ ...formData, businessFunction: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Customer Support">Customer Support</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">ROI Level</label>
                  <Select 
                    value={formData.roiLevel} 
                    onValueChange={(v: any) => setFormData({ ...formData, roiLevel: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Experimental">Experimental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Implementation Effort</label>
                  <Select 
                    value={formData.implementationEffort} 
                    onValueChange={(v: any) => setFormData({ ...formData, implementationEffort: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Real-World Example (Company/Workflow)</label>
                <Input 
                  value={formData.realWorldExample} 
                  onChange={(e) => setFormData({ ...formData, realWorldExample: e.target.value })}
                  placeholder="e.g., Used by X company for Y..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Example Prompt / Workflow</label>
                <Textarea 
                  value={formData.examplePrompt} 
                  onChange={(e) => setFormData({ ...formData, examplePrompt: e.target.value })}
                  placeholder="Paste a sample prompt or describe the workflow steps..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Architecture Diagram (Description/URL)</label>
                <Input 
                  value={formData.architectureDiagram} 
                  onChange={(e) => setFormData({ ...formData, architectureDiagram: e.target.value })}
                  placeholder="Describe the architecture or provide a diagram URL"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Business Problem / Pain</label>
                <Textarea 
                  value={formData.businessProblem} 
                  onChange={(e) => setFormData({ ...formData, businessProblem: e.target.value })}
                  placeholder="What is the core pain point being addressed?"
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">AI Capability Used</label>
                <Select 
                  value={aiCapabilities.includes(formData.aiCapability || '') ? formData.aiCapability : 'Other'} 
                  onValueChange={(v) => setFormData({ ...formData, aiCapability: v === 'Other' ? '' : v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select capability" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {aiCapabilities.map(cap => (
                      <SelectItem key={cap} value={cap}>{cap}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(!aiCapabilities.includes(formData.aiCapability || '') || formData.aiCapability === 'Other') && (
                  <Input 
                    className="mt-2"
                    value={formData.aiCapability} 
                    onChange={(e) => setFormData({ ...formData, aiCapability: e.target.value })}
                    placeholder="Specify custom capability"
                  />
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">WalkMe Product / Feature Involved</label>
                <Select 
                  value={walkmeFeatures.includes(formData.walkmeFeature || '') ? formData.walkmeFeature : 'Other'} 
                  onValueChange={(v) => setFormData({ ...formData, walkmeFeature: v === 'Other' ? '' : v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select WalkMe feature" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {walkmeFeatures.map(feat => (
                      <SelectItem key={feat} value={feat}>{feat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(!walkmeFeatures.includes(formData.walkmeFeature || '') || formData.walkmeFeature === 'Other') && (
                  <Input 
                    className="mt-2"
                    value={formData.walkmeFeature} 
                    onChange={(e) => setFormData({ ...formData, walkmeFeature: e.target.value })}
                    placeholder="Specify custom feature"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SAP Joule Usage</label>
                  <Textarea 
                    value={formData.jouleUsage} 
                    onChange={(e) => setFormData({ ...formData, jouleUsage: e.target.value })}
                    placeholder="How is SAP Joule being used?"
                    className="min-h-[60px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">WalkMe AI Usage</label>
                  <Textarea 
                    value={formData.walkmeUsage} 
                    onChange={(e) => setFormData({ ...formData, walkmeUsage: e.target.value })}
                    placeholder="How is WalkMe AI being used?"
                    className="min-h-[60px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Solution Advisor</label>
                  <Select 
                    value={walkmeOwners.includes(formData.solutionAdvisor || '') ? formData.solutionAdvisor : 'Other'} 
                    onValueChange={(v) => setFormData({ ...formData, solutionAdvisor: v === 'Other' ? '' : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select SA" />
                    </SelectTrigger>
                    <SelectContent>
                      {walkmeOwners.map(owner => (
                        <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                      ))}
                      <SelectItem value="Other">Add New SA...</SelectItem>
                    </SelectContent>
                  </Select>
                  {(!walkmeOwners.includes(formData.solutionAdvisor || '') || formData.solutionAdvisor === 'Other') && (
                    <Input 
                      className="mt-2"
                      value={formData.solutionAdvisor} 
                      onChange={(e) => setFormData({ ...formData, solutionAdvisor: e.target.value })}
                      placeholder="Enter SA Name"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">User Persona</label>
                  <Input 
                    value={formData.userPersona} 
                    onChange={(e) => setFormData({ ...formData, userPersona: e.target.value })}
                    placeholder="e.g., Internal (Finance), External"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Impact Metrics</label>
                <Textarea 
                  value={formData.impactMetrics} 
                  onChange={(e) => setFormData({ ...formData, impactMetrics: e.target.value })}
                  placeholder="What are the expected outcomes or success metrics?"
                  className="min-h-[60px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Joule + WalkMe Value Proposition</label>
                <Textarea 
                  value={formData.valueProposition} 
                  onChange={(e) => setFormData({ ...formData, valueProposition: e.target.value })}
                  placeholder="How do both platforms work together to deliver value?"
                  className="min-h-[80px]"
                />
              </div>

              {/* Task Manager Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Task Manager / Action Items
                  </h3>
                </div>
                
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="grid grid-cols-1 gap-3">
                    <Input 
                      placeholder="Action Item / Task"
                      value={newTask.actionItem}
                      onChange={(e) => setNewTask({ ...newTask, actionItem: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input 
                        placeholder="Owner"
                        value={newTask.owner}
                        onChange={(e) => setNewTask({ ...newTask, owner: e.target.value })}
                      />
                      <Input 
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select 
                        value={newTask.status}
                        onValueChange={(v: any) => setNewTask({ ...newTask, status: v })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button type="button" onClick={addTask} size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Task
                      </Button>
                    </div>
                  </div>

                  {formData.tasks && formData.tasks.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {formData.tasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm group">
                          <div className="flex items-center gap-3">
                            {task.status === 'Completed' ? (
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            ) : task.status === 'In Progress' ? (
                              <Clock className="w-4 h-4 text-amber-500" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-300" />
                            )}
                            <div>
                              <p className="text-xs font-bold text-slate-900">{task.actionItem}</p>
                              <p className="text-[10px] text-slate-500">
                                {task.owner} • {task.dueDate || 'No date'}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-slate-400 hover:text-red-500"
                            onClick={() => removeTask(task.id)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.demoPresented} 
                    onChange={(e) => setFormData({ ...formData, demoPresented: e.target.checked })}
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Demo Presented</span>
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Recording Link</label>
                <Input 
                  value={formData.recordingLink} 
                  onChange={(e) => setFormData({ ...formData, recordingLink: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Use Case</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredUseCases.length === 0 ? (
          <div className="col-span-full text-center py-32 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
            <div className="bg-slate-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lightbulb className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-lg font-medium">No matching use cases found.</p>
            <p className="text-sm">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          filteredUseCases.map((uc, i) => (
            <motion.div
              key={uc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group bg-white overflow-hidden h-full flex flex-col cursor-pointer relative" onClick={() => setSelectedUseCase(uc)}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute top-16 right-4 z-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all opacity-0 group-hover:opacity-100",
                    bookmarkedIds.includes(uc.id) ? "text-amber-500 opacity-100" : "text-slate-400"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(uc.id);
                  }}
                >
                  <Bookmark className={cn("w-4 h-4", bookmarkedIds.includes(uc.id) && "fill-current")} />
                </Button>
                <CardHeader className="pb-4 relative">
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-widest", getStatusColor(uc.status))}>
                      {uc.status}
                    </Badge>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={cn("text-[10px] font-bold", getROIColor(uc.roiLevel))}>
                        ROI: {uc.roiLevel}
                      </Badge>
                      <Badge variant="outline" className={cn("text-[10px] font-bold", getEffortColor(uc.implementationEffort))}>
                        {uc.implementationEffort} Effort
                      </Badge>
                    </div>
                  </div>
                  
                  <CardTitle className="text-xl font-black text-slate-900 leading-tight mb-2 group-hover:text-primary transition-colors">{uc.title}</CardTitle>
                  <p className="text-sm text-slate-500 font-medium line-clamp-2">{uc.summary || uc.description}</p>
                </CardHeader>

                <CardContent className="space-y-4 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <div className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase">
                      {uc.useCaseType}
                    </div>
                    <div className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase">
                      {uc.businessFunction}
                    </div>
                    {uc.aiCapability && (
                      <div className="px-2 py-1 bg-primary/5 rounded text-[10px] font-bold text-primary uppercase">
                        {uc.aiCapability}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                        <UserIcon className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{uc.authorName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <Calendar className="w-3 h-3" />
                      {uc.createdAt?.seconds ? format(new Date(uc.createdAt.seconds * 1000), 'MMM d') : 'Just now'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
        </div>
      </div>
    </div>

      {/* Deep Dive Dialog */}
      <Dialog open={!!selectedUseCase} onOpenChange={(open) => {
        if (!open) {
          setSelectedUseCase(null);
          setAiPlan(null);
          setSimilarIdeas([]);
        }
      }}>
        <DialogContent className="sm:max-w-[1000px] max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
          {selectedUseCase && (
            <>
              <div className="p-8 bg-slate-900 text-white relative">
                <div className="absolute top-4 right-12 flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                    onClick={() => {
                      setEditingUseCase(selectedUseCase);
                      setFormData(selectedUseCase);
                      setIsAddOpen(true);
                      setSelectedUseCase(null);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white/60 hover:text-red-400 hover:bg-red-400/10"
                    onClick={() => {
                      handleDelete(selectedUseCase.id);
                      setSelectedUseCase(null);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <Badge className={cn("border-none", getStatusColor(selectedUseCase.status))}>
                    {selectedUseCase.status}
                  </Badge>
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                    {selectedUseCase.useCaseType} • {selectedUseCase.businessFunction}
                  </span>
                </div>
                <h2 className="text-4xl font-black tracking-tight mb-4">{selectedUseCase.title}</h2>
                <p className="text-slate-400 text-lg font-medium max-w-2xl">{selectedUseCase.summary}</p>
              </div>

              <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-8 border-b border-slate-100 bg-white">
                  <TabsList className="bg-transparent h-14 p-0 gap-8">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 px-0 font-bold text-slate-500">Overview</TabsTrigger>
                    <TabsTrigger value="blueprint" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 px-0 font-bold text-slate-500">Blueprint</TabsTrigger>
                    <TabsTrigger value="ai-plan" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 px-0 font-bold text-slate-500 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      AI Implementation Plan
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 px-0 font-bold text-slate-500">Tasks</TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-8">
                    <TabsContent value="overview" className="m-0 space-y-12">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 space-y-12">
                          <section className="space-y-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                              <Info className="w-5 h-5 text-primary" />
                              Problem & Solution
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">The Problem</h4>
                                <p className="text-sm text-slate-700 leading-relaxed">{selectedUseCase.problemStatement || selectedUseCase.businessProblem || 'No problem statement provided.'}</p>
                              </div>
                              <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                                <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-2">The AI Solution</h4>
                                <p className="text-sm text-slate-700 leading-relaxed">{selectedUseCase.solution || selectedUseCase.description}</p>
                              </div>
                            </div>
                          </section>

                          {selectedUseCase.realWorldExample && (
                            <section className="space-y-4">
                              <h3 className="text-xl font-bold flex items-center gap-2">
                                <Quote className="w-5 h-5 text-emerald-500" />
                                Real-World Grounding
                              </h3>
                              <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 italic text-slate-700">
                                "{selectedUseCase.realWorldExample}"
                              </div>
                            </section>
                          )}

                          <section className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xl font-bold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-500" />
                                Similar Opportunities
                              </h3>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleGenerateIdeas}
                                disabled={isGeneratingIdeas}
                                className="gap-2"
                              >
                                {isGeneratingIdeas ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Explore More
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {similarIdeas.length > 0 ? (
                                similarIdeas.map((idea, idx) => (
                                  <div key={idx} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-primary/30 transition-all">
                                    <h4 className="font-bold text-sm mb-1">{idea.title}</h4>
                                    <p className="text-[10px] text-slate-500 mb-3 leading-tight">{idea.summary}</p>
                                    <div className="p-2 bg-slate-50 rounded text-[9px] text-slate-600 italic">
                                      {idea.reasoning}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-full text-center py-8 text-slate-400 text-sm italic">
                                  Click "Explore More" to generate similar ideas with AI.
                                </div>
                              )}
                            </div>
                          </section>
                        </div>

                        <div className="space-y-8">
                          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Decision Metrics</h4>
                            <div className="space-y-4">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">ROI Potential</p>
                                <Badge className={cn("w-full justify-center py-1.5", getROIColor(selectedUseCase.roiLevel))}>
                                  {selectedUseCase.roiLevel}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Implementation Effort</p>
                                <Badge className={cn("w-full justify-center py-1.5", getEffortColor(selectedUseCase.implementationEffort))}>
                                  {selectedUseCase.implementationEffort}
                                </Badge>
                              </div>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">AI Capability</p>
                                <p className="text-sm font-bold text-slate-900">{selectedUseCase.aiCapability || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">WalkMe Feature</p>
                                <p className="text-sm font-bold text-slate-900">{selectedUseCase.walkmeFeature || 'N/A'}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button className="w-full gap-2" onClick={() => {
                              const subject = encodeURIComponent(`AI Use Case: ${selectedUseCase.title}`);
                              const body = encodeURIComponent(`Check out this AI use case: ${selectedUseCase.title}\n\nSummary: ${selectedUseCase.summary}\n\nROI: ${selectedUseCase.roiLevel}`);
                              window.location.href = `mailto:?subject=${subject}&body=${body}`;
                            }}>
                              <Mail className="w-4 h-4" />
                              Share via Email
                            </Button>
                            <Button variant="outline" className="w-full gap-2" onClick={() => {
                              navigator.clipboard.writeText(window.location.href);
                              toast.success('Link copied to clipboard');
                            }}>
                              <Copy className="w-4 h-4" />
                              Copy Link
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="blueprint" className="m-0 space-y-8">
                      <div className="max-w-3xl space-y-8">
                        <section className="space-y-4">
                          <h3 className="text-xl font-bold">Architecture & Workflow</h3>
                          <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                            <p className="text-slate-700 leading-relaxed mb-8">{selectedUseCase.architectureDiagram || 'No architecture details provided.'}</p>
                            {selectedUseCase.examplePrompt && (
                              <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Example Prompt / Logic</h4>
                                <div className="relative group">
                                  <pre className="p-6 bg-slate-900 text-slate-300 rounded-2xl text-sm overflow-x-auto font-mono">
                                    {selectedUseCase.examplePrompt}
                                  </pre>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="absolute top-4 right-4 text-slate-500 hover:text-white"
                                    onClick={() => {
                                      navigator.clipboard.writeText(selectedUseCase.examplePrompt || '');
                                      toast.success('Prompt copied');
                                    }}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </section>
                      </div>
                    </TabsContent>

                    <TabsContent value="ai-plan" className="m-0 space-y-8">
                      <div className="max-w-3xl space-y-8">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold">Generated Implementation Plan</h3>
                          <Button 
                            onClick={handleGeneratePlan} 
                            disabled={isGeneratingPlan}
                            className="gap-2"
                          >
                            {isGeneratingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {aiPlan ? 'Regenerate Plan' : 'Generate Plan with AI'}
                          </Button>
                        </div>

                        {aiPlan ? (
                          <div className="prose prose-slate max-w-none p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
                            <Markdown>
                              {aiPlan}
                            </Markdown>
                          </div>
                        ) : (
                          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No plan generated yet.</p>
                            <p className="text-sm">Use Gemini to create a detailed technical blueprint for this use case.</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="tasks" className="m-0 space-y-8">
                      <div className="max-w-3xl space-y-6">
                        <h3 className="text-xl font-bold">Action Items & Timeline</h3>
                        {selectedUseCase.tasks && selectedUseCase.tasks.length > 0 ? (
                          <div className="space-y-4">
                            {selectedUseCase.tasks.map((task) => (
                              <div key={task.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-4">
                                  {task.status === 'Completed' ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                  ) : task.status === 'In Progress' ? (
                                    <Clock className="w-5 h-5 text-amber-500" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-slate-300" />
                                  )}
                                  <div>
                                    <p className="font-bold text-slate-900">{task.actionItem}</p>
                                    <div className="flex items-center gap-4 mt-1">
                                      <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                        <UserIcon className="w-3 h-3" />
                                        {task.owner || 'Unassigned'}
                                      </span>
                                      <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3" />
                                        {task.dueDate || 'No date'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <Badge variant="outline" className={cn(
                                  "font-black uppercase px-2 py-0.5 text-[10px]",
                                  task.status === 'Completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                  task.status === 'In Progress' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                  "bg-slate-100 text-slate-500 border-slate-200"
                                )}>
                                  {task.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400">
                            No tasks defined for this use case.
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
