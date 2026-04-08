import React, { useState } from 'react';
import { Account } from '@/types';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Globe, User, CheckCircle2, XCircle } from 'lucide-react';
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
  });

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
      setFormData({ name: '', region: 'US', leads: '', status: 'Target', jouleDeployed: false, walkMeDeployed: false });
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Target Accounts</h2>
          <p className="text-slate-500">Manage the 10 target accounts for the SWAT initiative.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Account Name</label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., SAP SE"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Region</label>
                  <Select 
                    value={formData.region} 
                    onValueChange={(v: any) => setFormData({ ...formData, region: v, leads: v === 'US' ? 'Alex and Olga' : 'Steven and Mark' })}
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
                  <label className="text-sm font-medium">Status</label>
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Leads</label>
                <Input 
                  value={formData.leads} 
                  onChange={(e) => setFormData({ ...formData, leads: e.target.value })}
                  placeholder="Assigned leads"
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

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Account Name</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Leads</TableHead>
              <TableHead>Deployment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                  No accounts added yet.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-semibold text-slate-900">{account.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe className="w-3 h-3 text-slate-400" />
                      {account.region}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-slate-400" />
                      {account.leads}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Badge variant={account.jouleDeployed ? "default" : "secondary"} className="text-[10px]">
                        Joule {account.jouleDeployed ? <CheckCircle2 className="w-2 h-2 ml-1" /> : <XCircle className="w-2 h-2 ml-1" />}
                      </Badge>
                      <Badge variant={account.walkMeDeployed ? "default" : "secondary"} className="text-[10px]">
                        WalkMe {account.walkMeDeployed ? <CheckCircle2 className="w-2 h-2 ml-1" /> : <XCircle className="w-2 h-2 ml-1" />}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={account.status === 'Active' ? 'default' : account.status === 'Selected' ? 'secondary' : 'outline'}
                    >
                      {account.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          setEditingAccount(account);
                          setFormData(account);
                          setIsAddOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(account.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
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
