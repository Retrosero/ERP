import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Printer, Building2, Calendar, Package,
  Receipt, DollarSign, FileText, Download
} from 'lucide-react';
import { Card, Button, Badge, StatCard } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';

// Mock invoice data
const mockInvoice = {
  id: 1,
  number: 'AFT-2024-0001',
  type: 'purchase',
  supplier: 'ABC Tedarikçi A.Ş.',
  supplierId: 1,
  date: '2024-01-15',
  dueDate: '2024-02-15',
  paymentStatus: 'pending',
  subtotal: 15000,
  vatAmount: 2700,
  total: 17700,
  currency: 'TRY',
  paymentMethod: 'bank_transfer',
  account: 'Garanti BBVA',
  notes: 'Ocak ayı mal alımı',
  status: 'draft',
  createdBy: 'Ahmet Yılmaz',
  createdAt: '2024-01-15',
};

const invoiceItems = [
  { id: 1, product: 'Ürün A', quantity: 100, unitPrice: 50, vatRate: 18, total: 5900 },
  { id: 2, product: 'Ürün B', quantity: 80, unitPrice: 50, vatRate: 18, total: 4720 },
  { id: 3, product: 'Ürün C', quantity: 100, unitPrice: 50, vatRate: 18, total: 5900 },
  { id: 4, product: 'Nakliye', quantity: 1, unitPrice: 1000, vatRate: 18, total: 1180 },
];

export default function AlisFaturaDetay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'items'>('items');

  const invoice = mockInvoice;

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/faturalar')}
          className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Faturalara Dön
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{invoice.number}</h1>
                <Badge variant={invoice.paymentStatus === 'paid' ? 'success' : 'warning'}>
                  {invoice.paymentStatus === 'paid' ? 'Ödendi' : 'Bekliyor'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {invoice.supplier} • {formatDate(invoice.date)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/faturalar/${id}/duzenle`)}>
              <Edit className="w-4 h-4" />
              Düzenle
            </Button>
            <Button variant="secondary">
              <Printer className="w-4 h-4" />
              Yazdır
            </Button>
            <Button variant="secondary">
              <Download className="w-4 h-4" />
              İndir
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Toplam Tutar"
          value={formatCurrency(invoice.total)}
          iconColor="text-primary"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Fatura Tarihi"
          value={formatDate(invoice.date)}
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Vade Tarihi"
          value={formatDate(invoice.dueDate)}
        />
        <StatCard
          icon={<Receipt className="w-5 h-5" />}
          label="Durum"
          value={invoice.paymentStatus === 'paid' ? 'Ödendi' : 'Bekliyor'}
          iconColor={invoice.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}
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
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'items'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Kalemler
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Fatura Bilgileri</h3>
            <dl className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Fatura Numarası</dt>
                <dd className="text-sm font-medium">{invoice.number}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Tür</dt>
                <dd className="text-sm font-medium">Alış Faturası</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Tedarikçi</dt>
                <dd className="text-sm font-medium">{invoice.supplier}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Ödeme Yöntemi</dt>
                <dd className="text-sm font-medium">
                  {invoice.paymentMethod === 'bank_transfer' ? 'Banka Havalesi' : 'Nakit'}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-sm text-gray-500">Hesap</dt>
                <dd className="text-sm font-medium">{invoice.account}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Tarih ve Ödeme</h3>
            <dl className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Fatura Tarihi</dt>
                <dd className="text-sm font-medium">{formatDate(invoice.date)}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Vade Tarihi</dt>
                <dd className="text-sm font-medium">{formatDate(invoice.dueDate)}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Oluşturan</dt>
                <dd className="text-sm font-medium">{invoice.createdBy}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-sm text-gray-500">Oluşturma</dt>
                <dd className="text-sm font-medium">{formatDate(invoice.createdAt)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="lg:col-span-2">
            <h3 className="font-semibold text-gray-900 mb-4">Notlar</h3>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </Card>
        </div>
      )}

      {activeTab === 'items' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                  <th className="pb-3">Ürün / Hizmet</th>
                  <th className="pb-3 text-right">Miktar</th>
                  <th className="pb-3 text-right">Birim Fiyat</th>
                  <th className="pb-3 text-right">KDV %</th>
                  <th className="pb-3 text-right">Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoiceItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 text-sm font-medium">{item.product}</td>
                    <td className="py-3 text-sm text-right">{item.quantity}</td>
                    <td className="py-3 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 text-sm text-right">%{item.vatRate}</td>
                    <td className="py-3 text-sm text-right font-medium">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="py-3 text-sm font-medium text-right">Ara Toplam:</td>
                  <td className="py-3 text-sm text-right font-medium">{formatCurrency(invoice.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="py-3 text-sm font-medium text-right">KDV:</td>
                  <td className="py-3 text-sm text-right font-medium">{formatCurrency(invoice.vatAmount)}</td>
                </tr>
                <tr className="border-t-2 border-primary">
                  <td colSpan={4} className="py-3 text-lg font-bold text-right">Genel Toplam:</td>
                  <td className="py-3 text-lg font-bold text-primary text-right">
                    {formatCurrency(invoice.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}