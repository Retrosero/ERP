import { useState, useEffect } from 'react';
import {
  Plus, Wallet, Building2, ArrowUpRight, ArrowDownLeft,
  ArrowLeftRight, Search, Filter, Download, TrendingUp,
  CreditCard, Receipt, ChevronRight, X
} from 'lucide-react';
import { Card, Button, Input, Select, Table, Badge, Modal, StatCard } from '@/components/ui';
import type { CashAccount, BankAccount, CashFlow, CashFlowFilter } from '@/lib/types/cash';

// Mock data for demonstration
const mockCashAccounts: CashAccount[] = [
  { id: 1, name: 'Kasa TL', currency: 'TRY', balance: 15420.50, is_default: true },
  { id: 2, name: 'Kasa USD', currency: 'USD', balance: 2150.00 },
  { id: 3, name: 'Kasa EUR', currency: 'EUR', balance: 850.00 },
];

const mockBankAccounts: BankAccount[] = [
  { id: 1, name: 'Garanti BBVA - TL', bank_name: 'Garanti BBVA', account_number: '****4521', balance: 45890.25, account_type: 'checking', currency: 'TRY' },
  { id: 2, name: 'Akbank - TL', bank_name: 'Akbank', account_number: '****7890', balance: 23150.00, account_type: 'checking', currency: 'TRY' },
  { id: 3, name: 'İş Bankası - USD', bank_name: 'İş Bankası', account_number: '****1256', balance: 12000.00, account_type: 'checking', currency: 'USD' },
];

const mockCashFlows: CashFlow[] = [
  { id: 1, account_type: 'cash', account_id: 1, account_name: 'Kasa TL', direction: 'in', amount: 5200, currency: 'TRY', date: '2024-01-18', category: 'Satış Tahsilatı', reference_type: 'invoice', reference_id: 101, description: 'Fatura #101 tahsilatı', payment_method: 'cash' },
  { id: 2, account_type: 'bank', account_id: 1, account_name: 'Garanti BBVA - TL', direction: 'in', amount: 12500, currency: 'TRY', date: '2024-01-17', category: 'Satış Tahsilatı', reference_type: 'invoice', reference_id: 100, description: 'Fatura #100 tahsilatı', payment_method: 'bank_transfer' },
  { id: 3, account_type: 'cash', account_id: 1, account_name: 'Kasa TL', direction: 'out', amount: 3500, currency: 'TRY', date: '2024-01-17', category: 'Tedarikçi Ödeme', description: 'ABC Tedarikçi ödeme', payment_method: 'cash' },
  { id: 4, account_type: 'bank', account_id: 2, account_name: 'Akbank - TL', direction: 'out', amount: 4500, currency: 'TRY', date: '2024-01-16', category: 'Kira Ödemesi', description: 'Ofis kirası Ocak', payment_method: 'bank_transfer' },
  { id: 5, account_type: 'cash', account_id: 1, account_name: 'Kasa TL', direction: 'in', amount: 2200, currency: 'TRY', date: '2024-01-16', category: 'Diğer Gelir', description: 'Komisyon geliri', payment_method: 'cash' },
  { id: 6, account_type: 'bank', account_id: 1, account_name: 'Garanti BBVA - TL', direction: 'out', amount: 1800, currency: 'TRY', date: '2024-01-15', category: 'Fatura Ödeme', reference_type: 'invoice', reference_id: 50, description: 'Elektrik faturası', payment_method: 'bank_transfer' },
];

export default function NakitYonetimi() {
  const [activeTab, setActiveTab] = useState<'cash' | 'bank'>('cash');
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [flowDirection, setFlowDirection] = useState<'in' | 'out'>('in');

  const accounts = activeTab === 'cash' ? mockCashAccounts : mockBankAccounts;
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const filteredFlows = mockCashFlows.filter(flow => {
    if (activeTab === 'cash' && flow.account_type !== 'cash') return false;
    if (activeTab === 'bank' && flow.account_type !== 'bank') return false;
    if (selectedAccount && flow.account_id !== selectedAccount) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        flow.description?.toLowerCase().includes(search) ||
        flow.category.toLowerCase().includes(search) ||
        flow.reference_label?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const totalIn = filteredFlows.filter(f => f.direction === 'in').reduce((sum, f) => sum + f.amount, 0);
  const totalOut = filteredFlows.filter(f => f.direction === 'out').reduce((sum, f) => sum + f.amount, 0);

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Nakit Yönetimi</h1>
          <p className="page-subtitle">Kasa ve banka hesaplarınızı yönetin</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsTransferModalOpen(true)}>
            <ArrowLeftRight className="w-4 h-4" />
            Transfer
          </Button>
          <Button variant="primary" onClick={() => { setFlowDirection('in'); setIsFlowModalOpen(true); }}>
            <Plus className="w-4 h-4" />
            Yeni Hareket
          </Button>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setActiveTab('cash'); setSelectedAccount(null); }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'cash'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Wallet className="w-4 h-4 inline mr-2" />
          Kasa Hesapları
        </button>
        <button
          onClick={() => { setActiveTab('bank'); setSelectedAccount(null); }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'bank'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Building2 className="w-4 h-4 inline mr-2" />
          Banka Hesapları
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title={activeTab === 'cash' ? 'Toplam Kasa Bakiyesi' : 'Toplam Banka Bakiyesi'}
          value={totalBalance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          icon={activeTab === 'cash' ? Wallet : Building2}
        />
        <StatCard
          title="Bu Ay Giriş"
          value={totalIn.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          icon={ArrowDownLeft}
          className="text-green-600"
        />
        <StatCard
          title="Bu Ay Çıkış"
          value={totalOut.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          icon={ArrowUpRight}
          className="text-red-600"
        />
        <StatCard
          title="Net Değişim"
          value={(totalIn - totalOut).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          icon={TrendingUp}
          className={totalIn - totalOut >= 0 ? 'text-green-600' : 'text-red-600'}
        />
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {accounts.map(account => (
          <Card
            key={account.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedAccount === account.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedAccount(selectedAccount === account.id ? null : account.id)}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    activeTab === 'cash' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {activeTab === 'cash' ? <Wallet className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{account.name}</h3>
                    <p className="text-sm text-gray-500">{account.currency}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {account.balance.toLocaleString('tr-TR', { style: 'currency', currency: account.currency })}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Cash Flows */}
      <Card>
        <Card.Header className="border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="font-semibold text-gray-900">Hareket Geçmişi</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="ghost" size="sm">
                <Filter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card.Header>
        <Table
          columns={[
            {
              key: 'date',
              header: 'Tarih',
              render: (value) => new Date(value as string).toLocaleDateString('tr-TR'),
            },
            {
              key: 'category',
              header: 'Kategori',
              render: (value) => <Badge variant="info">{value as string}</Badge>,
            },
            {
              key: 'description',
              header: 'Açıklama',
            },
            {
              key: 'reference_label',
              header: 'Referans',
              render: (value) => value ? (
                <span className="text-blue-600 cursor-pointer hover:underline">{value as string}</span>
              ) : '-',
            },
            {
              key: 'payment_method',
              header: 'Ödeme Yöntemi',
              render: (value) => {
                const methods: Record<string, { label: string; icon: any }> = {
                  cash: { label: 'Nakit', icon: Wallet },
                  bank_transfer: { label: 'Banka', icon: Building2 },
                  card: { label: 'Kredi Kartı', icon: CreditCard },
                  check: { label: 'Çek', icon: Receipt },
                };
                const method = methods[value as string] || { label: value as string, icon: Wallet };
                return (
                  <div className="flex items-center gap-1 text-gray-600">
                    <method.icon className="w-4 h-4" />
                    {method.label}
                  </div>
                );
              },
            },
            {
              key: 'amount',
              header: 'Tutar',
              render: (value, row) => {
                const flow = row as unknown as CashFlow;
                return (
                  <span className={`font-semibold ${flow.direction === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                    {flow.direction === 'out' ? '-' : '+'}
                    {(value as number).toLocaleString('tr-TR', { style: 'currency', currency: flow.currency })}
                  </span>
                );
              },
            },
          ]}
          data={filteredFlows as unknown as Record<string, unknown>[]}
        />
      </Card>

      {/* Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Hesaplar Arası Transfer"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Kaynak Hesap</label>
            <Select
              options={[
                { value: '1', label: 'Kasa TL - 15.420,50 ₺' },
                { value: '2', label: 'Garanti BBVA - 45.890,25 ₺' },
              ]}
            />
          </div>
          <div>
            <label className="label">Hedef Hesap</label>
            <Select
              options={[
                { value: '1', label: 'Kasa TL - 15.420,50 ₺' },
                { value: '2', label: 'Garanti BBVA - 45.890,25 ₺' },
              ]}
            />
          </div>
          <div>
            <label className="label">Tutar</label>
            <Input type="number" placeholder="0,00" />
          </div>
          <div>
            <label className="label">Tarih</label>
            <Input type="date" />
          </div>
          <div>
            <label className="label">Açıklama</label>
            <Input placeholder="Transfer açıklaması..." />
          </div>
        </div>
        <Modal.Footer className="mt-6">
          <Button variant="secondary" onClick={() => setIsTransferModalOpen(false)}>İptal</Button>
          <Button variant="primary">Transfer Yap</Button>
        </Modal.Footer>
      </Modal>

      {/* New Flow Modal */}
      <Modal
        isOpen={isFlowModalOpen}
        onClose={() => setIsFlowModalOpen(false)}
        title={flowDirection === 'in' ? 'Nakit Girişi' : 'Nakit Çıkışı'}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFlowDirection('in')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                flowDirection === 'in'
                  ? 'bg-green-100 text-green-700 border-2 border-green-500'
                  : 'bg-gray-50 text-gray-600 border border-gray-200'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 inline mr-2" />
              Giriş
            </button>
            <button
              onClick={() => setFlowDirection('out')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                flowDirection === 'out'
                  ? 'bg-red-100 text-red-700 border-2 border-red-500'
                  : 'bg-gray-50 text-gray-600 border border-gray-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 inline mr-2" />
              Çıkış
            </button>
          </div>
          <div>
            <label className="label">Hesap</label>
            <Select
              options={accounts.map(a => ({
                value: String(a.id),
                label: `${a.name} - ${a.balance.toLocaleString('tr-TR', { style: 'currency', currency: a.currency })}`,
              }))}
            />
          </div>
          <div>
            <label className="label">Tutar</label>
            <Input type="number" placeholder="0,00" />
          </div>
          <div>
            <label className="label">Tarih</label>
            <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label className="label">Kategori</label>
            <Select
              options={flowDirection === 'in' ? [
                { value: 'sales', label: 'Satış Tahsilatı' },
                { value: 'other_income', label: 'Diğer Gelir' },
                { value: 'refund', label: 'İade' },
              ] : [
                { value: 'supplier', label: 'Tedarikçi Ödeme' },
                { value: 'expense', label: 'Gider Ödeme' },
                { value: 'refund', label: 'İade' },
              ]}
            />
          </div>
          <div>
            <label className="label">Açıklama</label>
            <Input placeholder="İşlem açıklaması..." />
          </div>
          <div>
            <label className="label">Ödeme Yöntemi</label>
            <Select
              options={[
                { value: 'cash', label: 'Nakit' },
                { value: 'bank_transfer', label: 'Banka Transferi' },
                { value: 'card', label: 'Kredi Kartı' },
              ]}
            />
          </div>
        </div>
        <Modal.Footer className="mt-6">
          <Button variant="secondary" onClick={() => setIsFlowModalOpen(false)}>İptal</Button>
          <Button variant={flowDirection === 'in' ? 'primary' : 'danger'}>{flowDirection === 'in' ? 'Giriş Kaydet' : 'Çıkış Kaydet'}</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}