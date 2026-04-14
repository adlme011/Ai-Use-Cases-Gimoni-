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
import { Plus, Pencil, Trash2, MessageSquare, Rocket, Hammer, CheckCircle2, User as UserIcon, Calendar, Lightbulb, TrendingUp, Building2, Download, Video, Link as LinkIcon, Users, Mail, CheckCircle, Circle, Clock, X } from 'lucide-react';
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
    description: '',
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
    tasks: [],
    demoPresented: false,
    recordingLink: '',
  });

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
        uc.title,
        uc.status,
        uc.description.replace(/\n/g, ' '),
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
        uc.authorName,
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
    'Conversation / Chatbot',
    'LM / Generative AI',
    'Recommendations / Next Best Action',
    'Classification / Tagging',
    'Extraction / Summarization',
    'Translation',
    'Sentiment Analysis',
    'Image Recognition / Computer Vision',
    'Speech to Text / Audio Transcription',
    'Predictive Analytics / Forecasting',
    'Personalization / Content Generation',
    'Anomaly Detection',
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
        description: '', 
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
        tasks: [],
        demoPresented: false,
        recordingLink: '',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'useCases');
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">AI Use Cases</h2>
          <p className="text-slate-500">Collaborate on Joule + WalkMe AI opportunities.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export Data
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={<Button className="gap-2" />}>
              <Plus className="w-4 h-4" />
              New Use Case
            </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingUseCase ? 'Edit Use Case' : 'Identify New AI Use Case'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
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
                <label className="text-sm font-medium">Use-Case Description</label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is the use case? How does it work?"
                  className="min-h-[80px]"
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
                <Input 
                  value={formData.walkmeFeature} 
                  onChange={(e) => setFormData({ ...formData, walkmeFeature: e.target.value })}
                  placeholder="e.g., Action Bar, SmartTips"
                />
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {useCases.length === 0 ? (
          <div className="col-span-full text-center py-32 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
            <div className="bg-slate-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lightbulb className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-lg font-medium">No use cases identified yet.</p>
            <p className="text-sm">Start by adding one to the hub!</p>
          </div>
        ) : (
          useCases.map((uc, i) => (
            <motion.div
              key={uc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-primary/5 transition-all group bg-white/80 backdrop-blur-sm overflow-hidden h-full flex flex-col">
                {(() => {
                  const account = accounts.find(a => a.id === uc.accountId);
                  return (
                    <>
                      <CardHeader className="pb-4 relative">
                        <div className="absolute top-0 right-0 p-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                            onClick={() => {
                              setEditingUseCase(uc);
                              setFormData(uc);
                              setIsAddOpen(true);
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(uc.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        <div className="flex justify-between items-start mb-4">
                          <Badge className={cn("gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm", getStatusColor(uc.status))}>
                            {getStatusIcon(uc.status)}
                            {uc.status}
                          </Badge>
                        </div>
                        
                        <CardTitle className="text-xl font-black text-slate-900 leading-tight mb-2">{uc.title}</CardTitle>
                        
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                            <Building2 className="w-3 h-3" />
                            {uc.accountName || 'Unknown Account'}
                          </div>
                          {account?.department && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/5 rounded-lg text-[10px] font-bold text-primary uppercase tracking-tight">
                              <Users className="w-3 h-3" />
                              {account.department}
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-6 flex-1">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5 col-span-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</h4>
                            <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{uc.description || 'No description provided.'}</p>
                          </div>

                          {uc.businessProblem && (
                            <div className="space-y-1.5 col-span-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Problem / Pain</h4>
                              <p className="text-sm text-slate-700 font-medium leading-snug">{uc.businessProblem}</p>
                            </div>
                          )}

                          <div className="space-y-1">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Capability</h4>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                              <p className="text-xs text-slate-900 font-bold">{uc.aiCapability || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WalkMe Feature</h4>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                              <p className="text-xs text-slate-900 font-bold">{uc.walkmeFeature || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solution Advisor</h4>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500">
                                {uc.solutionAdvisor?.split(' ').map(n => n[0]).join('') || '??'}
                              </div>
                              <p className="text-xs text-slate-900 font-bold">{uc.solutionAdvisor || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User Persona</h4>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                              <p className="text-xs text-slate-900 font-bold">{uc.userPersona || 'N/A'}</p>
                            </div>
                          </div>

                          {uc.jouleUsage && (
                            <div className="space-y-1.5 col-span-2 p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                              <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                SAP Joule Usage
                              </h4>
                              <p className="text-xs text-slate-700 font-medium leading-relaxed">{uc.jouleUsage}</p>
                            </div>
                          )}

                          {uc.walkmeUsage && (
                            <div className="space-y-1.5 col-span-2 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                WalkMe AI Usage
                              </h4>
                              <p className="text-xs text-slate-700 font-medium leading-relaxed">{uc.walkmeUsage}</p>
                            </div>
                          )}
                        </div>
                        
                        {uc.impactMetrics && (
                          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5" />
                              Impact Metrics
                            </h4>
                            <p className="text-xs text-slate-700 font-semibold leading-relaxed">{uc.impactMetrics}</p>
                          </div>
                        )}

                        {uc.valueProposition && (
                          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 relative overflow-hidden">
                            <Rocket className="absolute -right-2 -bottom-2 w-16 h-16 text-primary/5 -rotate-12" />
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <Rocket className="w-3.5 h-3.5" />
                              Combined Value
                            </h4>
                            <p className="text-sm text-slate-700 italic font-medium leading-relaxed">"{uc.valueProposition}"</p>
                          </div>
                        )}

                        {/* Tasks Display */}
                        {uc.tasks && uc.tasks.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              Action Items & Timeline
                            </h4>
                            <div className="space-y-2">
                              {uc.tasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
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
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                          <UserIcon className="w-2.5 h-2.5" />
                                          {task.owner || 'Unassigned'}
                                        </span>
                                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                          <Calendar className="w-2.5 h-2.5" />
                                          {task.dueDate || 'No date'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className={cn(
                                    "text-[8px] font-black uppercase px-1.5 py-0",
                                    task.status === 'Completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                    task.status === 'In Progress' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                    "bg-slate-100 text-slate-500 border-slate-200"
                                  )}>
                                    {task.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-2">
                          {uc.demoPresented && (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-tight">
                              <Video className="w-3 h-3" />
                              Demo Presented
                            </Badge>
                          )}
                          {uc.recordingLink && (
                            <a 
                              href={uc.recordingLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight text-primary hover:text-primary/80 bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10 transition-colors"
                            >
                              <LinkIcon className="w-3 h-3" />
                              Recording
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 gap-2 text-[10px] font-black uppercase tracking-widest h-9 rounded-xl border-slate-200 hover:bg-slate-50"
                            onClick={() => {
                              const subject = encodeURIComponent(`AI Use Case: ${uc.title}`);
                              const body = encodeURIComponent(`Hi,\n\nI'd like to discuss the AI Use Case "${uc.title}" for ${uc.accountName}.\n\nDescription: ${uc.description}`);
                              window.location.href = `mailto:?subject=${subject}&body=${body}`;
                            }}
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Email
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 gap-2 text-[10px] font-black uppercase tracking-widest h-9 rounded-xl border-slate-200 hover:bg-slate-50"
                            onClick={() => {
                              const text = encodeURIComponent(`*AI Use Case Update: ${uc.title}*\nAccount: ${uc.accountName}`);
                              window.open(`https://slack.com/app_redirect?channel=general&text=${text}`, '_blank');
                              toast.info('Opening Slack... You can paste the copied info into any channel.');
                            }}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Slack
                          </Button>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                              <UserIcon className="w-3 h-3 text-slate-500" />
                            </div>
                            <span className="text-xs text-slate-500">{uc.authorName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {uc.createdAt?.seconds ? format(new Date(uc.createdAt.seconds * 1000), 'MMM d, yyyy') : 'Just now'}
                          </div>
                        </div>
                      </CardContent>
                    </>
                  );
                })()}
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
