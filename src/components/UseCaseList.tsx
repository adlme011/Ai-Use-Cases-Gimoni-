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
import { Plus, Pencil, Trash2, MessageSquare, Rocket, Hammer, CheckCircle2, User as UserIcon, Calendar, Lightbulb, TrendingUp, Building2 } from 'lucide-react';
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
    resources: '',
  });

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
      setFormData({ accountId: '', title: '', description: '', valueProposition: '', status: 'Idea', resources: '' });
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
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Idea': return 'bg-slate-100 text-slate-600';
      case 'Draft': return 'bg-blue-100 text-blue-600';
      case 'Feasibility': return 'bg-amber-100 text-amber-600';
      case 'Validated': return 'bg-indigo-100 text-indigo-600';
      case 'Productized': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">AI Use Cases</h2>
          <p className="text-slate-500">Collaborate on Joule + WalkMe AI opportunities.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Use Case
            </Button>
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
                    onValueChange={(v) => setFormData({ ...formData, accountId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
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
                      <SelectItem value="Feasibility">Feasibility</SelectItem>
                      <SelectItem value="Validated">Validated</SelectItem>
                      <SelectItem value="Productized">Productized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Automated Expense Categorization"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is the use case? How does it work?"
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Joule + WalkMe Value Proposition</label>
                <Textarea 
                  value={formData.valueProposition} 
                  onChange={(e) => setFormData({ ...formData, valueProposition: e.target.value })}
                  placeholder="How do both platforms work together to deliver value?"
                  className="min-h-[100px]"
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Use Case</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge className={cn("gap-1.5 px-2 py-0.5", getStatusColor(uc.status))}>
                    {getStatusIcon(uc.status)}
                    {uc.status}
                  </Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(profile?.uid === uc.authorId || profile?.role === 'Leadership') && (
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
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900">{uc.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Building2 className="w-3 h-3" />
                  {uc.accountName || 'Unknown Account'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</h4>
                  <p className="text-sm text-slate-600 line-clamp-3">{uc.description || 'No description provided.'}</p>
                </div>
                
                {uc.valueProposition && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Combined Value
                    </h4>
                    <p className="text-sm text-slate-700 italic">"{uc.valueProposition}"</p>
                  </div>
                )}

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
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
