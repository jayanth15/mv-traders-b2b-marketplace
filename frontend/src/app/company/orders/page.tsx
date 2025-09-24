"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OrgSidebarNav, OrgBottomNav } from "@/components/layout/OrgNav";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, Home, PackageSearch, Users, Plus, RefreshCcw, Calculator, XCircle, Building2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orderAPI, orderItemAPI, productAPI, pricingAPI } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage, formatINR } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

interface Order { order_id: number; placed_by_org_id: number; placed_by_user_id: number; status: string; placed_at: string; }

export default function CompanyOrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [productId, setProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [zoneCode, setZoneCode] = useState<string | undefined>(undefined);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pricePreview, setPricePreview] = useState<any | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [creatingItem, setCreatingItem] = useState(false);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = String(o.order_id).includes(search) || String(o.placed_by_org_id).includes(search);
      return matchesSearch;
    });
  }, [orders, search]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderAPI.getOrders();
      setOrders(data);
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to load orders"));
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productAPI.getProducts();
      setProducts(data);
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to load products"));
    }
  };

  useEffect(() => { loadOrders(); loadProducts(); }, []);

  const openDetails = async (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
    try {
      setItemsLoading(true);
      const data = await orderItemAPI.getItemsByOrder(order.order_id);
      setItems(data);
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to load order items"));
    } finally {
      setItemsLoading(false);
    }
  };

  const createOrder = async () => {
    try {
      setCreatingOrder(true);
      const created = await orderAPI.createOrder({});
      toast.success("Order created");
      setOrders(prev => [created, ...prev]);
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to create order"));
    } finally {
      setCreatingOrder(false);
    }
  };

  const previewPrice = async () => {
    if (!productId) { toast.error("Select a product"); return; }
    try {
      setPreviewLoading(true);
      const data = await pricingAPI.preview(productId, quantity, zoneCode);
      setPricePreview(data);
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to preview pricing"));
    } finally {
      setPreviewLoading(false);
    }
  };

  const addItem = async () => {
    if (!selectedOrder) { toast.error("Open an order first"); return; }
    if (!productId) { toast.error("Select a product"); return; }
    try {
      setCreatingItem(true);
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/order-items/?quantity=${quantity}&zone_code=${zoneCode || ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${document.cookie.split('; ').find(c=>c.startsWith('token='))?.split('=')[1]}` },
        body: JSON.stringify({ order_id: selectedOrder.order_id, product_id: productId, item_name: '' })
      });
      toast.success("Item added");
      // refresh items
      const data = await orderItemAPI.getItemsByOrder(selectedOrder.order_id);
      setItems(data);
      setAddItemOpen(false);
      setProductId(null);
      setPricePreview(null);
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to add item"));
    } finally {
      setCreatingItem(false);
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard/company', icon: <Home className="h-4 w-4" /> },
    { label: 'Orders', href: '/company/orders', icon: <ShoppingBag className="h-4 w-4" /> },
    { label: 'Vendors', href: '/company/vendors', icon: <Building2 className="h-4 w-4" /> },
    { label: 'Team', href: '/company/team', icon: <Users className="h-4 w-4" /> },
    { label: 'Reports', href: '/company/reports', icon: <TrendingUp className="h-4 w-4" /> },
  ];

  const canManage = user && ['SuperAdmin','Admin','SUPER_ADMIN','ADMIN'].includes(user.role);

  return (
    <ProtectedRoute allowedOrgTypes={["Company"]}>
  <DashboardLayout sidebar={<OrgSidebarNav title="Company Panel" subtitle="Manage orders" items={navItems} />} bottomNav={<OrgBottomNav items={navItems} /> }>
        <div className="space-y-6 pb-24 md:pb-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
              <p className="text-muted-foreground">Create and manage company orders</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {canManage && <Button onClick={createOrder} disabled={creatingOrder}>{creatingOrder ? 'Creating…' : 'New Order'}</Button>}
              <Button variant="outline" onClick={loadOrders}><RefreshCcw className="h-4 w-4 mr-2" /> Refresh</Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> Orders ({filtered.length})</CardTitle>
              <CardDescription>Orders placed by your company</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <Input placeholder="Search by order id..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Placed At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>
                    ) : filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={4}>No orders found</TableCell></TableRow>
                    ) : filtered.map(o => (
                      <TableRow key={o.order_id}>
                        <TableCell className="font-medium">#{o.order_id}</TableCell>
                        <TableCell>{o.status}</TableCell>
                        <TableCell>{new Date(o.placed_at).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => openDetails(o)}>Manage</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Dialog open={detailsOpen} onOpenChange={o => { setDetailsOpen(o); if (!o) { setSelectedOrder(null); } }}>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Order {selectedOrder ? `#${selectedOrder.order_id}` : ''}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedOrder && canManage && (
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => setAddItemOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Add Item
                    </Button>
                  </div>
                )}
                {itemsLoading ? (
                  <div>Loading items...</div>
                ) : items.length === 0 ? (
                  <div>No items yet.</div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Zone</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((it: any) => (
                          <TableRow key={it.order_item_id}>
                            <TableCell>{it.item_name || it.product_id}</TableCell>
                            <TableCell>{it.quantity ?? '-'}</TableCell>
                            <TableCell>{it.zone_code || '—'}</TableCell>
                            <TableCell>{typeof it.final_unit_price === 'number' ? formatINR(it.final_unit_price) : (typeof it.item_price === 'number' ? formatINR(it.item_price) : '—')}</TableCell>
                            <TableCell>{it.item_status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Item to Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product</label>
                  <select
                    className="border rounded-md h-9 px-2 text-sm w-full bg-background"
                    value={productId ?? ''}
                    onChange={e => { setProductId(e.target.value ? Number(e.target.value) : null); setPricePreview(null); }}
                  >
                    <option value="">Select product</option>
                    {products.map(p => (
                      <option key={p.product_id} value={p.product_id}>{p.product_name || p.product_id}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantity</label>
                    <Input type="number" min={1} value={quantity} onChange={e => { setQuantity(Number(e.target.value) || 1); setPricePreview(null); }} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Zone (optional)</label>
                    <Input placeholder="e.g. NEAR" value={zoneCode || ''} onChange={e => { setZoneCode(e.target.value || undefined); setPricePreview(null); }} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={previewPrice} disabled={previewLoading || !productId}>
                    {previewLoading ? 'Calculating…' : <span className="inline-flex items-center"><Calculator className="h-4 w-4 mr-1" /> Preview</span>}
                  </Button>
                  {pricePreview && (
                    <Button type="button" variant="ghost" onClick={() => setPricePreview(null)}>
                      <XCircle className="h-4 w-4 mr-1" /> Clear
                    </Button>
                  )}
                </div>
                {pricePreview && (
                  <div className="rounded-md border p-3 text-sm space-y-1 bg-muted/30">
                    <div className="font-medium">Price Preview</div>
                    <div>Unit Price: <span className="font-semibold">{formatINR(pricePreview.unit_price)}</span></div>
                    {pricePreview.base_price != null && pricePreview.base_price !== pricePreview.unit_price && (
                      <div className="text-xs text-muted-foreground">Base: {formatINR(pricePreview.base_price)}</div>
                    )}
                    {pricePreview.zone_applied && (
                      <div className="text-xs">Zone Adj ({pricePreview.zone_code}): {pricePreview.zone_delta > 0 ? '+' : ''}{pricePreview.zone_delta?.toFixed(2)} {pricePreview.zone_is_percent ? '%' : ''}</div>
                    )}
                    {pricePreview.tier_applied && (
                      <div className="text-xs">Tier Discount (qty {quantity}): {pricePreview.tier_delta > 0 ? '+' : ''}{pricePreview.tier_delta?.toFixed(2)} {pricePreview.tier_is_percent ? '%' : ''}</div>
                    )}
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Source: {pricePreview.pricing_source}</div>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button onClick={addItem} disabled={creatingItem || !productId}>{creatingItem ? 'Adding…' : 'Add Item'}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
