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
import { Plus, Pencil, Trash2, MessageSquare, Rocket, Hammer, CheckCircle2, User as UserIcon, Calendar, Lightbulb, TrendingUp, Building2, Download, Video, Link as LinkIcon, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
    resources: '',
    scheduledActivity: '',
    responsibilities: '',
    demoPresented: false,
    recordingLink: '',
  });

  const handleExport = () => {
    const headers = [
      'Customer Name', 'Region / Country', 'Account Owner / CSM', 'Department', 'POCs', 'Other AI Tools',
      'Use-Case Title', 'Stage', 'Use-Case Description', 'Business Problem / Pain', 
      'AI Capability Used', 'WalkMe Product / Feature Involved', 'Solution Advisor', 
      'User Persona', 'Impact Metrics', 'SAP Joule Usage', 'WalkMe AI Usage', 'Resources', 'Demo Presented', 'Recording Link', 'Author', 'Created At'
    ];

    const rows = useCases.map(uc => {
      const account = accounts.find(a => a.id === uc.accountId);
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
        uc.resources,
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
        resources: '',
        scheduledActivity: '',
        responsibilities: '',
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">AI Capability Used</label>
                  <Select 
                    value={aiCapabilities.includes(formData.aiCapability || '') ? formData.aiCapability : 'Other'} 
                    onValueChange={(v) => setFormData({ ...formData, aiCapability: v === 'Other' ? '' : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select capability" />
                    </SelectTrigger>
                    <SelectContent>
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
                    value={formData.solutionAdvisor} 
                    onValueChange={(v) => setFormData({ ...formData, solutionAdvisor: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select SA" />
                    </SelectTrigger>
                    <SelectContent>
                      {walkmeOwners.map(owner => (
                        <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Resources & Feasibility (Product/R&D)</label>
                <Input 
                  value={formData.resources} 
                  onChange={(e) => setFormData({ ...formData, resources: e.target.value })}
                  placeholder="Assigned resources or feasibility notes"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Responsibilities</label>
                <Textarea 
                  value={formData.responsibilities} 
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  placeholder="Who is responsible for what?"
                  className="min-h-[60px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Scheduled Activity</label>
                <Textarea 
                  value={formData.scheduledActivity} 
                  onChange={(e) => setFormData({ ...formData, scheduledActivity: e.target.value })}
                  placeholder="Dates and descriptions for upcoming tasks or milestones"
                  className="min-h-[80px]"
                />
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
        {useCases.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500">
            <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No use cases identified yet. Start by adding one!</p>
          </div>
        ) : (
          useCases.map((uc) => (
            <Card key={uc.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all group">
              {(() => {
                const account = accounts.find(a => a.id === uc.accountId);
                return (
                  <>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <Badge className={cn("gap-1.5 px-2 py-0.5", getStatusColor(uc.status))}>
                          {getStatusIcon(uc.status)}
                          {uc.status}
                        </Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingUseCase(uc);
                                setFormData(uc);
                                setIsAddOpen(true);
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(uc.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        </div>
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-900">{uc.title}</CardTitle>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <CardDescription className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {uc.accountName || 'Unknown Account'}
                        </CardDescription>
                        {account?.department && (
                          <CardDescription className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {account.department}
                          </CardDescription>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        {account?.pocs && (
                          <div className="col-span-2 text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100">
                            <span className="font-semibold">POCs:</span> {account.pocs}
                          </div>
                        )}
                        
                        <div className="space-y-1 col-span-2">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</h4>
                          <p className="text-sm text-slate-600 line-clamp-3">{uc.description || 'No description provided.'}</p>
                        </div>

                        {uc.businessProblem && (
                          <div className="space-y-1 col-span-2">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Problem / Pain</h4>
                            <p className="text-sm text-slate-600 line-clamp-2">{uc.businessProblem}</p>
                          </div>
                        )}

                        <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Capability</h4>
                          <p className="text-xs text-slate-700 font-medium">{uc.aiCapability || 'N/A'}</p>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">WalkMe Feature</h4>
                          <p className="text-xs text-slate-700 font-medium">{uc.walkmeFeature || 'N/A'}</p>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Solution Advisor</h4>
                          <p className="text-xs text-slate-700 font-medium">{uc.solutionAdvisor || 'N/A'}</p>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">User Persona</h4>
                          <p className="text-xs text-slate-700 font-medium">{uc.userPersona || 'N/A'}</p>
                        </div>

                        {uc.jouleUsage && (
                          <div className="space-y-1 col-span-2 p-2 bg-blue-50/30 rounded border border-blue-100/50">
                            <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">SAP Joule Usage</h4>
                            <p className="text-xs text-slate-700">{uc.jouleUsage}</p>
                          </div>
                        )}

                        {uc.walkmeUsage && (
                          <div className="space-y-1 col-span-2 p-2 bg-indigo-50/30 rounded border border-indigo-100/50">
                            <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">WalkMe AI Usage</h4>
                            <p className="text-xs text-slate-700">{uc.walkmeUsage}</p>
                          </div>
                        )}
                      </div>
                      
                      {uc.impactMetrics && (
                        <div className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100">
                          <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Impact Metrics
                          </h4>
                          <p className="text-xs text-slate-700">{uc.impactMetrics}</p>
                        </div>
                      )}

                      {uc.valueProposition && (
                        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                          <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Rocket className="w-3 h-3" />
                            Combined Value
                          </h4>
                          <p className="text-sm text-slate-700 italic">"{uc.valueProposition}"</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-3">
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Responsibilities</h4>
                          <p className="text-xs text-slate-600 whitespace-pre-wrap">{uc.responsibilities || 'Not assigned'}</p>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Scheduled Activity</h4>
                          <p className="text-xs text-slate-600 whitespace-pre-wrap">{uc.scheduledActivity || 'None scheduled'}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {uc.demoPresented && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                            <Video className="w-3 h-3" />
                            Demo Presented
                          </Badge>
                        )}
                        {uc.recordingLink && (
                          <a 
                            href={uc.recordingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10"
                          >
                            <LinkIcon className="w-3 h-3" />
                            Recording
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 gap-2 text-xs h-8"
                          onClick={() => {
                            const subject = encodeURIComponent(`AI Use Case: ${uc.title}`);
                            const body = encodeURIComponent(`Hi,\n\nI'd like to discuss the AI Use Case "${uc.title}" for ${uc.accountName}.\n\nDescription: ${uc.description}\n\nResponsibilities: ${uc.responsibilities || 'N/A'}\nNext Activity: ${uc.scheduledActivity || 'N/A'}`);
                            window.location.href = `mailto:?subject=${subject}&body=${body}`;
                          }}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Email
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 gap-2 text-xs h-8"
                          onClick={() => {
                            const text = encodeURIComponent(`*AI Use Case Update: ${uc.title}*\nAccount: ${uc.accountName}\nResponsibilities: ${uc.responsibilities || 'N/A'}\nNext Activity: ${uc.scheduledActivity || 'N/A'}`);
                            window.open(`https://slack.com/app_redirect?channel=general&text=${text}`, '_blank');
                            toast.info('Opening Slack... You can paste the copied info into any channel.');
                          }}
                        >
                          <Users className="w-3.5 h-3.5" />
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
          ))
        )}
      </div>
    </div>
  );
}
