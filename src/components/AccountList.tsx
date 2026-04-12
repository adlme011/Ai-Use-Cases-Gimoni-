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
import { Plus, Pencil, Trash2, Globe, User, CheckCircle2, XCircle, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface AccountListProps {
  accounts: Account[];
  isAdmin: boolean;
}

export function AccountList({ accounts, isAdmin }: AccountListProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
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
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="gap-2" />}>
            <Plus className="w-4 h-4" />
            Add Account
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., SAP SE"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Region / Country</Label>
                  <Select 
                    value={formData.region} 
                    onValueChange={(v: any) => setFormData({ ...formData, region: v, leads: v === 'US' ? 'Alex Lustig' : 'Mark Joseph' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">US</SelectItem>
                      <SelectItem value="Europe">Europe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input 
                    value={formData.department} 
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., HR, Sales"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Owner / CSM</Label>
                  <Select 
                    value={formData.leads} 
                    onValueChange={(v) => setFormData({ ...formData, leads: v })}
                  >
                    <SelectTrigger>
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
              <div className="space-y-2">
                <Label>Point of Contacts (POCs)</Label>
                <Input 
                  value={formData.pocs} 
                  onChange={(e) => setFormData({ ...formData, pocs: e.target.value })}
                  placeholder="Name, Role, Email"
                />
              </div>
              <div className="space-y-2">
                <Label>Other AI Tools & Usage</Label>
                <Textarea 
                  value={formData.otherAiTools} 
                  onChange={(e) => setFormData({ ...formData, otherAiTools: e.target.value })}
                  placeholder="What other AI tools are they using and how?"
                  className="min-h-[80px]"
                />
              </div>
              <div className="flex gap-8 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.jouleDeployed} 
                    onChange={(e) => setFormData({ ...formData, jouleDeployed: e.target.checked })}
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Joule Deployed</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.walkMeDeployed} 
                    onChange={(e) => setFormData({ ...formData, walkMeDeployed: e.target.checked })}
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">WalkMe Deployed</span>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Account</Button>
            </DialogFooter>
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
                <TableRow key={account.id} className="group hover:bg-slate-50/50 transition-colors">
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
                        onClick={() => {
                          setEditingAccount(account);
                          setFormData(account);
                          setIsAddOpen(true);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50" 
                        onClick={() => handleDelete(account.id)}
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
