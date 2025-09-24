"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BottomNav } from "@/components/layout/BottomNav";
import { Home, Package, ShoppingBag, Users, Ruler, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { unitAPI } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

interface Unit { unit_id: number; unit_name: string; unit_description?: string; }

export default function VendorUnitsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [units, setUnits] = useState<Unit[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ unit_name: "", unit_description: "" });

  const filtered = useMemo(() => units.filter(u => u.unit_name.toLowerCase().includes(search.toLowerCase())), [units, search]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await unitAPI.getUnits();
      setUnits(data);
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to load units"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => setForm({ unit_name: "", unit_description: "" });

  const onCreate = async () => {
    try {
      if (!form.unit_name) { toast.error("Unit name is required"); return; }
      const payload = { unit_name: form.unit_name, unit_description: form.unit_description || undefined };
      const created = await unitAPI.createUnit(payload);
      setUnits(prev => [created, ...prev]);
      resetForm();
      toast.success("Unit created");
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to create unit"));
    }
  };

  const onStartEdit = (u: Unit) => {
    setEditingId(u.unit_id);
    setForm({ unit_name: u.unit_name, unit_description: u.unit_description || "" });
  };

  const onUpdate = async () => {
    if (editingId == null) return;
    try {
      const payload = { unit_name: form.unit_name, unit_description: form.unit_description || undefined };
      const updated = await unitAPI.updateUnit(editingId, payload);
      setUnits(prev => prev.map(u => u.unit_id === editingId ? updated : u));
      setEditingId(null);
      resetForm();
      toast.success("Unit updated");
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to update unit"));
    }
  };

  const onDelete = async (id: number) => {
    try {
      await unitAPI.deleteUnit(id);
      setUnits(prev => prev.filter(u => u.unit_id !== id));
      toast.success("Unit deleted");
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to delete unit"));
    }
  };

  const sidebar = (
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Vendor Panel</h2>
        <p className="text-sm text-muted-foreground">Manage products and orders</p>
      </div>
      <nav className="space-y-2">
        <Button variant={pathname?.startsWith('/dashboard/vendor') ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => router.push('/dashboard/vendor')}>
          <Home className="mr-2 h-4 w-4" /> Dashboard
        </Button>
        <Button variant={pathname?.startsWith('/vendor/products') ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => router.push('/vendor/products')}>
          <Package className="mr-2 h-4 w-4" /> Products
        </Button>
        <Button variant={pathname?.startsWith('/vendor/orders') ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => router.push('/vendor/orders')}>
          <ShoppingBag className="mr-2 h-4 w-4" /> Orders
        </Button>
        <Button variant={pathname?.startsWith('/vendor/team') ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => router.push('/vendor/team')}>
          <Users className="mr-2 h-4 w-4" /> Team
        </Button>
        <Button variant={pathname?.startsWith('/vendor/units') ? 'default' : 'ghost'} className="w-full justify-start" onClick={() => router.push('/vendor/units')}>
          <Ruler className="mr-2 h-4 w-4" /> Units
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
        { icon: <Ruler className="h-4 w-4" />, label: 'Units', isActive: pathname?.startsWith('/vendor/units') || false, onClick: () => router.push('/vendor/units') },
      ]}
    />
  );

  return (
    <ProtectedRoute allowedOrgTypes={["Vendor"]} allowedRoles={["SuperAdmin", "Admin"]}>
      <DashboardLayout sidebar={sidebar} bottomNav={bottomNav}>
        <div className="space-y-6 pb-24 md:pb-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Units</h1>
              <p className="text-muted-foreground">Create and manage units for your products</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Add / Edit Unit</CardTitle>
              <CardDescription>Define reusable units</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="Unit name" value={form.unit_name} onChange={e => setForm({ ...form, unit_name: e.target.value })} />
                <Input placeholder="Description (optional)" value={form.unit_description} onChange={e => setForm({ ...form, unit_description: e.target.value })} />
                {editingId == null ? (
                  <Button onClick={onCreate}><Plus className="h-4 w-4 mr-2" /> Add Unit</Button>
                ) : (
                  <Button onClick={onUpdate}><Pencil className="h-4 w-4 mr-2" /> Update Unit</Button>
                )}
              </div>
              {editingId != null && (
                <div>
                  <Button variant="ghost" onClick={() => { setEditingId(null); resetForm(); }}>Cancel</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Ruler className="h-5 w-5" /> Units ({filtered.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <Input placeholder="Search units..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow>
                    ) : filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={3}>No units found</TableCell></TableRow>
                    ) : filtered.map(u => (
                      <TableRow key={u.unit_id}>
                        <TableCell className="font-medium">{u.unit_name}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{u.unit_description}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => onStartEdit(u)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-800" onClick={() => onDelete(u.unit_id)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
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
