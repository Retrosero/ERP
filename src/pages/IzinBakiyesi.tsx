import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { holidayApi, HOLIDAY_STATUS } from '@/lib/dolibarr-hrm';
import type { User, LeaveType, LeaveBalance } from '@/lib/types/hrm';
import { userApi } from '@/lib/dolibarr-hrm';

export function IzinBakiyesi() {
  const [users, setUsers] = useState<User[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<Record<number, LeaveBalance>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const usersData = await userApi.list();
      setUsers(usersData);

      // Fetch leave balances for each user
      const balancePromises = usersData.slice(0, 10).map(user =>
        holidayApi.getBalance(user.id, selectedYear).catch(() => null)
      );
      const balanceResults = await Promise.all(balancePromises);

      const balanceMap: Record<number, LeaveBalance> = {};
      usersData.slice(0, 10).forEach((user, index) => {
        if (balanceResults[index]) {
          balanceMap[user.id] = balanceResults[index];
        }
      });
      setBalances(balanceMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veriler yüklenirken hata oluştu');
      console.error('Leave balance fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      const types = await holidayApi.getTypes();
      setLeaveTypes(types);
    } catch (err) {
      console.error('Leave types fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchLeaveTypes();
  }, [fetchUsers, fetchLeaveTypes]);

  const getLeaveTypeLabel = (typeId: number) => {
    const type = leaveTypes.find(t => t.id === typeId);
    return type?.label || `İzin Türü #${typeId}`;
  };

  const formatDate = (date: string | number | undefined) => {
    if (!date) return '-';
    if (typeof date === 'number') {
      return new Date(date * 1000).toLocaleDateString('tr-TR');
    }
    return new Date(date).toLocaleDateString('tr-TR');
  };

  const stats = {
    totalEmployees: users.length,
    withLeaveBalance: Object.keys(balances).length,
    pendingRequests: 0, // Could calculate from holidays
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            <span className="text-slate-500">İzin bakiyeleri yükleniyor...</span>
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
            <h1 className="text-2xl font-bold text-slate-900">İzin Bakiyeleri</h1>
            <p className="text-slate-500 mt-1">Personel izin bakiyelerini ve kullanım raporlarını görüntüleyin</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            >
              <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
              <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
              <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalEmployees}</p>
                <p className="text-sm text-slate-500">Toplam Personel</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <PieChart className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.withLeaveBalance}</p>
                <p className="text-sm text-slate-500">Bakiyesi Olan</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {Object.values(balances).reduce((sum, b) => sum + (b.days_available || 0), 0)}
                </p>
                <p className="text-sm text-slate-500">Toplam Kalan Gün</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="!p-4">
            <div className="flex items-center gap-3 text-red-600">
              <XCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </Card>
        )}

        {/* Leave Types Legend */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            İzin Türleri
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {leaveTypes.map((type) => (
              <div key={type.id} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50">
                <div className="w-3 h-3 rounded-full bg-teal-500" />
                <span className="text-sm text-slate-700">{type.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Employee Leave Balance Table */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-teal-600" />
            Personel İzin Bakiyeleri ({selectedYear})
          </h3>

          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Personel bulunamadı</h3>
              <p className="text-slate-500">Henüz personel eklenmemiş.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Personel
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      İzin Türü
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Yıllık Hak
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Kullanılan
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Kalan
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Durum
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 20).map((user) => {
                    const balance = balances[user.id];
                    return (
                      <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium">
                              {(user.firstname?.[0] || '') + (user.lastname?.[0] || '')}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {user.firstname} {user.lastname}
                              </p>
                              <p className="text-xs text-slate-500">#{user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-slate-700">
                            {balance?.fk_leave_type ? getLeaveTypeLabel(balance.fk_leave_type) : '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-sm font-semibold text-slate-900">
                            {balance?.days_available || balance?.annual_quota || balance?.total_days || '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-sm text-slate-700">
                            {balance?.days_taken || balance?.used || 0}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`text-sm font-bold ${(balance?.days_available || 0) > 0 ? 'text-teal-600' : 'text-red-600'}`}>
                            {balance?.days_available || balance?.remaining || balance?.annual_quota || balance?.total_days || 0}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {(balance?.days_available !== undefined || balance?.remaining !== undefined) ? (
                            (balance.days_available || balance.remaining || 0) > 5 ? (
                              <Badge variant="success">Yeterli</Badge>
                            ) : (balance.days_available || balance.remaining || 0) > 0 ? (
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
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

export default IzinBakiyesi;