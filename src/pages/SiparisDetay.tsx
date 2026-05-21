import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Printer, Building2, Calendar, Package,
  ShoppingCart, Send, Copy, Truck, CheckCircle, Clock, XCircle, Loader2
} from 'lucide-react';
import { Card, Button, Badge, StatCard, Alert } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { orderApi, thirdPartyApi, productApi } from '@/lib/dolibarr';
import type { Order, ThirdParty, Product } from '@/lib/types/dolibarr';

/*
// Mock order data - for testing only
const mockOrder = {
  id: 1,
  ref: 'SO-2024-001',
  type: 'order',
  customer: 'ABC Ticaret A.Ş.',
  customerId: 1,
  date: '2024-01-15',
  deliveryDate: '2024-01-20',
  paymentTerms: 30,
  status: 2,
  subtotal: 25600,
  discount: 0,
  vatAmount: 4608,
  total: 30208,
  currency: 'TRY',
  shippingAddress: 'İstanbul, Türkiye',
  notes: 'Acil teslimat talep edildi.',
  createdBy: 'Ahmet Yılmaz',
  createdAt: '2024-01-15',
};

const mockOrderItems = [
  { id: 1, product: 'Ürün A', quantity: 100, unitPrice: 150, vatRate: 18, total: 17700 },
  { id: 2, product: 'Ürün B', quantity: 40, unitPrice: 150, vatRate: 18, total: 7080 },
  { id: 3, product: 'Nakliye', quantity: 1, unitPrice: 1200, vatRate: 18, total: 1416 },
];
*/

const statusConfig: Record<number, { label: string; variant: 'gray' | 'info' | 'success' | 'warning' | 'danger' }> = {
  0: { label: 'Taslak', variant: 'gray' },
  1: { label: 'Onaylandı', variant: 'info' },
  2: { label: 'Sevk Edildi', variant: 'warning' },
  3: { label: 'Teslim Edildi', variant: 'success' },
  [-1]: { label: 'İptal', variant: 'danger' },
};

export default function SiparisDetay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'items' | 'info' | 'shipping'>('items');
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<ThirdParty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const orderId = parseInt(id);
      const orderData = await orderApi.get(orderId);
      setOrder(orderData);
      if (orderData.fk_soc) {
        const customerData = await thirdPartyApi.get(orderData.fk_soc).catch(() => null);
        setCustomer(customerData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sipariş yüklenirken hata oluştu');
      console.error('Order fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
        <p className="text-gray-500">Sipariş bilgileri yükleniyor...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <Alert type="error" title="Hata">
        {error || 'Sipariş bulunamadı'}
        <Button variant="secondary" onClick={() => navigate('/siparisler')} className="mt-4">
          Siparişlere Dön
        </Button>
      </Alert>
    );
  }

  const status = statusConfig[order.status || 0] || statusConfig[0];

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/siparisler')}
          className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Siparişlere Dön
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{order.ref}</h1>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {customer?.name || 'Müşteri'} • {formatDate(order.date_commande as string)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/siparisler/${id}/duzenle`)}>
              <Edit className="w-4 h-4" />
              Düzenle
            </Button>
            <Button variant="secondary">
              <Printer className="w-4 h-4" />
              Yazdır
            </Button>
            <Button variant="primary">
              <Truck className="w-4 h-4" />
              Sevk Et
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<ShoppingCart className="w-5 h-5" />}
          label="Toplam Tutar"
          value={formatCurrency(order.total_ttc)}
          iconColor="text-primary"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Sipariş Tarihi"
          value={formatDate(order.date_commande as string)}
        />
        <StatCard
          icon={<Truck className="w-5 h-5" />}
          label="Teslimat"
          value={order.date_livraison ? formatDate(order.date_livraison as string) : '-'}
        />
        <StatCard
          icon={<Package className="w-5 h-5" />}
          label="Kalem Sayısı"
          value={`${order.lines?.length || 0} ürün`}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('items')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'items'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Kalemler ({order.lines?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'shipping'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Teslimat
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bilgiler
          </button>
        </nav>
      </div>

      {activeTab === 'items' && (
        <>
          {/* Items Table */}
          <Card padding="none" className="mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Ürün / Hizmet</th>
                    <th className="px-4 py-3 text-right">Miktar</th>
                    <th className="px-4 py-3 text-right">Birim Fiyat</th>
                    <th className="px-4 py-3 text-right">KDV</th>
                    <th className="px-4 py-3 text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(order.lines || []).map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.label || item.description || `Kalem ${index + 1}`}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{item.qty}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.subprice || item.unitprice)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">%{item.tva_tx || 0}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(item.total_ttc || (item.qty && item.subprice ? item.qty * item.subprice : 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="px-4 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ara Toplam</span>
                    <span className="font-medium">{formatCurrency(order.total_ht)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">KDV</span>
                    <span className="font-medium">{formatCurrency(order.total_tva)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 text-base">
                    <span className="font-semibold">Genel Toplam</span>
                    <span className="font-bold text-primary">{formatCurrency(order.total_ttc)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {activeTab === 'shipping' && (
        <Card>
          <div className="space-y-6">
            {/* Shipping Status */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Sevk Durumu</h3>
                <p className="text-sm text-gray-600">
                  {order.status === 3 ? 'Sipariş teslim edildi' : order.status === 2 ? 'Sipariş sevk edildi, yolda' : 'Sevk bekleniyor'}
                </p>
              </div>
              {order.status && order.status < 3 && (
                <Button variant="primary" size="sm" className="ml-auto">
                  Sevk Et
                </Button>
              )}
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Sipariş Takibi</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="w-0.5 h-8 bg-gray-200" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Sipariş Oluşturuldu</p>
                    <p className="text-sm text-gray-500">{formatDate(order.date_creation as string)}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${(order.status || 0) >= 1 ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <CheckCircle className={`w-4 h-4 ${(order.status || 0) >= 1 ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="w-0.5 h-8 bg-gray-200" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Onaylandı</p>
                    <p className="text-sm text-gray-500">Sipariş onaylandı ve hazırlanmaya başlandı</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${(order.status || 0) >= 2 ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Truck className={`w-4 h-4 ${(order.status || 0) >= 2 ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="w-0.5 h-8 bg-gray-200" />
                  </div>
                  <div>
                    <p className={`font-medium ${(order.status || 0) >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>Sevk Edildi</p>
                    <p className="text-sm text-gray-500">
                      {(order.status || 0) >= 2 ? `Teslimat tarihi: ${formatDate(order.date_livraison as string)}` : 'Henüz sevk edilmedi'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${(order.status || 0) >= 3 ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <CheckCircle className={`w-4 h-4 ${(order.status || 0) >= 3 ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                  </div>
                  <div>
                    <p className={`font-medium ${(order.status || 0) >= 3 ? 'text-gray-900' : 'text-gray-400'}`}>Teslim Edildi</p>
                    <p className="text-sm text-gray-500">
                      {(order.status || 0) >= 3 ? 'Müşteri siparişi teslim aldı' : 'Bekleniyor'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'info' && (
        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Info */}
            {customer && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Müşteri Bilgileri</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-500">ID: {customer.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Sipariş Bilgileri</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Sipariş No</span>
                  <span className="font-medium">{order.ref}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sipariş Tarihi</span>
                  <span>{formatDate(order.date_commande as string)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Teslimat Tarihi</span>
                  <span>{order.date_livraison ? formatDate(order.date_livraison as string) : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ödeme Vadesi</span>
                  <span>{order.fk_cond_reglement || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(order.note_public || order.note_private) && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Notlar</h3>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4">{order.note_public || order.note_private}</p>
            </div>
          )}
        </Card>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap gap-3">
        {order.status === 0 && (
          <Button variant="primary" icon={<Send className="w-4 h-4" />}>
            Onaya Gönder
          </Button>
        )}
        {order.status === 1 && (
          <Button variant="primary" icon={<Truck className="w-4 h-4" />}>
            Sevk Et
          </Button>
        )}
        {order.status === 2 && (
          <Button variant="primary" icon={<CheckCircle className="w-4 h-4" />} className="bg-green-600 hover:bg-green-700">
            Teslim Edildi Olarak İşaretle
          </Button>
        )}
        <Button variant="secondary" icon={<Copy className="w-4 h-4" />}>
          Kopyasını Oluştur
        </Button>
        <Button variant="secondary" icon={<Printer className="w-4 h-4" />}>
          Yazdır
        </Button>
        <Button variant="secondary" icon={<Edit className="w-4 h-4" />} onClick={() => navigate(`/siparisler/${id}/duzenle`)}>
          Düzenle
        </Button>
        {order.status && order.status >= 0 && (
          <Button variant="secondary" icon={<XCircle className="w-4 h-4" />} className="text-red-600 hover:bg-red-50">
            İptal Et
          </Button>
        )}
      </div>
    </div>
  );
}