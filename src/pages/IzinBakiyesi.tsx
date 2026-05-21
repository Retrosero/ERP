import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Users,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  PieChart,
  ChevronDown,
  Search,
  Filter,
  X,
  Calendar,
  User,
  BarChart2,
  AlertCircle,
} from 'lucide-react';
import { Card, Button, Input, Select, Badge } from '@/components/ui';
import { holidayApi, HOLIDAY_STATUS } from '@/lib/dolibarr-hrm';
import type { User as UserType, LeaveType, LeaveBalance } from '@/lib/types/hrm';
import { userApi } from '@/lib/dolibarr-hrm';

export function IzinBakiyesi() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<Record<number, LeaveBalance[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserFilter, setShowUserFilter] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const usersData = await userApi.list();
      setUsers(usersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veriler yüklenirken hata oluştu');
      console.error('Users fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      const types = await holidayApi.getTypes();
      setLeaveTypes(types);
    } catch (err) {
      console.error('Leave types fetch error:', err);
    }
  }, []);

  const fetchUserBalances = useCallback(async (userId: number) => {
    setIsLoadingUser(true);
    try {
      const balanceData = await holidayApi.getBalance(userId, selectedYear);
      setBalances(prev => ({ ...prev, [userId]: balanceData }));
    } catch (err) {
      console.error('Leave balance fetch error:', err);
    } finally {
      setIsLoadingUser(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchUsers();
    fetchLeaveTypes();
  }, [fetchUsers, fetchLeaveTypes]);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserBalances(selectedUserId);
    }
  }, [selectedUserId, fetchUserBalances]);

  const getLeaveTypeLabel = (typeId: number) => {
    const type = leaveTypes.find(t => t.id === typeId);
    return type?.label || `İzin Türü #${typeId}`;
  };

  // Stats
  const stats = useMemo(() => {
    const totalEmployees = users.length;
    const totalBalance = Object.values(balances).flat().reduce(
      (sum, b) => sum + (b.days_available || b.remaining || 0), 0
    );
    const totalUsed = Object.values(balances).flat().reduce(
      (sum, b) => sum + (b.days_taken || b.used || 0), 0
    );
    const criticalBalance = Object.values(balances).flat().filter(
      b => (b.days_available || b.remaining || 0) <= 2
    ).length;

    return {
      totalEmployees,
      totalBalance,
      totalUsed,
      criticalBalance,
    };
  }, [users, balances]);

  // Get selected user's balances
  const selectedUserBalances = selectedUserId && balances[selectedUserId] ? balances[selectedUserId] : [];

  // Get selected user info
  const selectedUser = users.find(u => u.id === selectedUserId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          <span className="text-slate-500">İzin bakiyeleri yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">İzin Bakiyeleri</h1>
          <p className="text-slate-500 mt-1">
            Personel izin bakiyelerini ve kullanım raporlarını görüntüleyin
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          >
            <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
            <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
            <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-5 bg-gradient-to-br from-teal-500 to-teal-600 border-0 overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium">Toplam Personel</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.totalEmployees}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="!p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Toplam Kalan Gün</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.totalBalance}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="!p-5 bg-gradient-to-br from-violet-500 to-violet-600 border-0 overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-violet-100 text-sm font-medium">Kullanılan Gün</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.totalUsed}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="!p-5 bg-gradient-to-br from-red-500 to-red-600 border-0 overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Kritik Bakiye</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.criticalBalance}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="!p-4 border-red-200 bg-red-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-800">Hata Oluştu</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
            <button onClick={() => setError(null)} className="p-2 hover:bg-red-100 rounded-lg">
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </Card>
      )}

      {/* User Selection & Search */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Personel ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="!pl-11 h-11"
              />
            </div>
          </div>
          <div className="relative">
            <Button
              variant={showUserFilter ? 'primary' : 'secondary'}
              icon={<Filter className="w-4 h-4" />}
              onClick={() => setShowUserFilter(!showUserFilter)}
            >
              Personel Seç
              {selectedUserId && <span className="ml-2 px-2 py-0.5 bg-teal-500 text-white text-xs rounded-full">1</span>}
            </Button>
            
            {showUserFilter && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-10 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-slate-200 sticky top-0 bg-white">
                  <p className="text-xs font-medium text-slate-500">Personel Seç</p>
                </div>
                <div className="divide-y divide-slate-100">
                  <button
                    onClick={() => {
                      setSelectedUserId('');
                      setShowUserFilter(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                      !selectedUserId ? 'bg-teal-50' : ''
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-700">Tüm Personelleri Göster</span>
                  </button>
                  {users
                    .filter(u => {
                      if (!searchTerm) return true;
                      const search = searchTerm.toLowerCase();
                      return (
                        u.firstname?.toLowerCase().includes(search) ||
                        u.lastname?.toLowerCase().includes(search) ||
                        u.email?.toLowerCase().includes(search)
                      );
                    })
                    .map(user => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setShowUserFilter(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                          selectedUserId === user.id ? 'bg-teal-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-xs font-semibold">
                            {(user.firstname?.[0] || '') + (user.lastname?.[0] || '')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {user.firstname} {user.lastname}
                            </p>
                            <p className="text-xs text-slate-400">{user.job || '-'}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Selected User Badge */}
        {selectedUser && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-50">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-sm font-semibold">
                {(selectedUser.firstname?.[0] || '') + (selectedUser.lastname?.[0] || '')}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {selectedUser.firstname} {selectedUser.lastname}
                </p>
                <p className="text-xs text-slate-500">{selectedUser.job || '-'}</p>
              </div>
              <button
                onClick={() => setSelectedUserId('')}
                className="p-2 hover:bg-teal-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Leave Types Legend */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-teal-600" />
          İzin Türleri
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {leaveTypes.map((type, index) => {
            const colors = [
              'bg-teal-500',
              'bg-emerald-500',
              'bg-violet-500',
              'bg-amber-500',
              'bg-rose-500',
              'bg-cyan-500',
            ];
            return (
              <div key={type.id} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50">
                <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                <span className="text-sm text-slate-700 truncate">{type.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* User Balances / All Users Summary */}
      {selectedUserId ? (
        /* Single User Balance View */
        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-teal-600" />
              {selectedUser?.firstname} {selectedUser?.lastname} - İzin Bakiyesi ({selectedYear})
            </h3>

            {isLoadingUser ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-teal-500 mr-2" />
                <span className="text-slate-500">Bakiyeler yükleniyor...</span>
              </div>
            ) : selectedUserBalances.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {selectedUserBalances.map((balance) => {
                  const used = balance.days_taken || balance.used || 0;
                  const available = balance.days_available || balance.remaining || 0;
                  const total = balance.annual_quota || balance.total_days || available + used;
                  const usagePercent = total > 0 ? (used / total) * 100 : 0;
                  
                  return (
                    <div key={balance.id || balance.fk_leave_type} className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                            <CalendarDays className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {balance.label_type || 'İzin'}
                            </p>
                            <p className="text-xs text-slate-500">{selectedYear} Yılı</p>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-500">Kullanım</span>
                          <span className="font-medium text-slate-700">{used} / {total} gün</span>
                        </div>
                        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              usagePercent > 80 ? 'bg-red-500' :
                              usagePercent > 60 ? 'bg-amber-500' :
                              'bg-teal-500'
                            }`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-slate-900">{total}</p>
                          <p className="text-xs text-slate-500">Yıllık Kota</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">{used}</p>
                          <p className="text-xs text-slate-500">Kullanılan</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-teal-600">{available}</p>
                          <p className="text-xs text-slate-500">Kalan</p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        {available === 0 ? (
                          <Badge variant="danger" className="w-full justify-center">Bakiye Bitmiş</Badge>
                        ) : available <= 2 ? (
                          <Badge variant="warning" className="w-full justify-center">Kritik (≤2 gün)</Badge>
                        ) : (
                          <Badge variant="success" className="w-full justify-center">Yeterli</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500">Bu personelin izin bakiyesi bulunamadı</p>
              </div>
            )}
          </Card>
        </div>
      ) : (
        /* All Users Summary Table */
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Tüm Personeller - İzin Özeti ({selectedYear})
          </h3>

          {users.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500">Personel bulunamadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4">
                      Personel
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4">
                      İzin Türü
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4">
                      Yıllık Hak
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4">
                      Kullanılan
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4">
                      Kalan
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4">
                      Kullanım
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4">
                      Durum
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 20).map((user) => {
                    const userBalances = balances[user.id] || [];
                    
                    return (
                      <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          <Link to={`/personel/${user.id}`} className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-sm font-semibold">
                              {(user.firstname?.[0] || '') + (user.lastname?.[0] || '')}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 group-hover:text-teal-600 transition-colors">
                                {user.firstname} {user.lastname}
                              </p>
                              <p className="text-xs text-slate-500">{user.job || '-'}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-slate-700">
                            {userBalances.length > 0 ? userBalances[0].label_type || '-' : '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-sm font-semibold text-slate-900">
                            {userBalances.length > 0 ? (userBalances[0].annual_quota || userBalances[0].total_days || '-') : '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-sm text-slate-700">
                            {userBalances.length > 0 ? (userBalances[0].days_taken || userBalances[0].used || 0) : '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`text-sm font-bold ${
                            (userBalances[0]?.days_available || userBalances[0]?.remaining || 0) > 0
                              ? 'text-teal-600'
                              : 'text-red-600'
                          }`}>
                            {userBalances.length > 0 ? (userBalances[0].days_available || userBalances[0].remaining || 0) : '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {userBalances.length > 0 ? (
                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden mx-auto">
                              <div
                                className={`h-full rounded-full ${
                                  ((userBalances[0].days_taken || 0) / (userBalances[0].annual_quota || userBalances[0].total_days || 1)) > 0.8
                                    ? 'bg-red-500'
                                    : 'bg-teal-500'
                                }`}
                                style={{
                                  width: `${Math.min(
                                    ((userBalances[0].days_taken || 0) / (userBalances[0].annual_quota || userBalances[0].total_days || 1)) * 100,
                                    100
                                  )}%`
                                }}
                              />
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {userBalances.length > 0 ? (
                            (userBalances[0].days_available || userBalances[0].remaining || 0) > 5 ? (
                              <Badge variant="success">Yeterli</Badge>
                            ) : (userBalances[0].days_available || userBalances[0].remaining || 0) > 0 ? (
                              <Badge variant="warning">Dikkat</Badge>
                            ) : (
                              <Badge variant="danger">Bitmiş</Badge>
                            )
                          ) : (
                            <Badge variant="gray">Veri Yok</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Info Card */}
      <Card className="!bg-blue-50 !border-blue-100">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">İzin Bakiyesi Hakkında</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Bu rapor Dolibarr HRM modülündeki izin bakiyelerini gösterir.</li>
              <li>Bakiyeler her yılın başında güncellenir.</li>
              <li>Onaylanan izin talepleri bakiyeden düşülür.</li>
              <li>Kritik bakiye, 2 gün veya daha az kalan personelleri gösterir.</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default IzinBakiyesi;