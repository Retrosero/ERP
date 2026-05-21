import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Filter, Download, Receipt, Tag,
  Calendar, Repeat, Trash2, Edit, AlertCircle, Loader2
} from 'lucide-react';
import { Card, Button, Input, Select, Table, Badge, Modal, StatCard, Alert } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { stockApi, expenseApi } from '@/lib/dolibarr';
import type { StockMovement } from '@/lib/types/dolibarr';

const categories = [
  { id: 1, name: 'Kira', icon: '🏢', color: 'bg-purple-100 text-purple-700' },
  { id: 2, name: 'Fatura', icon: '⚡', color: 'bg-yellow-100 text-yellow-700' },
  { id: 3, name: 'İletişim', icon: '📱', color: 'bg-blue-100 text-blue-700' },
  { id: 4, name: 'Ofis Malzemesi', icon: '📦', color: 'bg-green-100 text-green-700' },
  { id: 5, name: 'Bakım/Onarım', icon: '🔧', color: 'bg-orange-100 text-orange-700' },
  { id: 6, name: 'Ulaşım', icon: '🚗', color: 'bg-gray-100 text-gray-700' },
  { id: 7, name: 'Diğer', icon: '📋', color: 'bg-slate-100 text-slate-700' },
];

interface ExpenseDisplay {
  id: number;
  title: string;
  amount: number;
  vat_amount: number;
  total_amount: number;
  currency: string;
  date: string;
  category: string;
  status: 'draft' | 'approved' | 'paid' | 'cancelled';
  supplier: string;
  payment_account: string;
  recurring?: boolean;
  fk_product?: number;
  fk_entrepot?: number;
}

export default function Giderler() {
  const [activeTab, setActiveTab] = useState<'all' | 'recurring' | 'draft'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stock movements (used as proxy for expense tracking)
  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const movements = await stockApi.listMovements({ limit: 100, sortfield: 'datem', sortorder: 'DESC' });
      // Transform stock movements to expense display format
      // Note: In a real implementation, you'd use Dolibarr's expense report module
      const expenseData: ExpenseDisplay[] = movements.map((m, index) => ({
        id: m.id || index,
        title: m.label || `Stok Hareketi #${m.id || index + 1}`,
        amount: m.price_buy ? Math.abs(m.price_buy) : 0,
        vat_amount: 0,
        total_amount: m.price_buy ? Math.abs(m.price_buy) : 0,
        currency: 'TRY',
        date: m.datem ? new Date(m.datem * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        category: getCategoryFromMovement(m),
        status: 'paid',
        supplier: '-',
        payment_account: '-',
        fk_product: m.fk_product,
        fk_entrepot: m.fk_entrepot,
      }));
      setExpenses(expenseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giderler yüklenirken hata oluştu');
      console.error('Expenses fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const getCategoryFromMovement = (movement: StockMovement): string => {
    if (movement.type_movement === 1) return 'Giriş';
    if (movement.type_movement === 2) return 'Çıkış';
    return 'Transfer';
  };

  const getCategoryIcon = (category: string): string => {
    const cat = categories.find(c => c.name === category);
    return cat?.icon || '📋';
  };

  const filteredExpenses = expenses.filter(expense => {
    if (activeTab === 'recurring' && !expense.recurring) return false;
    if (activeTab === 'draft' && expense.status !== 'draft') return false;
    if (categoryFilter && expense.category !== categoryFilter) return false;
    if (searchTerm) {
      return expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             expense.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.total_amount, 0);
  const paidExpenses = filteredExpenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.total_amount, 0);
  const pendingExpenses = filteredExpenses.filter(e => e.status === 'draft' || e.status === 'approved').reduce((sum, e) => sum + e.total_amount, 0);

  const statusConfig = {
    draft: { label: 'Taslak', variant: 'gray' as const },
    approved: { label: 'Onaylandı', variant: 'info' as const },
    paid: { label: 'Ödendi', variant: 'success' as const },
    cancelled: { label: 'İptal', variant: 'danger' as const },
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gider Yönetimi</h1>
          <p className="page-subtitle">Giderlerinizi kaydedin ve takip edin</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Receipt className="w-4 h-4" />
            Kategori Yönet
          </Button>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Yeni Gider
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Toplam Gider"
          value={formatCurrency(totalExpenses, false)}
          icon={Receipt}
        />
        <StatCard
          title="Ödenen"
          value={formatCurrency(paidExpenses, false)}
          icon={Receipt}
          variant="success"
        />
        <StatCard
          title="Bekleyen"
          value={formatCurrency(pendingExpenses, false)}
          icon={AlertCircle}
          variant="warning"
        />
        <StatCard
          title="Tekrarlayan"
          value={String(expenses.filter(e => e.recurring).length)}
          icon={Repeat}
        />
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => { setActiveTab('all'); setCategoryFilter(''); }}
          className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap ${
            activeTab === 'all' && !categoryFilter ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          Tümü
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setActiveTab('all'); setCategoryFilter(cat.name); }}
            className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap flex items-center gap-2 ${
              categoryFilter === cat.name ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-600'
          }`}
        >
          Tüm Giderler
        </button>
        <button
          onClick={() => setActiveTab('recurring')}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
            activeTab === 'recurring' ? 'bg-gray-100 text-gray-900' : 'text-gray-600'
          }`}
        >
          <Repeat className="w-4 h-4" />
          Tekrarlayan
        </button>
        <button
          onClick={() => setActiveTab('draft')}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
            activeTab === 'draft' ? 'bg-gray-100 text-gray-900' : 'text-gray-600'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          Onay Bekleyen
        </button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 p-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Gider veya tedarikçi ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            options={[
              { value: '', label: 'Tüm Durumlar' },
              { value: 'draft', label: 'Taslak' },
              { value: 'approved', label: 'Onaylandı' },
              { value: 'paid', label: 'Ödendi' },
            ]}
            className="w-40"
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
              key: 'title',
              header: 'Gider Adı',
              render: (value, row) => (
                <div>
                  <p className="font-medium">{value as string}</p>
                  {'recurring' in row && row.recurring && (
                    <span className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                      <Repeat className="w-3 h-3" /> Tekrarlayan
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: 'category',
              header: 'Kategori',
              render: (value) => {
                const cat = categories.find(c => c.name === value);
                return (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat?.color || 'bg-gray-100'}`}>
                    {cat?.icon} {value as string}
                  </span>
                );
              },
            },
            {
              key: 'supplier',
              header: 'Tedarikçi',
            },
            {
              key: 'date',
              header: 'Tarih',
              render: (value) => new Date(value as string).toLocaleDateString('tr-TR'),
            },
            {
              key: 'amount',
              header: 'Tutar',
              render: (value, row) => {
                const expense = row as ExpenseDisplay;
                return (
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(expense.total_amount)}</p>
                    <p className="text-xs text-gray-500">KDV: {formatCurrency(expense.vat_amount)}</p>
                  </div>
                );
              },
            },
            {
              key: 'status',
              header: 'Durum',
              render: (value) => {
                const config = statusConfig[value as keyof typeof statusConfig];
                return <Badge variant={config.variant}>{config.label}</Badge>;
              },
            },
            {
              key: 'payment_account',
              header: 'Ödeme Hesabı',
              render: (value) => String(value || '-'),
            },
            {
              key: 'actions',
              header: '',
              render: () => (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ),
            },
          ]}
          data={filteredExpenses}
          emptyMessage="Gider bulunamadı"
        />
      </Card>

      {/* New Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Gider Ekle"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Gider Adı</label>
            <Input placeholder="Gider açıklaması..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tutar</label>
              <Input type="number" placeholder="0,00" />
            </div>
            <div>
              <label className="label">KDV Oranı</label>
              <Select
                options={[
                  { value: '0', label: '%0' },
                  { value: '1', label: '%1' },
                  { value: '8', label: '%8' },
                  { value: '18', label: '%18' },
                  { value: '20', label: '%20' },
                ]}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Kategori</label>
              <Select
                options={categories.map(c => ({ value: c.name, label: `${c.icon} ${c.name}` }))}
              />
            </div>
            <div>
              <label className="label">Tarih</label>
              <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <div>
            <label className="label">Tedarikçi</label>
            <Input placeholder="Tedarikçi seçin veya yazın..." />
          </div>
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Repeat className="w-4 h-4 text-blue-600" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" />
              <span className="text-sm text-blue-700">Tekrarlayan gider olarak kaydet</span>
            </label>
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
    </>
  );
}