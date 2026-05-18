import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Printer, Building2, Calendar, Package,
  FileText, Send, Copy, CheckCircle, Clock, XCircle, Trash2
} from 'lucide-react';
import { Card, Button, Badge, StatCard } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';

// Mock proposal data
const mockProposal = {
  id: 1,
  ref: 'PRP-2024-001',
  type: 'proposal',
  customer: 'ABC Ticaret A.Ş.',
  customerId: 1,
  date: '2024-01-15',
  validUntil: '2024-01-30',
  paymentTerms: 30,
  status: 1,
  subtotal: 38220,
  discount: 0,
  vatAmount: 6880,
  total: 45100,
  currency: 'TRY',
  notes: 'Bu teklif 15 gün geçerlidir. Ödeme vadesi 30 gündür.',
  createdBy: 'Ahmet Yılmaz',
  createdAt: '2024-01-15',
};

const proposalItems = [
  { id: 1, product: 'Ürün A', quantity: 100, unitPrice: 150, vatRate: 18, total: 17700 },
  { id: 2, product: 'Ürün B', quantity: 80, unitPrice: 150, vatRate: 18, total: 14160 },
  { id: 3, product: 'Ürün C', quantity: 50, unitPrice: 126, vatRate: 18, total: 7434 },
  { id: 4, product: 'Nakliye', quantity: 1, unitPrice: 5000, vatRate: 18, total: 5900 },
];

const statusConfig: Record<number, { label: string; variant: 'gray' | 'info' | 'success' | 'warning' | 'danger' }> = {
  0: { label: 'Taslak', variant: 'gray' },
  1: { label: 'Gönderildi', variant: 'info' },
  2: { label: 'İmzalandı', variant: 'success' },
  3: { label: 'İmzalanmadı', variant: 'warning' },
  4: { label: 'Kazanıldı', variant: 'success' },
  5: { label: 'Kaybedildi', variant: 'danger' },
};

export default function TeklifDetay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'items' | 'info'>('items');

  const proposal = mockProposal;
  const status = statusConfig[proposal.status] || statusConfig[0];

  const isExpired = new Date(proposal.validUntil) < new Date();

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/teklifler')}
          className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tekliflere Dön
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{proposal.ref}</h1>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {proposal.customer} • {formatDate(proposal.date)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/teklifler/${id}/duzenle`)}>
              <Edit className="w-4 h-4" />
              Düzenle
            </Button>
            <Button variant="secondary">
              <Printer className="w-4 h-4" />
              Yazdır
            </Button>
            <Button variant="primary">
              <Send className="w-4 h-4" />
              Gönder
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          label="Toplam Tutar"
          value={formatCurrency(proposal.total)}
          iconColor="text-primary"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Geçerlilik"
          value={formatDate(proposal.validUntil)}
          iconColor={isExpired ? 'text-danger' : 'text-gray-500'}
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Ödeme Vadesi"
          value={`${proposal.paymentTerms} gün`}
        />
        <StatCard
          icon={<Package className="w-5 h-5" />}
          label="Kalem Sayısı"
          value={`${proposalItems.length} ürün`}
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
            Kalemler ({proposalItems.length})
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
                  {proposalItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.product}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">%{item.vatRate}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(item.total)}</td>
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
                    <span className="font-medium">{formatCurrency(proposal.subtotal)}</span>
                  </div>
                  {proposal.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>İskonto</span>
                      <span>-{formatCurrency(proposal.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">KDV</span>
                    <span className="font-medium">{formatCurrency(proposal.vatAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 text-base">
                    <span className="font-semibold">Genel Toplam</span>
                    <span className="font-bold text-primary">{formatCurrency(proposal.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {activeTab === 'info' && (
        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Müşteri Bilgileri</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{proposal.customer}</p>
                    <p className="text-sm text-gray-500">Müşteri ID: {proposal.customerId}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Proposal Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Teklif Bilgileri</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Teklif No</span>
                  <span className="font-medium">{proposal.ref}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tarih</span>
                  <span>{formatDate(proposal.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Geçerlilik</span>
                  <span className={isExpired ? 'text-red-600' : 'text-gray-900'}>
                    {formatDate(proposal.validUntil)}
                    {isExpired && ' (Süresi dolmuş)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ödeme Vadesi</span>
                  <span>{proposal.paymentTerms} gün</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Oluşturan</span>
                  <span>{proposal.createdBy}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {proposal.notes && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Notlar</h3>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4">{proposal.notes}</p>
            </div>
          )}
        </Card>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap gap-3">
        {proposal.status === 0 && (
          <Button variant="primary" icon={<Send className="w-4 h-4" />}>
            Müşteriye Gönder
          </Button>
        )}
        {proposal.status === 1 && (
          <>
            <Button variant="primary" icon={<CheckCircle className="w-4 h-4" />} className="bg-green-600 hover:bg-green-700">
              Kazanıldı Olarak İşaretle
            </Button>
            <Button variant="secondary" icon={<XCircle className="w-4 h-4" />}>
              Kaybedildi Olarak İşaretle
            </Button>
          </>
        )}
        <Button variant="secondary" icon={<Copy className="w-4 h-4" />}>
          Kopyasını Oluştur
        </Button>
        <Button variant="secondary" icon={<Printer className="w-4 h-4" />}>
          Yazdır
        </Button>
        <Button variant="secondary" icon={<Edit className="w-4 h-4" />} onClick={() => navigate(`/teklifler/${id}/duzenle`)}>
          Düzenle
        </Button>
      </div>
    </div>
  );
}