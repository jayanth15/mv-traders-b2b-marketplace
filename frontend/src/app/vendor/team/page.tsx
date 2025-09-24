"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BottomNav } from "@/components/layout/BottomNav";
import { usePathname, useRouter } from "next/navigation";
import { Users, Plus, Pencil, Trash2, Home, Package, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { userAPI } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/utils";

interface TeamUser { user_id: number; full_name: string; phone_number: string; role: "SuperAdmin" | "Admin" | "User"; created_at: string; }

export default function VendorTeamPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ full_name: "", phone_number: "", role: "User", password: "" });

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) || u.phone_number.includes(search);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await userAPI.getUsers();
      setUsers(data);
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to load team"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => setForm({ full_name: "", phone_number: "", role: "User", password: "" });

  const onCreate = async () => {
    try {
      if (!form.full_name || !form.phone_number || !form.password) {
        toast.error("Name, phone and password required");
        return;
      }
      const payload = { ...form };
      const created = await userAPI.createUser(payload);
      setUsers(prev => [created, ...prev]);
      resetForm();
      toast.success("User created");
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to create user"));
    }
  };

  const onStartEdit = (u: TeamUser) => {
    setEditingId(u.user_id);
    setForm({ full_name: u.full_name, phone_number: u.phone_number, role: u.role, password: "" });
  };

  const onUpdate = async () => {
    if (editingId == null) return;
    try {
      const payload: any = { full_name: form.full_name, phone_number: form.phone_number, role: form.role };
      const updated = await userAPI.updateUser(editingId, payload);
      setUsers(prev => prev.map(u => u.user_id === editingId ? updated : u));
      setEditingId(null);
      resetForm();
      toast.success("User updated");
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to update user"));
    }
  };

  const onDelete = async (id: number) => {
    try {
      await userAPI.deleteUser(id);
      setUsers(prev => prev.filter(u => u.user_id !== id));
      toast.success("User deleted");
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to delete user"));
    }
  };

  const sidebar = (
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Vendor Panel</h2>
        <p className="text-sm text-muted-foreground">Manage products and orders</p>
      </div>
      <nav className="space-y-2">
        <Button
          variant={pathname?.startsWith('/dashboard/vendor') ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => router.push('/dashboard/vendor')}
        >
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        <Button
          variant={pathname?.startsWith('/vendor/products') ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => router.push('/vendor/products')}
        >
          <Package className="mr-2 h-4 w-4" />
          Products
        </Button>
        <Button
          variant={pathname?.startsWith('/vendor/orders') ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => router.push('/vendor/orders')}
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          Orders
        </Button>
        <Button
          variant={pathname?.startsWith('/vendor/team') ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => router.push('/vendor/team')}
        >
          <Users className="mr-2 h-4 w-4" />
          Team
        </Button>
      </nav>
    </div>
  );

  const bottomNav = (
    <BottomNav
      items={[
        { icon: <Home className="h-4 w-4" />, label: 'Dashboard', isActive: pathname?.startsWith('/dashboard/vendor') || false, onClick: () => router.push('/dashboard/vendor') },
        { icon: <Package className="h-4 w-4" />, label: 'Products', isActive: pathname?.startsWith('/vendor/products') || false, onClick: () => router.push('/vendor/products') },
        { icon: <ShoppingBag className="h-4 w-4" />, label: 'Orders', isActive: pathname?.startsWith('/vendor/orders') || false, onClick: () => router.push('/vendor/orders') },
        { icon: <Users className="h-4 w-4" />, label: 'Team', isActive: pathname?.startsWith('/vendor/team') || false, onClick: () => router.push('/vendor/team') },
      ]}
    />
  );

  return (
    <ProtectedRoute allowedOrgTypes={["Vendor"]} allowedRoles={["SuperAdmin", "Admin"]}>
      <DashboardLayout sidebar={sidebar} bottomNav={bottomNav}>
        <div className="space-y-6 pb-24 md:pb-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Team</h1>
              <p className="text-muted-foreground">Invite and manage team members</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Add / Edit Member</CardTitle>
              <CardDescription>SuperAdmin/Admin can manage team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input placeholder="Full name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                <Input placeholder="Phone number" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} />
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {editingId == null && (
                  <Input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                )}
              </div>
              <div className="flex gap-2">
                {editingId == null ? (
                  <Button onClick={onCreate}><Plus className="h-4 w-4 mr-2" /> Add Member</Button>
                ) : (
                  <Button onClick={onUpdate}><Pencil className="h-4 w-4 mr-2" /> Update Member</Button>
                )}
                {editingId != null && (
                  <Button variant="ghost" onClick={() => { setEditingId(null); resetForm(); }}>Cancel</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Team Members ({filtered.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <Input placeholder="Search team..." value={search} onChange={e => setSearch(e.target.value)} />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="md:w-60">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>
                    ) : filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={4}>No team members found</TableCell></TableRow>
                    ) : filtered.map(u => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">{u.full_name}</TableCell>
                        <TableCell>{u.phone_number}</TableCell>
                        <TableCell>{u.role}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => onStartEdit(u)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-800" onClick={() => onDelete(u.user_id)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
