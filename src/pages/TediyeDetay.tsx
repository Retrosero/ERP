import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Printer, Building2, Calendar, DollarSign,
  Receipt, Truck, FileText
} from 'lucide-react';
import { Card, Button, Badge, StatCard } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';

// Mock payment data
const mockPayment = {
  id: 1,
  type: 'expense',
  supplier: 'ABC Tedarikçi A.Ş.',
  supplierId: 1,
  amount: 15000,
  currency: 'TRY',
  date: '2024-01-15',
  dueDate: '2024-02-15',
  paymentMethod: 'bank_transfer',
  account: 'Garanti BBVA',
  referenceNumber: 'FAT-2024-0056',
  category: 'Mal Alımı',
  description: 'Ocak ayı mal alımı',
  status: 'paid',
  createdBy: 'Ahmet Yılmaz',
  createdAt: '2024-01-15',
};

const invoiceItems = [
  { id: 1, product: 'Ürün A', quantity: 100, unitPrice: 50, total: 5000 },
  { id: 2, product: 'Ürün B', quantity: 50, unitPrice: 100, total: 5000 },
  { id: 3, product: 'Ürün C', quantity: 100, unitPrice: 50, total: 5000 },
];

export default function TediyeDetay() {
  const { id } = useParams();
  const navigate = useNavigate();

  const payment = mockPayment;

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/tahsilatlar')}
          className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tahsilatlara Dön
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{payment.referenceNumber}</h1>
                <Badge variant={payment.status === 'paid' ? 'success' : 'warning'}>
                  {payment.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {payment.supplier} • {formatDate(payment.date)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/tediye/${id}/duzenle`)}>
              <Edit className="w-4 h-4" />
              Düzenle
            </Button>
            <Button variant="secondary">
              <Printer className="w-4 h-4" />
              Yazdır
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Tutar"
          value={formatCurrency(payment.amount)}
          iconColor="text-primary"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Ödeme Tarihi"
          value={formatDate(payment.date)}
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Vade Tarihi"
          value={formatDate(payment.dueDate)}
        />
        <StatCard
          icon={<Receipt className="w-5 h-5" />}
          label="Ödeme Yöntemi"
          value={payment.paymentMethod === 'bank_transfer' ? 'Havale' : 'Nakit'}
        />
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Ödeme Bilgileri</h3>
          <dl className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">Referans No</dt>
              <dd className="text-sm font-medium">{payment.referenceNumber}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">Tedarikçi</dt>
              <dd className="text-sm font-medium">{payment.supplier}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">Kategori</dt>
              <dd className="text-sm font-medium">{payment.category}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">Ödeme Yöntemi</dt>
              <dd className="text-sm font-medium">
                {payment.paymentMethod === 'bank_transfer' ? 'Banka Havalesi' : 'Nakit'}
              </dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">Çıkış Hesabı</dt>
              <dd className="text-sm font-medium">{payment.account}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-sm text-gray-500">Kullanıcı</dt>
              <dd className="text-sm font-medium">{payment.createdBy}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Tarih Bilgileri</h3>
          <dl className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">Ödeme Tarihi</dt>
              <dd className="text-sm font-medium">{formatDate(payment.date)}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">Vade Tarihi</dt>
              <dd className="text-sm font-medium">{formatDate(payment.dueDate)}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-sm text-gray-500">Oluşturulma</dt>
              <dd className="text-sm font-medium">{formatDate(payment.createdAt)}</dd>
            </div>
          </dl>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Açıklama</h3>
          <p className="text-sm text-gray-600">{payment.description}</p>
        </Card>

        {/* Invoice Items */}
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Fatura Kalemleri</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                  <th className="pb-3">Ürün</th>
                  <th className="pb-3 text-right">Miktar</th>
                  <th className="pb-3 text-right">Birim Fiyat</th>
                  <th className="pb-3 text-right">Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoiceItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 text-sm font-medium">{item.product}</td>
                    <td className="py-3 text-sm text-right">{item.quantity}</td>
                    <td className="py-3 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 text-sm text-right font-medium">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={3} className="py-3 text-sm font-semibold text-right">Toplam:</td>
                  <td className="py-3 text-sm font-bold text-right">
                    {formatCurrency(invoiceItems.reduce((sum, item) => sum + item.total, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}