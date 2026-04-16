import React, { useState } from 'react';
import { Account } from '@/types';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, Pencil, Trash2, Globe, User, CheckCircle2, XCircle, Building2, 
  Users, Info, Settings, Layout, ArrowRight, X, Mail, Phone, Briefcase, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface AccountListProps {
  accounts: Account[];
  isAdmin: boolean;
}

export function AccountList({ accounts, isAdmin }: AccountListProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isFormView, setIsFormView] = useState(false);
  const [formData, setFormData] = useState<Partial<Account>>({
    name: '',
    region: 'US',
    leads: '',
    status: 'Target',
    jouleDeployed: false,
    walkMeDeployed: false,
    pocs: '',
    department: '',
    otherAiTools: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      region: 'US',
      leads: '',
      status: 'Target',
      jouleDeployed: false,
      walkMeDeployed: false,
      pocs: '',
      department: '',
      otherAiTools: '',
    });
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Account name is required');
      return;
    }

    try {
      if (editingAccount) {
        await updateDoc(doc(db, 'accounts', editingAccount.id), formData);
        toast.success('Account updated');
      } else {
        await addDoc(collection(db, 'accounts'), formData);
        toast.success('Account added');
      }
      setIsAddOpen(false);
      setEditingAccount(null);
      setSelectedAccount(null);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'accounts');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      await deleteDoc(doc(db, 'accounts', id));
      toast.success('Account deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `accounts/${id}`);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Target Accounts</h2>
          <p className="text-slate-500">Manage the target accounts for the SWAT initiative.</p>
        </div>
        <Button 
          className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl px-6 h-11 font-bold"
          onClick={() => {
            resetForm();
            setIsAddOpen(true);
            setIsFormView(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Add Account
        </Button>
        <Dialog open={isAddOpen || !!selectedAccount} onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setSelectedAccount(null);
            setEditingAccount(null);
            setIsFormView(false);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-[1000px] p-0 overflow-hidden border-none rounded-[32px] shadow-2xl">
            <div className="bg-slate-900 p-8 text-white relative">
              <div className="flex justify-between items-start pr-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                      <Building2 className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-white/20 text-white/60 mb-1">
                        {formData.status || 'Draft'}
                      </Badge>
                      <h2 className="text-3xl font-black tracking-tight leading-none">
                        {isFormView || isAddOpen ? (editingAccount ? 'Edit Account' : 'Add New Account') : selectedAccount?.name}
                      </h2>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isFormView && selectedAccount && isAdmin && (
                    <Button 
                      variant="outline" 
                      className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl font-bold"
                      onClick={() => {
                        setIsFormView(true);
                        setEditingAccount(selectedAccount);
                        setFormData(selectedAccount);
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white/40 hover:text-white hover:bg-white/10 rounded-full"
                    onClick={() => {
                      setIsAddOpen(false);
                      setSelectedAccount(null);
                      setIsFormView(false);
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <div className="px-8 border-b border-slate-100 bg-white sticky top-0 z-10">
                <TabsList className="h-16 bg-transparent gap-8">
                  <TabsTrigger value="overview" className="h-16 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-0">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="details" className="h-16 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-0">
                    Account Details
                  </TabsTrigger>
                  <TabsTrigger value="ai-tools" className="h-16 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-0">
                    AI Landscape
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="h-[60vh]">
                <div className="p-8">
                  <TabsContent value="overview" className="mt-0 space-y-8">
                    {isFormView || isAddOpen ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <section className="space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <Info className="w-4 h-4" />
                              Basic Information
                            </h3>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 ml-1">Account Name</Label>
                                <Input 
                                  value={formData.name} 
                                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                  placeholder="e.g., SAP SE"
                                  className="bg-slate-50 border-slate-200 rounded-xl h-12 font-medium"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-xs font-bold text-slate-500 ml-1">Region</Label>
                                  <Select 
                                    value={formData.region} 
                                    onValueChange={(v: any) => setFormData({ ...formData, region: v, leads: v === 'US' ? 'Alex Lustig' : 'Mark Joseph' })}
                                  >
                                    <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-12">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="US">US</SelectItem>
                                      <SelectItem value="Europe">Europe</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs font-bold text-slate-500 ml-1">Status</Label>
                                  <Select 
                                    value={formData.status} 
                                    onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                                  >
                                    <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-12">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Target">Target</SelectItem>
                                      <SelectItem value="Selected">Selected</SelectItem>
                                      <SelectItem value="Active">Active</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </section>
                        </div>

                        <div className="space-y-6">
                          <section className="space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                              <Settings className="w-4 h-4" />
                              Deployment Status
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                    <Briefcase className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900">SAP Joule</p>
                                    <p className="text-[10px] text-slate-500">Is Joule currently deployed?</p>
                                  </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={formData.jouleDeployed} 
                                    onChange={(e) => setFormData({ ...formData, jouleDeployed: e.target.checked })}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                </label>
                              </div>

                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                    <Layout className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900">WalkMe</p>
                                    <p className="text-[10px] text-slate-500">Is WalkMe currently deployed?</p>
                                  </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={formData.walkMeDeployed} 
                                    onChange={(e) => setFormData({ ...formData, walkMeDeployed: e.target.checked })}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                </label>
                              </div>
                            </div>
                          </section>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Region</p>
                              <p className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-primary" />
                                {selectedAccount?.region}
                              </p>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                              <Badge className={cn(
                                "text-xs font-bold px-3 py-1 rounded-full",
                                selectedAccount?.status === 'Active' ? 'bg-emerald-500' : 
                                selectedAccount?.status === 'Selected' ? 'bg-amber-500' : 'bg-slate-400'
                              )}>
                                {selectedAccount?.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                              <Users className="w-5 h-5 text-primary" />
                              Account Ownership
                            </h3>
                            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex items-center gap-4">
                              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-xl font-black text-primary">
                                {selectedAccount?.leads.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="text-sm text-slate-500 font-medium">Account Lead / CSM</p>
                                <p className="text-2xl font-bold text-slate-900">{selectedAccount?.leads}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="p-6 bg-slate-900 rounded-3xl text-white space-y-6">
                            <h4 className="font-bold flex items-center gap-2">
                              <Settings className="w-4 h-4 text-primary" />
                              Tech Stack
                            </h4>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-white/60">SAP Joule</span>
                                {selectedAccount?.jouleDeployed ? 
                                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Deployed</Badge> : 
                                  <Badge variant="outline" className="text-white/20 border-white/10">Not Deployed</Badge>
                                }
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-white/60">WalkMe</span>
                                {selectedAccount?.walkMeDeployed ? 
                                  <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">Deployed</Badge> : 
                                  <Badge variant="outline" className="text-white/20 border-white/10">Not Deployed</Badge>
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="details" className="mt-0 space-y-8">
                    {isFormView || isAddOpen ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 ml-1">Department / Business Unit</Label>
                            <Input 
                              value={formData.department} 
                              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                              placeholder="e.g., HR, Sales, IT"
                              className="bg-slate-50 border-slate-200 rounded-xl h-12 font-medium"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 ml-1">Account Lead / CSM</Label>
                            <Select 
                              value={formData.leads} 
                              onValueChange={(v) => setFormData({ ...formData, leads: v })}
                            >
                              <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-12">
                                <SelectValue placeholder="Select owner" />
                              </SelectTrigger>
                              <SelectContent>
                                {walkmeOwners.map(owner => (
                                  <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 ml-1">Point of Contacts (POCs)</Label>
                            <Textarea 
                              value={formData.pocs} 
                              onChange={(e) => setFormData({ ...formData, pocs: e.target.value })}
                              placeholder="Name, Role, Email (one per line)"
                              className="bg-slate-50 border-slate-200 rounded-xl min-h-[120px] font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="space-y-4">
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            Organization
                          </h3>
                          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Department</p>
                            <p className="text-lg font-bold text-slate-900">{selectedAccount?.department || 'Not specified'}</p>
                          </div>
                        </section>
                        <section className="space-y-4">
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Key Contacts
                          </h3>
                          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 whitespace-pre-wrap text-slate-700 font-medium leading-relaxed">
                            {selectedAccount?.pocs || 'No contacts listed.'}
                          </div>
                        </section>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="ai-tools" className="mt-0 space-y-8">
                    {isFormView || isAddOpen ? (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-500 ml-1">Other AI Tools & Usage</Label>
                          <Textarea 
                            value={formData.otherAiTools} 
                            onChange={(e) => setFormData({ ...formData, otherAiTools: e.target.value })}
                            placeholder="Describe what other AI tools they are using, their use cases, and current adoption levels..."
                            className="bg-slate-50 border-slate-200 rounded-xl min-h-[250px] font-medium leading-relaxed"
                          />
                        </div>
                      </div>
                    ) : (
                      <section className="space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-primary" />
                          AI Landscape & Strategy
                        </h3>
                        <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 min-h-[200px]">
                          {selectedAccount?.otherAiTools ? (
                            <div className="prose prose-slate max-w-none">
                              <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                                {selectedAccount.otherAiTools}
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                              <Info className="w-12 h-12 opacity-10 mb-4" />
                              <p>No AI tool information available for this account.</p>
                            </div>
                          )}
                        </div>
                      </section>
                    )}
                  </TabsContent>
                </div>
              </ScrollArea>

              {(isFormView || isAddOpen) && (
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 px-8">
                  <Button 
                    variant="ghost" 
                    className="font-bold text-slate-500" 
                    onClick={() => {
                      if (isAddOpen && !editingAccount) {
                        setIsAddOpen(false);
                      } else {
                        setIsFormView(false);
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="px-12 h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
                    {editingAccount ? 'Update Account' : 'Save Account'}
                  </Button>
                </div>
              )}
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white/80 backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-slate-900 border-b border-slate-800">
            <TableRow className="hover:bg-slate-900">
              <TableHead className="font-bold text-white uppercase tracking-widest text-[10px]">Customer Name</TableHead>
              <TableHead className="font-bold text-white uppercase tracking-widest text-[10px]">Region / Country</TableHead>
              <TableHead className="font-bold text-white uppercase tracking-widest text-[10px]">Account Owner / CSM</TableHead>
              <TableHead className="font-bold text-white uppercase tracking-widest text-[10px]">POCs / AI Tools</TableHead>
              <TableHead className="font-bold text-white uppercase tracking-widest text-[10px]">Deployment</TableHead>
              <TableHead className="font-bold text-white uppercase tracking-widest text-[10px]">Status</TableHead>
              <TableHead className="text-right font-bold text-white uppercase tracking-widest text-[10px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="w-10 h-10 opacity-10" />
                    <p className="text-sm font-medium">No accounts added yet.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <TableRow 
                  key={account.id} 
                  className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedAccount(account)}
                >
                  <TableCell className="font-bold text-slate-900 py-4">{account.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-100 rounded-lg">
                        <Globe className="w-3 h-3 text-slate-500" />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">{account.region}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        <Building2 className="w-3 h-3" />
                        {account.department || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-black text-primary">
                          {account.leads.split(' ').map(n => n[0]).join('')}
                        </div>
                        {account.leads}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 max-w-[200px]">
                      <div className="text-xs font-semibold text-slate-700 truncate" title={account.pocs}>
                        {account.pocs || 'No POCs'}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 italic font-medium" title={account.otherAiTools}>
                        {account.otherAiTools || 'No AI tools info'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <Badge variant={account.jouleDeployed ? "default" : "secondary"} className={cn("text-[9px] font-bold uppercase tracking-tighter px-1.5 h-5", account.jouleDeployed ? "bg-blue-500 hover:bg-blue-600" : "bg-slate-100 text-slate-400")}>
                        Joule {account.jouleDeployed ? <CheckCircle2 className="w-2 h-2 ml-1" /> : <XCircle className="w-2 h-2 ml-1" />}
                      </Badge>
                      <Badge variant={account.walkMeDeployed ? "default" : "secondary"} className={cn("text-[9px] font-bold uppercase tracking-tighter px-1.5 h-5", account.walkMeDeployed ? "bg-indigo-500 hover:bg-indigo-600" : "bg-slate-100 text-slate-400")}>
                        WalkMe {account.walkMeDeployed ? <CheckCircle2 className="w-2 h-2 ml-1" /> : <XCircle className="w-2 h-2 ml-1" />}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2",
                        account.status === 'Active' ? 'bg-emerald-500 hover:bg-emerald-600' : 
                        account.status === 'Selected' ? 'bg-amber-500 hover:bg-amber-600' : 
                        'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      )}
                    >
                      {account.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAccount(account);
                          setFormData(account);
                          setIsAddOpen(true);
                          setIsFormView(true);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(account.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
