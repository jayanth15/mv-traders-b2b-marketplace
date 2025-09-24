'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { OrgSidebarNav, OrgBottomNav } from '@/components/layout/OrgNav';
import { Home, Building2, Users, TrendingUp, PackageSearch, ShoppingBag, Plus, Calculator, XCircle } from 'lucide-react';
import { organizationAPI, productAPI, orderAPI, orderItemAPI, pricingAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { extractErrorMessage, formatINR } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input as TextInput } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

export default function VendorCatalogPage() {
  const params = useParams();
  const vendorId = params.vendorId ? Number(params.vendorId) : undefined;
  const [vendorName, setVendorName] = useState<string>('Vendor');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | 'new' | undefined>(undefined);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [zoneCode, setZoneCode] = useState<string>('');
  const [pricePreview, setPricePreview] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
  const vendors = await organizationAPI.getVendors();
  const vendor = vendors.find((o: any) => o.id === vendorId);
  if (vendor) setVendorName(vendor.name || `Vendor #${vendorId}`);
  const allProducts = await productAPI.getProducts();
  setProducts(allProducts.filter((p: any) => p.vendor_id === vendorId));
  // preload company orders for quick add
  const companyOrders = await orderAPI.getOrders();
  setOrders(companyOrders);
      } catch (e: any) {
        toast.error(extractErrorMessage(e, 'Failed to load vendor/products'));
      } finally { setLoading(false); }
    };
    if (vendorId) load();
  }, [vendorId]);

  const filtered = useMemo(() => products.filter(p => !search || (p.product_name || '').toLowerCase().includes(search.toLowerCase())), [products, search]);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard/company', icon: <Home className="h-4 w-4" /> },
    { label: 'Orders', href: '/company/orders', icon: <PackageSearch className="h-4 w-4" /> },
    { label: 'Vendors', href: '/company/vendors', icon: <Building2 className="h-4 w-4" /> },
    { label: 'Team', href: '/company/team', icon: <Users className="h-4 w-4" /> },
    { label: 'Reports', href: '/company/reports', icon: <TrendingUp className="h-4 w-4" /> },
  ];

  return (
    <ProtectedRoute allowedOrgTypes={['Company']}>
      <DashboardLayout
        sidebar={<OrgSidebarNav title="Company Panel" subtitle={vendorName} items={navItems} />}
        bottomNav={<OrgBottomNav items={navItems} />}
      >
        <div className='space-y-6'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>{vendorName} Products</h1>
              <p className='text-muted-foreground'>Browse catalog and add to orders from order details page.</p>
            </div>
            <Input placeholder='Search products...' value={search} onChange={e => setSearch(e.target.value)} className='md:w-64' />
          </div>
          {loading ? (
            <div>Loading...</div>
          ) : filtered.length === 0 ? (
            <div>No products found.</div>
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {filtered.map(p => (
                <Card key={p.product_id} className='hover:border-primary transition-colors'>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-base flex items-center gap-2'>
                      <ShoppingBag className='h-4 w-4 text-muted-foreground' />
                      {p.product_name || `Product #${p.product_id}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='text-sm space-y-1'>
                    <div>Price: {p.price != null ? formatINR(p.price) : 'N/A'}</div>
                    <div className='text-xs text-muted-foreground'>ID: {p.product_id}</div>
                    <Button size='sm' className='mt-2' onClick={() => { setSelectedProduct(p); setOrderDialogOpen(true); }}>
                      <Plus className='h-4 w-4 mr-1' /> Add to Order
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
  <Dialog open={orderDialogOpen} onOpenChange={(o)=>{ setOrderDialogOpen(o); if(!o){ setSelectedProduct(null); setSelectedOrderId(undefined); setPricePreview(null); setQuantity(1); setZoneCode(''); }}}>
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>Add Product to Order</DialogTitle>
            </DialogHeader>
            <div className='space-y-4 text-sm'>
              <div className='font-medium'>{selectedProduct?.product_name} <span className='text-xs text-muted-foreground'>#{selectedProduct?.product_id}</span></div>
              <div className='space-y-2'>
                <label className='text-xs uppercase tracking-wide font-medium'>Select Order</label>
                <select className='border rounded-md h-9 px-2 bg-background w-full'
                  value={selectedOrderId === undefined ? '' : selectedOrderId}
                  onChange={e=>{ const val = e.target.value; setSelectedOrderId(val === '' ? undefined : (val === 'new' ? 'new' : Number(val))); }}>
                  <option value=''>Choose existing or new</option>
                  {orders.map(o=> <option key={o.order_id} value={o.order_id}>Order #{o.order_id}</option>)}
                  <option value='new'>+ Create New Order</option>
                </select>
                {selectedOrderId === 'new' && (
                  <Button size='sm' variant='outline' onClick={async ()=>{
                    try { setCreatingOrder(true); const created = await orderAPI.createOrder({}); setOrders(prev=>[created, ...prev]); setSelectedOrderId(created.order_id); toast.success('Order created'); } catch(e:any){ toast.error(extractErrorMessage(e,'Failed to create order')); } finally { setCreatingOrder(false);} }}> {creatingOrder?'Creating…':'Create Order'} </Button>
                )}
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <label className='text-xs uppercase tracking-wide font-medium'>Quantity</label>
                  <TextInput type='number' min={1} value={quantity} onChange={e=>{ setQuantity(Number(e.target.value)||1); setPricePreview(null);} } />
                </div>
                <div className='space-y-1'>
                  <label className='text-xs uppercase tracking-wide font-medium'>Zone</label>
                  <TextInput placeholder='Optional' value={zoneCode} onChange={e=>{ setZoneCode(e.target.value); setPricePreview(null);} } />
                </div>
              </div>
              <div className='flex gap-2'>
                <Button type='button' variant='outline' disabled={!selectedProduct || previewLoading} onClick={async ()=>{
                  if(!selectedProduct) return; try { setPreviewLoading(true); const data = await pricingAPI.preview(selectedProduct.product_id, quantity, zoneCode || undefined); setPricePreview(data);} catch(e:any){ toast.error(extractErrorMessage(e,'Failed pricing preview')); } finally { setPreviewLoading(false);} }}>
                  {previewLoading ? 'Calculating…' : <span className='inline-flex items-center'><Calculator className='h-4 w-4 mr-1' /> Preview</span>}
                </Button>
                {pricePreview && (
                  <Button type='button' variant='ghost' onClick={()=> setPricePreview(null)}>
                    <XCircle className='h-4 w-4 mr-1' /> Clear
                  </Button>
                )}
              </div>
              {pricePreview && (
                <div className='rounded-md border p-3 text-xs space-y-1 bg-muted/30'>
                  <div className='font-medium'>Price Preview</div>
                  <div>Unit Price: <span className='font-semibold'>{formatINR(pricePreview.unit_price)}</span></div>
                  {pricePreview.base_price != null && pricePreview.base_price !== pricePreview.unit_price && (
                    <div className='text-muted-foreground'>Base: {formatINR(pricePreview.base_price)}</div>
                  )}
                  {pricePreview.zone_applied && (
                    <div>Zone Adj ({pricePreview.zone_code}): {pricePreview.zone_delta}{pricePreview.zone_is_percent ? '%' : ''}</div>
                  )}
                  {pricePreview.tier_applied && (
                    <div>Tier Discount: {pricePreview.tier_delta}{pricePreview.tier_is_percent ? '%' : ''}</div>
                  )}
                  <div className='text-[10px] uppercase tracking-wide text-muted-foreground'>Source: {pricePreview.pricing_source}</div>
                </div>
              )}
              <div className='flex justify-end'>
                <Button disabled={!selectedProduct || selectedOrderId===undefined || addingItem} onClick={async ()=>{
                  if(!selectedProduct || selectedOrderId===undefined) return;
                  try {
                    setAddingItem(true);
                    let orderId = selectedOrderId as number;
                    if(selectedOrderId==='new') { return; }
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/order-items/?quantity=${quantity}&zone_code=${zoneCode}`, {
                      method:'POST',
                      headers:{'Content-Type':'application/json','Authorization':`Bearer ${document.cookie.split('; ').find(c=>c.startsWith('token='))?.split('=')[1]}`},
                      body: JSON.stringify({ order_id: orderId, product_id: selectedProduct.product_id, item_name: selectedProduct.product_name })
                    });
                    toast.success('Item added');
                    setOrderDialogOpen(false);
                  } catch(e:any){ toast.error(extractErrorMessage(e,'Failed to add item')); } finally { setAddingItem(false);} }}> {addingItem? 'Adding…' : 'Add to Order'} </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
