import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  Receipt,
  User,
} from 'lucide-react';
import { Card, Button, Input, Select, Badge } from '@/components/ui';
import { expenseReportApi, EXPENSE_STATUS } from '@/lib/dolibarr-hrm';
import type { ExpenseReport } from '@/lib/types/hrm';

export function HarcamaRaporlari() {
  const [expenses, setExpenses] = useState<ExpenseReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {};
      if (statusFilter) params.status = parseInt(statusFilter);
      const data = await expenseReportApi.list(params);
      setExpenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Harcama raporları yüklenirken hata oluştu');
      console.error('Expense reports fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const getStatusBadge = (status: number | undefined) => {
    const statusValue = status || 0;
    if (statusValue === EXPENSE_STATUS.DRAFT.value) return <Badge variant="gray">Taslak</Badge>;
    if (statusValue === EXPENSE_STATUS.VALIDATED.value) return <Badge variant="warning">Bekliyor</Badge>;
    if (statusValue === EXPENSE_STATUS.APPROVED.value) return <Badge variant="success">Onaylandı</Badge>;
    if (statusValue === EXPENSE_STATUS.REFUSED.value) return <Badge variant="danger">Reddedildi</Badge>;
    if (statusValue === EXPENSE_STATUS.PAID.value) return <Badge variant="info">Ödendi</Badge>;
    if (statusValue === EXPENSE_STATUS.CANCELLED.value) return <Badge variant="gray">İptal</Badge>;
    return <Badge variant="gray">Bilinmiyor</Badge>;
  };

  const filteredExpenses = expenses.filter(expense => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesRef = expense.ref?.toLowerCase().includes(search) || false;
      if (!matchesRef) return false;
    }
    return true;
  });

  const stats = {
    total: expenses.length,
    pending: expenses.filter(e => e.status === EXPENSE_STATUS.VALIDATED.value).length,
    approved: expenses.filter(e => e.status === EXPENSE_STATUS.APPROVED.value).length,
    paid: expenses.filter(e => e.status === EXPENSE_STATUS.PAID.value).length,
    totalAmount: expenses.reduce((sum, e) => sum + (e.total_ttc || 0), 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('tr-TR');
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            <span className="text-slate-500">Harcama raporları yükleniyor...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Harcama Raporları</h1>
            <p className="text-slate-500 mt-1">Personel harcama taleplerini görüntüleyin ve yönetin</p>
          </div>
          <Link to="/harcama-raporlari/yeni">
            <Button icon={<Plus className="w-4 h-4" />}>
              Yeni Harcama
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500">Toplam Rapor</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                <p className="text-sm text-slate-500">Bekleyen</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.approved}</p>
                <p className="text-sm text-slate-500">Onaylanan</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalAmount)}</p>
                <p className="text-sm text-slate-500">Toplam Tutar</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Rapor ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="!pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select
                options={[
                  { value: '', label: 'Tüm Durumlar' },
                  { value: EXPENSE_STATUS.DRAFT.value.toString(), label: 'Taslak' },
                  { value: EXPENSE_STATUS.VALIDATED.value.toString(), label: 'Bekliyor' },
                  { value: EXPENSE_STATUS.APPROVED.value.toString(), label: 'Onaylandı' },
                  { value: EXPENSE_STATUS.PAID.value.toString(), label: 'Ödendi' },
                  { value: EXPENSE_STATUS.REFUSED.value.toString(), label: 'Reddedildi' },
                ]}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
              />
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="!p-4">
            <div className="flex items-center gap-3 text-red-600">
              <XCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </Card>
        )}

        {/* Expense Reports Table */}
        <Card>
          {filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Receipt className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Harcama raporu bulunamadı</h3>
              <p className="text-slate-500 mb-6">Henüz harcama raporu oluşturulmamış. Yeni bir rapor oluşturmak için butona tıklayın.</p>
              <Link to="/harcama-raporlari/yeni">
                <Button icon={<Plus className="w-4 h-4" />}>
                  Yeni Harcama
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Referans
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Personel
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Tarih
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Tutar
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Durum
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium">
                            <Receipt className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{expense.ref || `EXP-${expense.id}`}</p>
                            <p className="text-xs text-slate-500">#{expense.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700">#{expense.fk_user_author}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-700">{formatDate(expense.date_creation)}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatCurrency(expense.total_ttc || 0)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(expense.status)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link to={`/harcama-raporlari/${expense.id}`}>
                          <Button variant="ghost" size="sm" icon={<ChevronRight className="w-4 h-4" />} iconPosition="right">
                            Detay
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

export default HarcamaRaporlari;