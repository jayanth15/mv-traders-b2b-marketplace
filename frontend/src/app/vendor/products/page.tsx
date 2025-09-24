"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BottomNav } from "@/components/layout/BottomNav";
import { usePathname, useRouter } from "next/navigation";
import { Home, Package, Plus, Pencil, Trash2, ShoppingBag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { productAPI, unitAPI } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/utils";

interface Unit { unit_id: number; unit_name: string; }
interface Product { product_id: number; product_name: string; product_description?: string; price: number; unit_id: number; created_at: string; }

export default function VendorProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [addingUnit, setAddingUnit] = useState(false);
  const [unitForm, setUnitForm] = useState({ unit_name: "", unit_description: "" });
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({ product_name: "", product_description: "", price: "", unit_id: "" });

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.product_name.toLowerCase().includes(search.toLowerCase()) || (p.product_description || "").toLowerCase().includes(search.toLowerCase());
      const matchesUnit = unitFilter === "all" || String(p.unit_id) === unitFilter;
      return matchesSearch && matchesUnit;
    })
  }, [products, search, unitFilter]);

  const load = async () => {
    try {
      setLoading(true);
      const [prods, us] = await Promise.all([
        productAPI.getProducts(),
        unitAPI.getUnits(),
      ]);
      setProducts(prods);
      setUnits(us);
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to load products"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => setForm({ product_name: "", product_description: "", price: "", unit_id: "" });

  const onAddUnit = async () => {
    if (!unitForm.unit_name) {
      toast.error("Unit name required");
      return;
    }
    try {
      setAddingUnit(true);
      const created = await unitAPI.createUnit({
        unit_name: unitForm.unit_name,
        unit_description: unitForm.unit_description || undefined,
      });
      setUnits(prev => [created, ...prev]);
      setForm(f => ({ ...f, unit_id: String(created.unit_id) }));
      setUnitForm({ unit_name: "", unit_description: "" });
      toast.success("Unit added");
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to add unit"));
    } finally {
      setAddingUnit(false);
    }
  };

  const onCreate = async () => {
    try {
      setCreating(true);
      if (!form.product_name || !form.price || !form.unit_id) {
        toast.error("Name, price and unit are required");
        return;
      }
      const payload = {
        product_name: form.product_name,
        product_description: form.product_description || undefined,
        price: parseFloat(form.price as any),
        unit_id: Number(form.unit_id),
      };
      const created = await productAPI.createProduct(payload);
      setProducts(prev => [created, ...prev]);
      resetForm();
      toast.success("Product created");
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to create product"));
    } finally {
      setCreating(false);
    }
  };

  const onStartEdit = (p: Product) => {
    setEditingId(p.product_id);
    setForm({
      product_name: p.product_name,
      product_description: p.product_description || "",
      price: String(p.price),
      unit_id: String(p.unit_id),
    });
  };

  const onUpdate = async () => {
    if (editingId == null) return;
    try {
      const payload = {
        product_name: form.product_name,
        product_description: form.product_description || undefined,
        price: parseFloat(form.price as any),
        unit_id: Number(form.unit_id),
      };
      const updated = await productAPI.updateProduct(editingId, payload);
      setProducts(prev => prev.map(p => p.product_id === editingId ? updated : p));
      setEditingId(null);
      resetForm();
      toast.success("Product updated");
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to update product"));
    }
  };

  const onDelete = async (id: number) => {
    try {
      await productAPI.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.product_id !== id));
      toast.success("Product deleted");
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to delete product"));
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
              <h1 className="text-3xl font-bold tracking-tight">Products</h1>
              <p className="text-muted-foreground">Create and manage your products</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Add / Edit Product</CardTitle>
              <CardDescription>Quick inline form for faster workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input placeholder="Product name" value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} />
                <Input placeholder="Description (optional)" value={form.product_description} onChange={e => setForm({ ...form, product_description: e.target.value })} />
                <Input placeholder="Price" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                <Select value={form.unit_id} onValueChange={v => setForm({ ...form, unit_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(u => (
                      <SelectItem key={u.unit_id} value={String(u.unit_id)}>{u.unit_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                <p className="text-sm font-medium">Quick Add Unit</p>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <Input placeholder="Unit name" value={unitForm.unit_name} onChange={e => setUnitForm({ ...unitForm, unit_name: e.target.value })} />
                  <Input placeholder="Description (optional)" value={unitForm.unit_description} onChange={e => setUnitForm({ ...unitForm, unit_description: e.target.value })} />
                  <Button type="button" onClick={onAddUnit} disabled={addingUnit} className="md:col-span-1 col-span-1">
                    {addingUnit ? 'Adding...' : 'Add Unit'}
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                {editingId == null ? (
                  <Button onClick={onCreate} disabled={creating}>
                    <Plus className="h-4 w-4 mr-2" /> Add Product
                  </Button>
                ) : (
                  <Button onClick={onUpdate}>
                    <Pencil className="h-4 w-4 mr-2" /> Update Product
                  </Button>
                )}
                {editingId != null && (
                  <Button variant="ghost" onClick={() => { setEditingId(null); resetForm(); }}>Cancel</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Catalog ({filtered.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
                <Select value={unitFilter} onValueChange={setUnitFilter}>
                  <SelectTrigger className="md:w-60">
                    <SelectValue placeholder="Filter by unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Units</SelectItem>
                    {units.map(u => (
                      <SelectItem key={u.unit_id} value={String(u.unit_id)}>{u.unit_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow>
                    ) : filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={5}>No products found</TableCell></TableRow>
                    ) : filtered.map(p => (
                      <TableRow key={p.product_id}>
                        <TableCell className="font-medium">{p.product_name}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{p.product_description}</TableCell>
                        <TableCell>${p.price.toFixed(2)}</TableCell>
                        <TableCell>{units.find(u => u.unit_id === p.unit_id)?.unit_name || p.unit_id}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => onStartEdit(p)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-800" onClick={() => onDelete(p.product_id)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
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
