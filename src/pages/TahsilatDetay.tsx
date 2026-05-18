import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Printer, User, Calendar, DollarSign,
  Receipt, Banknote, FileText
} from 'lucide-react';
import { Card, Button, Badge, StatCard } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';

// Mock collection data
const mockCollection = {
  id: 1,
  customer: 'ABC Ticaret A.Ş.',
  customerId: 1,
  amount: 8500,
  currency: 'TRY',
  date: '2024-01-15',
  paymentMethod: 'cash',
  account: 'Kasa TL',
  referenceType: 'invoice',
  referenceId: 12,
  referenceNumber: 'FTR-2024-0012',
  description: 'Fatura #12 tahsilatı',
  status: 'completed',
  createdBy: 'Ahmet Yılmaz',
  createdAt: '2024-01-15 14:30',
};

export default function TahsilatDetay() {
  const { id } = useParams();
  const navigate = useNavigate();

  const collection = mockCollection;

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
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
              <Banknote className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Tahsilat</h1>
                <Badge variant="success">
                  {collection.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {collection.customer} • {formatDate(collection.date)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/tahsilatlar/${id}/duzenle`)}>
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
          value={formatCurrency(collection.amount)}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Tahsilat Tarihi"
          value={formatDate(collection.date)}
        />
        <StatCard
          icon={<Receipt className="w-5 h-5" />}
          label="Ödeme Yöntemi"
          value={collection.paymentMethod === 'cash' ? 'Nakit' : 'Banka'}
        />
        <StatCard
          icon={<Banknote className="w-5 h-5" />}
          label="Hesap"
          value={collection.account}
        />
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Tahsilat Bilgileri</h3>
          <dl className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">Müşteri</dt>
              <dd className="text-sm font-medium">{collection.customer}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">Tutar</dt>
              <dd className="text-sm font-bold text-green-600">{formatCurrency(collection.amount)}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">Para Birimi</dt>
              <dd className="text-sm font-medium">{collection.currency}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">Ödeme Yöntemi</dt>
              <dd className="text-sm font-medium">
                {collection.paymentMethod === 'cash' ? 'Nakit' : 'Banka Transferi'}
              </dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">Hesap</dt>
              <dd className="text-sm font-medium">{collection.account}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-sm text-gray-500">Kullanıcı</dt>
              <dd className="text-sm font-medium">{collection.createdBy}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Referans Bilgisi</h3>
          <dl className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">Referans Türü</dt>
              <dd className="text-sm font-medium">
                {collection.referenceType === 'invoice' ? 'Fatura' : 'Manuel'}
              </dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">Fatura Numarası</dt>
              <dd className="text-sm font-medium text-primary cursor-pointer hover:underline">
                {collection.referenceNumber}
              </dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">Tarih</dt>
              <dd className="text-sm font-medium">{formatDate(collection.date)}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-sm text-gray-500">Oluşturulma</dt>
              <dd className="text-sm font-medium">{collection.createdAt}</dd>
            </div>
          </dl>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Açıklama</h3>
          <p className="text-sm text-gray-600">{collection.description}</p>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => navigate(`/faturalar/${collection.referenceId}`)}>
              <FileText className="w-4 h-4" />
              Faturayı Gör
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/musteriler/${collection.customerId}`)}>
              <User className="w-4 h-4" />
              Müşteri Profili
            </Button>
            <Button variant="secondary" onClick={() => navigate('/tahsilatlar/yeni')}>
              <Receipt className="w-4 h-4" />
              Yeni Tahsilat
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}