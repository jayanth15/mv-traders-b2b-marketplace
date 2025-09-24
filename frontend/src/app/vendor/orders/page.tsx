"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OrgSidebarNav, OrgBottomNav } from "@/components/layout/OrgNav";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, Check, Clock, RefreshCcw, Home, Package, Users, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orderAPI, orderItemAPI } from "@/lib/api";
import { toast } from "sonner";
import { extractErrorMessage, formatINR } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

interface Order { order_id: number; placed_by_org_id: number; placed_by_user_id: number; status: string; placed_at: string; }

export default function VendorOrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [openHistory, setOpenHistory] = useState<Record<number, boolean>>({});
  const [historyCache, setHistoryCache] = useState<Record<number, any[]>>({});
  // Local state for price override inputs per order item
  const [overrideInputs, setOverrideInputs] = useState<Record<number, { price: string; reason: string }>>({});
  const [overridingId, setOverridingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = String(o.order_id).includes(search) || String(o.placed_by_org_id).includes(search);
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const load = async () => {
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

  useEffect(() => { load(); }, []);

  const accept = async (orderId: number) => {
    try {
      setAcceptingId(orderId);
      await orderAPI.acceptOrder(orderId);
      toast.success("Order accepted");
      load();
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to accept order"));
    } finally {
      setAcceptingId(null);
    }
  };

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

  const updateItemStatus = async (orderItemId: number, newStatus: string) => {
    try {
      setUpdatingItemId(orderItemId);
      // optimistic UI update
      setItems(prev => prev.map(it => it.order_item_id === orderItemId ? { ...it, item_status: newStatus } : it));
      await orderItemAPI.updateStatus(orderItemId, newStatus);
      toast.success("Item status updated");
      // if history panel is open for this item, refresh it
      if (openHistory[orderItemId]) {
        try {
          const hist = await orderItemAPI.getHistory(orderItemId);
          setHistoryCache(prev => ({ ...prev, [orderItemId]: hist }));
        } catch {}
      }
    } catch (e: any) {
      toast.error(extractErrorMessage(e, "Failed to update item status"));
      // rollback optimistic change
      if (selectedOrder) {
        try {
          const data = await orderItemAPI.getItemsByOrder(selectedOrder.order_id);
          setItems(data);
        } catch {}
      }
    } finally {
      setUpdatingItemId(null);
    }
  };

  const toggleHistory = async (orderItemId: number) => {
    setOpenHistory(prev => ({ ...prev, [orderItemId]: !prev[orderItemId] }));
    const willOpen = !openHistory[orderItemId];
    if (willOpen && !historyCache[orderItemId]) {
      try {
        const hist = await orderItemAPI.getHistory(orderItemId);
        setHistoryCache(prev => ({ ...prev, [orderItemId]: hist }));
      } catch (e: any) {
        toast.error(extractErrorMessage(e, "Failed to load item history"));
      }
    }
  };

  const canOverride = user?.organization_type === 'Vendor' && ['SUPER_ADMIN','ADMIN','SuperAdmin','Admin'].includes(user.role || '');

  const submitOverride = async (orderItemId: number) => {
    const input = overrideInputs[orderItemId];
    if (!input || !input.price) {
      toast.error('Enter a new price');
      return;
    }
    const value = parseFloat(input.price);
    if (isNaN(value) || value < 0) {
      toast.error('Invalid price');
      return;
    }
    try {
      setOverridingId(orderItemId);
      const updated = await orderItemAPI.overridePrice(orderItemId, value, input.reason || undefined);
      // Update items list
      setItems(prev => prev.map(it => it.order_item_id === orderItemId ? { ...it, ...updated } : it));
      toast.success('Price overridden');
      // refresh history if open
      if (openHistory[orderItemId]) {
        try {
          const hist = await orderItemAPI.getHistory(orderItemId);
          setHistoryCache(prev => ({ ...prev, [orderItemId]: hist }));
        } catch {}
      }
    } catch (e: any) {
      toast.error(extractErrorMessage(e, 'Failed to override price'));
    } finally {
      setOverridingId(null);
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard/vendor', icon: <Home className="h-4 w-4" /> },
    { label: 'Products', href: '/vendor/products', icon: <Package className="h-4 w-4" /> },
    { label: 'Orders', href: '/vendor/orders', icon: <ShoppingBag className="h-4 w-4" /> },
    { label: 'Team', href: '/vendor/team', icon: <Users className="h-4 w-4" /> },
  ];

  return (
    <ProtectedRoute allowedOrgTypes={["Vendor"]}>
  <DashboardLayout sidebar={<OrgSidebarNav title="Vendor Panel" subtitle="Manage products and orders" items={navItems} />} bottomNav={<OrgBottomNav items={navItems} /> }>
        <div className="space-y-6 pb-24 md:pb-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
              <p className="text-muted-foreground">Review and accept approved orders</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={load}><RefreshCcw className="h-4 w-4 mr-2" /> Refresh</Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> Orders ({filtered.length})</CardTitle>
              <CardDescription>Only orders containing your products are listed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <Input placeholder="Search by order or company id..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Placed By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Placed At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
                    ) : filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={6}>No orders found</TableCell></TableRow>
                    ) : filtered.map(o => (
                      <TableRow key={o.order_id}>
                        <TableCell className="font-medium">#{o.order_id}</TableCell>
                        <TableCell>{o.placed_by_org_id}</TableCell>
                        <TableCell>{o.placed_by_user_id}</TableCell>
                        <TableCell>{o.status}</TableCell>
                        <TableCell>{new Date(o.placed_at).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => openDetails(o)}>View Items</Button>
                            <Button size="sm" onClick={() => accept(o.order_id)} disabled={o.status !== "Approved" || acceptingId === o.order_id}>
                              {acceptingId === o.order_id ? (
                                <span className="inline-flex items-center"><Clock className="h-4 w-4 mr-2 animate-spin" /> Accepting</span>
                              ) : (
                                <span className="inline-flex items-center"><Check className="h-4 w-4 mr-2" /> Accept</span>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Order Details {selectedOrder ? `#${selectedOrder.order_id}` : ''}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {itemsLoading ? (
                  <div>Loading items...</div>
                ) : items.length === 0 ? (
                  <div>No items in this order.</div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Qty</TableHead>
                          {!user || user.role !== 'User' ? <TableHead>Price</TableHead> : null}
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((it: any) => (
                          <TableRow key={it.order_item_id || `${it.product_id}-${it.item_status}`}>
                            <TableCell className="font-medium">{it.item_name || it.product_id}</TableCell>
                            <TableCell>{it.quantity ?? '-'}</TableCell>
                            {!user || user.role !== 'User' ? (
                              <TableCell className="whitespace-nowrap">
                                {typeof it.final_unit_price === 'number' ? (
                                  <div className="flex flex-col">
                                    <span className="font-medium">{formatINR(it.final_unit_price)}</span>
                                    {it.calculated_unit_price && it.final_unit_price !== it.calculated_unit_price ? (
                                      <span className="text-xs text-muted-foreground line-through">Auto {formatINR(it.calculated_unit_price)}</span>
                                    ) : null}
                                    {it.pricing_source ? (
                                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{it.pricing_source}</span>
                                    ) : null}
                                  </div>
                                ) : (
                                  typeof it.item_price === 'number' ? formatINR(it.item_price) : '—'
                                )}
                              </TableCell>
                            ) : null}
                            <TableCell>{it.item_status}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center justify-end gap-2">
                                  <Button size="sm" variant="ghost" disabled={updatingItemId === it.order_item_id} onClick={() => updateItemStatus(it.order_item_id, 'OutOfStock')}>
                                    {updatingItemId === it.order_item_id ? 'Updating…' : 'Out of stock'}
                                  </Button>
                                  <Button size="sm" variant="ghost" disabled={updatingItemId === it.order_item_id} onClick={() => updateItemStatus(it.order_item_id, 'OutForDelivery')}>
                                    {updatingItemId === it.order_item_id ? 'Updating…' : 'Out for delivery'}
                                  </Button>
                                  <Button size="sm" disabled={updatingItemId === it.order_item_id} onClick={() => updateItemStatus(it.order_item_id, 'Delivered')}>
                                    {updatingItemId === it.order_item_id ? 'Updating…' : 'Delivered'}
                                  </Button>
                                </div>
                                {canOverride && (
                                  <div className="w-full flex flex-col gap-1 border rounded-md p-2">
                                    <div className="flex gap-2 items-center">
                                      <Input
                                        placeholder="New price"
                                        value={overrideInputs[it.order_item_id]?.price || ''}
                                        onChange={e => setOverrideInputs(prev => ({ ...prev, [it.order_item_id]: { ...prev[it.order_item_id], price: e.target.value } }))}
                                        className="h-8"
                                      />
                                      <Button size="sm" onClick={() => submitOverride(it.order_item_id)} disabled={overridingId === it.order_item_id}>
                                        {overridingId === it.order_item_id ? 'Saving…' : 'Override'}
                                      </Button>
                                    </div>
                                    <Input
                                      placeholder="Reason (optional)"
                                      value={overrideInputs[it.order_item_id]?.reason || ''}
                                      onChange={e => setOverrideInputs(prev => ({ ...prev, [it.order_item_id]: { ...prev[it.order_item_id], reason: e.target.value } }))}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                )}
                                <Button size="sm" variant="outline" onClick={() => toggleHistory(it.order_item_id)} className="inline-flex items-center">
                                  <History className="h-4 w-4 mr-2" /> {openHistory[it.order_item_id] ? 'Hide History' : 'View History'}
                                </Button>
                                {openHistory[it.order_item_id] && (
                                  <div className="w-full text-left text-sm border rounded-md p-2 max-h-40 overflow-auto">
                                    {historyCache[it.order_item_id]?.length ? (
                                      <ul className="space-y-1">
                                        {historyCache[it.order_item_id].map((h: any) => {
                                          const priceChange = (h.old_price != null || h.new_price != null) && (h.price_change_reason || h.old_price !== h.new_price);
                                          return (
                                            <li key={h.order_item_history_id} className="flex flex-col border-b last:border-none pb-1 last:pb-0">
                                              <div className="flex justify-between w-full">
                                                <span>{h.status}</span>
                                                <span className="text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span>
                                              </div>
                                              {priceChange && (
                                                <div className="text-xs text-muted-foreground flex justify-between w-full">
                                                  <span>{h.old_price != null ? formatINR(h.old_price) : '—'} → {h.new_price != null ? formatINR(h.new_price) : '—'}</span>
                                                  {h.price_change_reason && <span className="italic">{h.price_change_reason}</span>}
                                                </div>
                                              )}
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    ) : (
                                      <div className="text-muted-foreground">No history yet</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
