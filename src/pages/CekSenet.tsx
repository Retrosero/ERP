import { useState } from 'react';
import {
  Plus, FileCheck, FileX, Search, Filter, Download,
  CheckCircle, XCircle, ArrowRightLeft, Calendar,
  AlertCircle, Eye
} from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Card, Button, Input, Select, Table, Badge, Modal, StatCard } from '@/components/ui';
import type { Check, PromissoryNote, CheckStatus, CHECK_STATUS_LABELS } from '@/lib/types/cek-senet';

// Mock data
const mockChecks: Check[] = [
  { id: 1, type: 'check', direction: 'received', serial_number: 'CHK-2024-001', bank_code: 'GAR', branch_code: '1234', account_number: '****5678', amount: 15000, currency: 'TRY', issue_date: '2024-01-10', due_date: '2024-02-10', drawer_name: 'ABC Ticaret A.Ş.', beneficiary_name: 'Bizim Firma', status: 'in_portfolio' },
  { id: 2, type: 'check', direction: 'received', serial_number: 'CHK-2024-002', bank_code: 'AKB', branch_code: '5678', account_number: '****9012', amount: 8500, currency: 'TRY', issue_date: '2024-01-12', due_date: '2024-02-12', drawer_name: 'XYZ Ltd. Şti.', beneficiary_name: 'Bizim Firma', status: 'collected' },
  { id: 3, type: 'check', direction: 'issued', serial_number: 'CHK-2024-003', bank_code: 'ISB', branch_code: '3456', account_number: '****3456', amount: 12000, currency: 'TRY', issue_date: '2024-01-08', due_date: '2024-02-08', drawer_name: 'Bizim Firma', beneficiary_name: 'Tedarikçi A', status: 'sent_to_bank' },
  { id: 4, type: 'check', direction: 'received', serial_number: 'CHK-2024-004', bank_code: 'GAR', branch_code: '7890', account_number: '****7890', amount: 22000, currency: 'TRY', issue_date: '2024-01-15', due_date: '2024-03-15', drawer_name: 'Müşteri B', beneficiary_name: 'Bizim Firma', status: 'in_portfolio' },
  { id: 5, type: 'check', direction: 'received', serial_number: 'CHK-2024-005', bank_code: 'AKB', branch_code: '1234', account_number: '****1234', amount: 5500, currency: 'TRY', issue_date: '2024-01-05', due_date: '2024-01-25', drawer_name: 'Müşteri C', beneficiary_name: 'Bizim Firma', status: 'pending' },
];

const mockNotes: PromissoryNote[] = [
  { id: 1, type: 'promissory', direction: 'received', serial_number: 'SEN-2024-001', amount: 10000, currency: 'TRY', issue_date: '2024-01-08', due_date: '2024-04-08', drawer_name: 'ABC Ticaret', status: 'in_portfolio' },
  { id: 2, type: 'promissory', direction: 'received', serial_number: 'SEN-2024-002', amount: 7500, currency: 'TRY', issue_date: '2024-01-10', due_date: '2024-02-10', drawer_name: 'Müşteri D', status: 'collected' },
];

const statusConfig: Record<CheckStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'gray' }> = {
  pending: { label: 'Beklemede', variant: 'gray' },
  in_portfolio: { label: 'Portföyde', variant: 'info' },
  sent_to_bank: { label: 'Bankaya Gönderildi', variant: 'warning' },
  collected: { label: 'Tahsil Edildi', variant: 'success' },
  returned: { label: 'İade', variant: 'warning' },
  transferred: { label: 'Ciro Edildi', variant: 'info' },
  protested: { label: 'Protestolu', variant: 'danger' },
  cancelled: { label: 'İptal', variant: 'gray' },
};

export default function CekSenet() {
  const [activeTab, setActiveTab] = useState<'received' | 'issued'>('received');
  const [activeType, setActiveType] = useState<'check' | 'promissory'>('check');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Check | PromissoryNote | null>(null);

  const allChecks = [...mockChecks, ...mockNotes];
  const filteredItems = allChecks.filter(item => {
    if (item.type !== activeType) return false;
    if (item.direction !== activeTab) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        item.serial_number.toLowerCase().includes(search) ||
        ('drawer_name' in item && item.drawer_name.toLowerCase().includes(search))
      );
    }
    return true;
  });

  const totalAmount = filteredItems.reduce((sum, item) => sum + item.amount, 0);
  const pendingCount = filteredItems.filter(i => i.status === 'pending' || i.status === 'in_portfolio').length;
  const dueSoonCount = filteredItems.filter(i => {
    const dueDate = new Date(i.due_date);
    const today = new Date();
    const diff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 7 && diff >= 0;
  }).length;

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Çek ve Senet Yönetimi</h1>
          <p className="page-subtitle">Alınan ve verilen çek/senetlerinizi takip edin</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Yeni Çek/Senet
        </Button>
      </div>

      {/* Type Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveType('check')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeType === 'check' ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          <FileCheck className="w-4 h-4 inline mr-2" />
          Çek
        </button>
        <button
          onClick={() => setActiveType('promissory')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeType === 'promissory' ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          <FileX className="w-4 h-4 inline mr-2" />
          Senet
        </button>
      </div>

      {/* Direction Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'received'
              ? 'bg-green-100 text-green-700 border-2 border-green-500'
              : 'bg-gray-50 text-gray-600 border border-gray-200'
          }`}
        >
          <FileCheck className="w-4 h-4 inline mr-2" />
          Alınan
        </button>
        <button
          onClick={() => setActiveTab('issued')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'issued'
              ? 'bg-red-100 text-red-700 border-2 border-red-500'
              : 'bg-gray-50 text-gray-600 border border-gray-200'
          }`}
        >
          <FileX className="w-4 h-4 inline mr-2" />
          Verilen
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Toplam Tutar"
          value={totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          icon={activeTab === 'received' ? FileCheck : FileX}
        />
        <StatCard
          title="Portföyde"
          value={String(pendingCount)}
          icon={FileCheck}
          variant="info"
        />
        <StatCard
          title="Yaklaşan Vade"
          value={String(dueSoonCount)}
          icon={Calendar}
          variant="warning"
        />
        <StatCard
          title="Tahsil Edilen"
          value={filteredItems.filter(i => i.status === 'collected').reduce((sum, i) => sum + i.amount, 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 p-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Çek/Senet numarası veya çek sahibi ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={[
              { value: '', label: 'Tüm Durumlar' },
              { value: 'pending', label: 'Beklemede' },
              { value: 'in_portfolio', label: 'Portföyde' },
              { value: 'sent_to_bank', label: 'Bankaya Gönderildi' },
              { value: 'collected', label: 'Tahsil Edildi' },
              { value: 'returned', label: 'İade' },
              { value: 'transferred', label: 'Ciro Edildi' },
            ]}
            className="w-48"
          />
          <Button variant="ghost">
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="ghost">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={[
            {
              key: 'serial_number',
              header: 'Sıra No',
              render: (value) => <span className="font-mono font-medium">{value as string}</span>,
            },
            {
              key: 'drawer_name',
              header: activeTab === 'received' ? 'Çek Sahibi' : 'Lehtar',
            },
            {
              key: 'issue_date',
              header: 'Düzenlenme',
              render: (value) => new Date(value as string).toLocaleDateString('tr-TR'),
            },
            {
              key: 'due_date',
              header: 'Vade',
              render: (value) => {
                const date = new Date(value as string);
                const today = new Date();
                const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                let className = 'text-gray-900';
                if (diff < 0) className = 'text-red-600';
                else if (diff <= 7) className = 'text-orange-600';
                else if (diff <= 14) className = 'text-yellow-600';
                return <span className={className}>{date.toLocaleDateString('tr-TR')}</span>;
              },
            },
            {
              key: 'amount',
              header: 'Tutar',
              render: (value) => (
                <span className="font-semibold">
                  {(value as number).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Durum',
              render: (value) => {
                const config = statusConfig[value as CheckStatus];
                return <Badge variant={config.variant}>{config.label}</Badge>;
              },
            },
            {
              key: 'actions',
              header: 'İşlemler',
              render: (_, row) => {
                const item = row as unknown as Check | PromissoryNote;
                return (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedItem(item)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {item.status === 'in_portfolio' && (
                      <Button variant="ghost" size="sm" title="Bankaya Gönder">
                        <ArrowRightLeft className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              },
            },
          ]}
          data={filteredItems as unknown as Record<string, unknown>[]}
          emptyMessage="Çek veya senet bulunamadı"
        />
      </Card>

      {/* New Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Yeni ${activeType === 'check' ? 'Çek' : 'Senet'} ${activeTab === 'received' ? 'Alımı' : 'Verilişi'}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Sıra Numarası</label>
              <Input placeholder={activeType === 'check' ? 'CHK-2024-006' : 'SEN-2024-003'} />
            </div>
            <div>
              <label className="label">Tutar</label>
              <Input type="number" placeholder="0,00" />
            </div>
          </div>
          {activeType === 'check' && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Banka Kodu</label>
                <Input placeholder="GAR" />
              </div>
              <div>
                <label className="label">Şube Kodu</label>
                <Input placeholder="1234" />
              </div>
              <div>
                <label className="label">Hesap Numarası</label>
                <Input placeholder="****5678" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Düzenlenme Tarihi</label>
              <Input type="date" />
            </div>
            <div>
              <label className="label">Vade Tarihi</label>
              <Input type="date" />
            </div>
          </div>
          <div>
            <label className="label">{activeTab === 'received' ? 'Çek Sahibi (Keşideci)' : 'Lehtar'}</label>
            <Input placeholder="Firma adı..." />
          </div>
          <div>
            <label className="label">Notlar</label>
            <Input placeholder="Opsiyonel not..." />
          </div>
        </div>
        <Modal.Footer className="mt-6">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>İptal</Button>
          <Button variant="primary">Kaydet</Button>
        </Modal.Footer>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={`${selectedItem?.type === 'check' ? 'Çek' : 'Senet'} Detayı`}
        size="md"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Sıra No</label>
                <p className="font-mono font-medium">{selectedItem.serial_number}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Tutar</label>
                <p className="font-semibold text-lg">
                  {selectedItem.amount.toLocaleString('tr-TR', { style: 'currency', currency: selectedItem.currency })}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Düzenlenme</label>
                <p>{new Date(selectedItem.issue_date).toLocaleDateString('tr-TR')}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Vade</label>
                <p>{new Date(selectedItem.due_date).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Çek Sahibi</label>
              <p>{('drawer_name' in selectedItem ? selectedItem.drawer_name : '-')}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Durum</label>
              <Badge variant={statusConfig[selectedItem.status].variant}>
                {statusConfig[selectedItem.status].label}
              </Badge>
            </div>
          </div>
        )}
        <Modal.Footer className="mt-6">
          <Button variant="secondary" onClick={() => setSelectedItem(null)}>Kapat</Button>
          {selectedItem && selectedItem.status === 'in_portfolio' && (
            <Button variant="primary">Bankaya Gönder</Button>
          )}
        </Modal.Footer>
      </Modal>
    </MainLayout>
  );
}