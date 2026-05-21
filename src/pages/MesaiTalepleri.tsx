import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, CheckCircle, XCircle, AlertCircle, Plus, X,
  Calendar, User, DollarSign, Filter, Download, Eye,
  RefreshCw, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui';
import { userApi } from '@/lib/dolibarr-hrm';
import { overtimeApi, OVERTIME_TYPE_LABELS, OVERTIME_RATE_MULTIPLIERS } from '@/lib/dolibarr-payroll';

// Types
interface OvertimeRecord {
  id: number;
  fk_user: number;
  user_name?: string;
  overtime_type: string;
  duration: number;
  hourly_rate?: number;
  rate_multiplier?: number;
  total_amount?: number;
  status?: number;
  date_start?: string | number;
  date_end?: string | number;
  note_private?: string;
  note_public?: string;
}

interface User {
  id: number;
  name?: string;
  login?: string;
  firstname: string;
  lastname: string;
  email?: string;
}

const getUserDisplayName = (user?: User): string | null => {
  if (!user) return null;
  const fullName = `${user.firstname || ''} ${user.lastname || ''}`.trim();
  if (fullName) return fullName;
  if (user.name && user.name.trim()) return user.name.trim();
  if (user.login && user.login.trim()) return user.login.trim();
  if (user.email && user.email.trim()) return user.email.trim();
  return null;
};

const resolveUserIdFromLabel = (label?: string): number | null => {
  if (!label) return null;
  const match = label.match(/(\d+)/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
};

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
  const raw = typeof date === 'number' && date < 10_000_000_000 ? date * 1000 : date;
  return new Date(raw).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Format time
const formatTime = (date: string | number | undefined) => {
  if (!date) return '';
  const raw = typeof date === 'number' && date < 10_000_000_000 ? date * 1000 : date;
  const d = new Date(raw);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

// Type labels and colors
const typeLabels: Record<string, { label: string; color: string }> = {
  weekday: { label: 'Hafta İçi', color: 'bg-blue-100 text-blue-700' },
  weekend: { label: 'Hafta Sonu', color: 'bg-purple-100 text-purple-700' },
  holiday: { label: 'Resmi Tatil', color: 'bg-red-100 text-red-700' },
  night: { label: 'Gece Mesai', color: 'bg-indigo-100 text-indigo-700' },
  compensatory: { label: 'Serbest Zaman', color: 'bg-teal-100 text-teal-700' },
};

const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  0: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <Clock className="w-3 h-3" />, label: 'Taslak' },
  1: { bg: 'bg-amber-100', text: 'text-amber-700', icon: <Clock className="w-3 h-3" />, label: 'Bekliyor' },
  2: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-3 h-3" />, label: 'Onaylandı' },
  3: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="w-3 h-3" />, label: 'Reddedildi' },
  4: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <DollarSign className="w-3 h-3" />, label: 'Ödendi' },
  5: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <X className="w-3 h-3" />, label: 'İptal' },
};

export const MesaiTalepleri: React.FC = () => {
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from Dolibarr API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch users
      const usersResponse = await userApi.list({ limit: 1000 });
      setUsers(usersResponse);

      const overtimesResponse = await overtimeApi.list({ limit: 100 });
      const enrichedRecords = overtimesResponse.map((ot) => {
        let user = usersResponse.find((u) => u.id === ot.fk_user);
        if (!user && ot.user_name) {
          const parsedId = resolveUserIdFromLabel(ot.user_name);
          if (parsedId) user = usersResponse.find((u) => u.id === parsedId);
        }
        const resolvedUserName = getUserDisplayName(user)
          || (ot.user_name && ot.user_name.trim() ? ot.user_name : null)
          || (ot.fk_user > 0 ? `Kullanıcı #${ot.fk_user}` : null)
          || 'Personel bilgisi yok';
        return {
          ...ot,
          user_name: resolvedUserName,
        };
      });
      setRecords(enrichedRecords);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter records by tab
  const filteredRecords = records.filter(r => {
    if (activeTab === 'pending') return r.status === 1; // PENDING
    if (activeTab === 'approved') return r.status === 2; // APPROVED
    return true;
  });

  // Summary
  const summary = {
    totalHours: records.reduce((sum, r) => sum + r.duration, 0),
    totalAmount: records.reduce((sum, r) => sum + (r.total_amount || 0), 0),
    pendingCount: records.filter(r => r.status === 1).length,
    approvedCount: records.filter(r => r.status === 2).length,
  };

  // Handle approve
  const handleApprove = async (id: number) => {
    try {
      await overtimeApi.approve(id);
      setRecords(prev => prev.map(r =>
        r.id === id ? { ...r, status: 2 } : r
      ));
    } catch (err) {
      setError('Onaylama sırasında hata oluştu');
    }
  };

  // Handle reject
  const handleReject = async (id: number) => {
    try {
      await overtimeApi.reject(id);
      setRecords(prev => prev.map(r =>
        r.id === id ? { ...r, status: 3 } : r
      ));
    } catch (err) {
      setError('Reddetme sırasında hata oluştu');
    }
  };

  // Handle create new overtime
  const handleCreateOvertime = async (data: any) => {
    try {
      const newOvertime = await overtimeApi.create(data);
      const user = users.find(u => u.id === data.fk_user);
      setRecords(prev => [...prev, {
        ...newOvertime,
        user_name: getUserDisplayName(user) || 'Personel bilgisi yok',
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
          <h1 className="text-2xl font-bold text-gray-900">Fazla Mesai</h1>
          <p className="text-sm text-gray-500">Dolibarr mesai kayıtlarını yönetin</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Yeni Mesai
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
              <p className="text-sm text-gray-500">Toplam Saat</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalHours}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Toplam Tutar</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(summary.totalAmount)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Bekleyen</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{summary.pendingCount}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Onaylanan</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{summary.approvedCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
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
                Bekleyen Talepler ({records.filter(r => r.status === 1).length})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'approved'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Onaylanan ({records.filter(r => r.status === 2).length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'all'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Tümü ({records.length})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personel</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tür</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Saat</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Çarpan</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{formatDate(record.date_start)}</span>
                      </div>
                      {record.date_start && record.date_end && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatTime(record.date_start)} - {formatTime(record.date_end)}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-xs font-medium">
                            {(record.user_name || 'U').split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{record.user_name || `#${record.fk_user}`}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${typeLabels[record.overtime_type]?.color || 'bg-gray-100 text-gray-700'}`}>
                        {OVERTIME_TYPE_LABELS[record.overtime_type] || record.overtime_type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-semibold text-gray-900">{record.duration}</span>
                      <span className="text-gray-400 text-xs ml-1">saat</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-lg font-bold text-purple-600">
                        {record.rate_multiplier || OVERTIME_RATE_MULTIPLIERS[record.overtime_type] || 1.5}x
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-semibold text-green-600">{formatCurrency(record.total_amount || 0)}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[String(record.status)]?.bg || 'bg-gray-100'} ${statusConfig[String(record.status)]?.text || 'text-gray-700'}`}>
                        {statusConfig[String(record.status)]?.icon || <Clock className="w-3 h-3" />}
                        {statusConfig[String(record.status)]?.label || 'Bilinmiyor'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {record.status === 1 && (
                          <>
                            <button
                              onClick={() => handleApprove(record.id)}
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Onayla"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(record.id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reddet"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Detay"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="px-5 py-12 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Bu kategoride mesai kaydı bulunamadı.</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Toplam: {filteredRecords.length} kayıt</span>
              <button className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <Download className="w-4 h-4" />
                Rapor İndir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddOvertimeModal
          users={users}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreateOvertime}
        />
      )}
    </div>
  );
};

// Add Overtime Modal Component
interface AddOvertimeModalProps {
  users: User[];
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const AddOvertimeModal: React.FC<AddOvertimeModalProps> = ({ users, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    fk_user: '',
    date_start: '',
    date_end: '',
    overtime_type: 'weekday',
    duration: 4,
    note_private: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      fk_user: parseInt(formData.fk_user),
      date_start: formData.date_start,
      date_end: formData.date_end,
      overtime_type: formData.overtime_type,
      duration: formData.duration,
      rate_multiplier: OVERTIME_RATE_MULTIPLIERS[formData.overtime_type],
      note_private: formData.note_private,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Yeni Mesai Kaydı</h3>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.date_start}
                  onChange={(e) => setFormData({ ...formData, date_start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.date_end}
                  onChange={(e) => setFormData({ ...formData, date_end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                <select
                  value={formData.overtime_type}
                  onChange={(e) => setFormData({ ...formData, overtime_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="weekday">Hafta İçi (1.5x)</option>
                  <option value="weekend">Hafta Sonu (2.0x)</option>
                  <option value="holiday">Resmi Tatil (2.0x)</option>
                  <option value="night">Gece Mesai (1.5x)</option>
                  <option value="compensatory">Telafi Mesaisi (1.0x)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saat</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
              <textarea
                rows={3}
                value={formData.note_private}
                onChange={(e) => setFormData({ ...formData, note_private: e.target.value })}
                placeholder="Mesai nedenini açıklayın..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
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
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


