import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Building2,
  History, DollarSign, FileText, ShoppingCart, Calendar, Loader2
} from 'lucide-react';
import { Card, Button, Badge, StatCard, Alert } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { thirdPartyApi, orderApi, invoiceApi } from '@/lib/dolibarr';
import type { ThirdParty, Order, Invoice } from '@/lib/types/dolibarr';

/*
// Mock customer data - for testing only
const mockCustomer = {
  id: 1,
  type: 'company',
  companyName: 'ABC Ticaret A.Ş.',
  taxNumber: '1234567890',
  email: 'info@abcticaret.com',
  phone: '0212 555 1234',
  mobile: '0532 555 1234',
  address: 'Atatürk Cad. No:123 Kadıköy, İstanbul',
  city: 'İstanbul',
  district: 'Kadıköy',
  status: 'active',
  paymentTerms: 30,
  creditLimit: 50000,
  currentDebt: 12500,
  totalOrders: 24,
  lastOrderDate: '2024-01-15',
  createdAt: '2023-06-10',
};

const mockRecentInvoices = [
  { id: 1, number: 'FTR-2024-0012', date: '2024-01-10', amount: 8500, status: 'pending' },
  { id: 2, number: 'FTR-2024-0010', date: '2024-01-05', amount: 4200, status: 'paid' },
  { id: 3, number: 'FTR-2023-0089', date: '2023-12-28', amount: 6800, status: 'paid' },
];

const mockRecentOrders = [
  { id: 1, number: 'ORD-2024-0023', date: '2024-01-15', amount: 3500, status: 'delivered' },
  { id: 2, number: 'ORD-2024-0020', date: '2024-01-12', amount: 2100, status: 'processing' },
];
*/

export default function MusteriDetay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'invoices'>('info');
  const [customer, setCustomer] = useState<ThirdParty | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const customerId = parseInt(id);
      const [customerData, ordersData, invoicesData] = await Promise.all([
        thirdPartyApi.get(customerId),
        orderApi.list({ thirdparty_id: customerId, limit: 10 }).catch(() => []),
        invoiceApi.list({ thirdparty_id: customerId, limit: 10 }).catch(() => []),
      ]);
      setCustomer(customerData);
      setOrders(ordersData);
      setInvoices(invoicesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Müşteri yüklenirken hata oluştu');
      console.error('Customer fetch error:', err);
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
        <p className="text-gray-500">Müşteri bilgileri yükleniyor...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <Alert type="error" title="Hata">
        {error || 'Müşteri bulunamadı'}
        <Button variant="secondary" onClick={() => navigate('/musteriler')} className="mt-4">
          Müşterilere Dön
        </Button>
      </Alert>
    );
  }

  const remainingCredit = (customer.capital || 0) - (invoices.reduce((sum, inv) => sum + (inv.total_ttc || 0), 0) - invoices.reduce((sum, inv) => sum + (inv.total_paye || 0), 0));

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/musteriler')}
          className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Müşterilere Dön
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                <Badge variant={customer.client === 1 ? 'success' : customer.client === 2 ? 'info' : 'warning'}>
                  {customer.client === 1 ? 'Müşteri' : customer.client === 2 ? 'Tedarikçi' : 'Her İkisi'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {customer.code_client || customer.code_fournisseur || `ID: ${customer.id}`} • {customer.town || customer.zip || ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/musteriler/${id}/duzenle`)}>
              <Edit className="w-4 h-4" />
              Düzenle
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Bakiye"
          value={formatCurrency(invoices.reduce((sum, inv) => sum + (inv.remain_to_pay || 0), 0))}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Kredi Limiti"
          value={formatCurrency(customer.capital || 0)}
          iconColor="text-primary"
        />
        <StatCard
          icon={<ShoppingCart className="w-5 h-5" />}
          label="Toplam Sipariş"
          value={orders.length}
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Son Sipariş"
          value={orders.length > 0 ? formatDate(orders[0].date_commande as string) : '-'}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'info'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Bilgiler
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Siparişler
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'invoices'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Faturalar
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">İletişim Bilgileri</h3>
            <dl className="space-y-3">
              <div className="flex items-start gap-3 py-2 border-b border-gray-100">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <dt className="text-xs text-gray-400">E-posta</dt>
                  <dd className="text-sm font-medium">{customer.email || '-'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 py-2 border-b border-gray-100">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <dt className="text-xs text-gray-400">Telefon</dt>
                  <dd className="text-sm font-medium">{customer.phone || '-'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 py-2 border-b border-gray-100">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <dt className="text-xs text-gray-400">Faks</dt>
                  <dd className="text-sm font-medium">{customer.fax || '-'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 py-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <dt className="text-xs text-gray-400">Adres</dt>
                  <dd className="text-sm font-medium">
                    {[customer.address, customer.zip, customer.town].filter(Boolean).join(', ') || '-'}
                  </dd>
                </div>
              </div>
            </dl>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Ticari Bilgiler</h3>
            <dl className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Vergi Numarası</dt>
                <dd className="text-sm font-medium">{customer.vat_number || '-'}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Müşteri Kodu</dt>
                <dd className="text-sm font-medium">{customer.code_client || '-'}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Tedarikçi Kodu</dt>
                <dd className="text-sm font-medium">{customer.code_fournisseur || '-'}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-sm text-gray-500">Kredi Limiti</dt>
                <dd className="text-sm font-medium">{formatCurrency(customer.capital || 0)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="lg:col-span-2">
            <h3 className="font-semibold text-gray-900 mb-4">Son Faturalar</h3>
            {invoices.length === 0 ? (
              <p className="text-gray-500 text-sm">Fatura bulunamadı</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                      <th className="pb-3">Fatura No</th>
                      <th className="pb-3">Tarih</th>
                      <th className="pb-3 text-right">Tutar</th>
                      <th className="pb-3 text-right">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/faturalar/${invoice.ref}`)}>
                        <td className="py-3 text-sm font-medium">{invoice.ref}</td>
                        <td className="py-3 text-sm text-gray-500">{formatDate(invoice.date as string)}</td>
                        <td className="py-3 text-sm text-right">{formatCurrency(invoice.total_ttc)}</td>
                        <td className="py-3 text-right">
                          <Badge variant={invoice.status === 2 ? 'success' : 'warning'}>
                            {invoice.status === 2 ? 'Ödendi' : invoice.status === 1 ? 'Ödenmedi' : 'İptal'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'orders' && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Son Siparişler</h3>
          {orders.length === 0 ? (
            <p className="text-gray-500 text-sm">Sipariş bulunamadı</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                    <th className="pb-3">Sipariş No</th>
                    <th className="pb-3">Tarih</th>
                    <th className="pb-3 text-right">Tutar</th>
                    <th className="pb-3 text-right">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/siparisler/${order.ref}`)}>
                      <td className="py-3 text-sm font-medium">{order.ref}</td>
                      <td className="py-3 text-sm text-gray-500">{formatDate(order.date_commande as string)}</td>
                      <td className="py-3 text-sm text-right">{formatCurrency(order.total_ttc)}</td>
                      <td className="py-3 text-right">
                        <Badge variant={order.status === 3 ? 'success' : order.status === 1 ? 'info' : 'gray'}>
                          {order.label_status || (order.status === 3 ? 'Teslim Edildi' : order.status === 1 ? 'Onaylandı' : 'Taslak')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'invoices' && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Faturalar</h3>
          {invoices.length === 0 ? (
            <p className="text-gray-500 text-sm">Fatura bulunamadı</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                    <th className="pb-3">Fatura No</th>
                    <th className="pb-3">Tarih</th>
                    <th className="pb-3 text-right">Tutar</th>
                    <th className="pb-3 text-right">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/faturalar/${invoice.ref}`)}>
                      <td className="py-3 text-sm font-medium">{invoice.ref}</td>
                      <td className="py-3 text-sm text-gray-500">{formatDate(invoice.date as string)}</td>
                      <td className="py-3 text-sm text-right">{formatCurrency(invoice.total_ttc)}</td>
                      <td className="py-3 text-right">
                        <Badge variant={invoice.status === 2 ? 'success' : 'warning'}>
                          {invoice.status === 2 ? 'Ödendi' : invoice.status === 1 ? 'Ödenmedi' : 'İptal'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}