import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet, CheckCircle, XCircle, Clock, DollarSign, Plus, X,
  Calendar, User, AlertCircle, CreditCard, TrendingDown,
  RefreshCw, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui';
import { userApi } from '@/lib/dolibarr-hrm';
import { expenseApi } from '@/lib/dolibarr';

// Types
interface AdvancePayment {
  id: number;
  fk_user: number;
  user_name?: string;
  amount_requested?: number;
  amount?: number;
  amount_advance?: number;
  installment_count?: number;
  installment_total?: number;
  status?: number;
  reason?: string;
  note_private?: string;
  date_start?: string | number;
  date_valid?: string;
  date_payment?: string;
}

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email?: string;
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Format date
const formatDate = (date: string | Date | number | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Status config
const statusConfig: Record<number, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  0: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <Clock className="w-3 h-3" />, label: 'Taslak' },
  1: { bg: 'bg-amber-100', text: 'text-amber-700', icon: <Clock className="w-3 h-3" />, label: 'Bekliyor' },
  2: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <CheckCircle className="w-3 h-3" />, label: 'Onaylandı' },
  3: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="w-3 h-3" />, label: 'Reddedildi' },
  4: { bg: 'bg-green-100', text: 'text-green-700', icon: <DollarSign className="w-3 h-3" />, label: 'Ödendi' },
  5: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: <TrendingDown className="w-3 h-3" />, label: 'Taksitli' },
  6: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <CheckCircle className="w-3 h-3" />, label: 'Tamamlandı' },
};

export const AvansYonetimi: React.FC = () => {
  const [advances, setAdvances] = useState<AdvancePayment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'all'>('pending');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from Dolibarr API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch users
      const usersResponse = await userApi.list({ limit: 100 });
      setUsers(usersResponse);

      const reports = await expenseApi.list({ limit: 100 });
      const mapped = reports.map((r) => {
        const userId = Number(r.fk_user_author || 0);
        const user = usersResponse.find((u) => u.id === userId);
        return {
          id: r.id,
          fk_user: userId,
          user_name: user ? `${user.firstname} ${user.lastname}` : `#${userId}`,
          amount_requested: Number(r.total_ttc || 0),
          amount: Number(r.total_ttc || 0),
          amount_advance: r.paid ? Number(r.total_ttc || 0) : 0,
          installment_count: 1,
          status: r.paid ? 4 : (r.status ?? 1),
          reason: r.note_public || r.note_private || '',
          note_private: r.note_private,
          date_start: r.date_creation || r.date_valid,
          date_valid: r.date_valid,
          date_payment: r.date_payment,
        } as AdvancePayment;
      });
      setAdvances(mapped);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter advances by tab
  const filteredAdvances = advances.filter(a => {
    if (activeTab === 'pending') return a.status === 1; // PENDING
    if (activeTab === 'active') return [2, 5].includes(a.status || 0); // APPROVED or PARTIAL
    return true;
  });

  // Summary
  const summary = {
    totalAdvances: advances.length,
    totalAmount: advances.reduce((sum, a) => sum + (a.amount_requested || 0), 0),
    pendingAmount: advances.filter(a => a.status === 1).reduce((sum, a) => sum + (a.amount_requested || 0), 0),
    activeBalance: advances.filter(a => [2, 5].includes(a.status || 0)).reduce((sum, a) => sum + ((a.amount_requested || 0) - (a.amount_advance || 0)), 0),
  };

  // Handle approve
  const handleApprove = async (id: number) => {
    try {
      await expenseApi.approve(id);
      setAdvances(prev => prev.map(a =>
        a.id === id ? { ...a, status: 2 } : a
      ));
    } catch (err) {
      setError('Onaylama sırasında hata oluştu');
    }
  };

  // Handle reject
  const handleReject = async (id: number) => {
    try {
      await expenseApi.reject(id);
      setAdvances(prev => prev.map(a =>
        a.id === id ? { ...a, status: 3 } : a
      ));
    } catch (err) {
      setError('Reddetme sırasında hata oluştu');
    }
  };

  // Handle pay
  const handlePay = async (id: number, amount: number) => {
    try {
      await expenseApi.markPaid(id);
      fetchData(); // Refresh to get updated balance
    } catch (err) {
      setError('Ödeme sırasında hata oluştu');
    }
  };

  // Handle create advance
  const handleCreateAdvance = async (data: any) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const report = await expenseApi.create({
        fk_user_author: data.fk_user,
        date_debut: today,
        date_fin: today,
        note_public: data.reason,
        note_private: `Avans talebi (çekirdek gider raporu modeli)\nTaksit: ${data.installment_count}`,
        lines: [{
          date: today,
          libelle: `Avans Talebi - ${data.reason || 'Açıklama yok'}`,
          qty: 1,
          value_unit: Number(data.amount_requested || 0),
          value_unit_ht: Number(data.amount_requested || 0),
          tva_tx: 0,
        }],
      });
      const user = users.find(u => u.id === data.fk_user);
      setAdvances(prev => [...prev, {
        id: report.id,
        fk_user: data.fk_user,
        amount_requested: Number(data.amount_requested || 0),
        amount: Number(data.amount_requested || 0),
        amount_advance: 0,
        installment_count: Number(data.installment_count || 1),
        status: 1,
        reason: data.reason,
        date_start: report.date_creation,
        user_name: user ? `${user.firstname} ${user.lastname}` : `#${data.fk_user}`,
      }]);
      setShowAddModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt eklenirken hata oluştu');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avans Yönetimi</h1>
          <p className="text-sm text-gray-500">Dolibarr avans taleplerini yönetin</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Yeni Avans Talebi
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Toplam Avans</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalAmount)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Bekleyen Talepler</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(summary.pendingAmount)}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Aktif Bakiye</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(summary.activeBalance)}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Talep Sayısı</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalAdvances}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500">Dolibarr'dan veriler yükleniyor...</p>
        </div>
      )}

      {/* Tabs */}
      {!loading && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'pending'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Bekleyen ({advances.filter(a => a.status === 1).length})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'active'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Aktif / Taksitli ({advances.filter(a => [2, 5].includes(a.status || 0)).length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'all'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Tümü ({advances.length})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personel</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Talep Tarihi</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Talep Tutarı</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Kalan Bakiye</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Taksit</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAdvances.map((advance) => (
                  <tr key={advance.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {(advance.user_name || 'U').split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{advance.user_name || `#${advance.fk_user}`}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">{advance.reason || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{formatDate(advance.date_start)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-semibold text-gray-900">{formatCurrency(advance.amount_requested || 0)}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`font-semibold ${(advance.amount_requested || 0) - (advance.amount_advance || 0) > 0 ? 'text-indigo-600' : 'text-green-600'}`}>
                        {formatCurrency((advance.amount_requested || 0) - (advance.amount_advance || 0))}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm text-gray-600">
                        {(advance.installment_count || 1)} taksit
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[advance.status || 0]?.bg || 'bg-gray-100'} ${statusConfig[advance.status || 0]?.text || 'text-gray-700'}`}>
                        {statusConfig[advance.status || 0]?.icon || <Clock className="w-3 h-3" />}
                        {statusConfig[advance.status || 0]?.label || 'Bilinmiyor'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {advance.status === 1 && (
                          <>
                            <button
                              onClick={() => handleApprove(advance.id)}
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Onayla"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(advance.id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reddet"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {[2, 5].includes(advance.status || 0) && (
                          <button
                            onClick={() => {
                              const remaining = (advance.amount_requested || 0) - (advance.amount_advance || 0);
                              if (remaining > 0) {
                                handlePay(advance.id, remaining);
                              }
                            }}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ödeme Yap"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAdvances.length === 0 && (
            <div className="px-5 py-12 text-center">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Bu kategoride avans talebi bulunamadı.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddAdvanceModal
          users={users}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreateAdvance}
        />
      )}
    </div>
  );
};

// Add Advance Modal Component
interface AddAdvanceModalProps {
  users: User[];
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const AddAdvanceModal: React.FC<AddAdvanceModalProps> = ({ users, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    fk_user: '',
    amount_requested: '',
    installment_count: 1,
    reason: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      fk_user: parseInt(formData.fk_user),
      amount_requested: parseFloat(formData.amount_requested),
      installment_count: Number(formData.installment_count),
      reason: formData.reason,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Yeni Avans Talebi</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personel *</label>
              <select
                required
                value={formData.fk_user}
                onChange={(e) => setFormData({ ...formData, fk_user: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seçiniz</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstname} {user.lastname}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (TL) *</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={formData.amount_requested}
                onChange={(e) => setFormData({ ...formData, amount_requested: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taksit Sayısı</label>
              <select
                value={formData.installment_count}
                onChange={(e) => setFormData({ ...formData, installment_count: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="1">1 Taksit</option>
                <option value="2">2 Taksit</option>
                <option value="3">3 Taksit</option>
                <option value="4">4 Taksit</option>
                <option value="6">6 Taksit</option>
                <option value="12">12 Taksit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
              <textarea
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Avans talep nedenini açıklayın..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Bilgilendirme</p>
                  <p className="mt-1">Avans taksitleri aylık bordrodan kesinti olarak uygulanacaktır.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Talep Et
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

