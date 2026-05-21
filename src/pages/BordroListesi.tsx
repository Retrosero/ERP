import React, { useState, useEffect, useCallback } from 'react';
import {
  Calculator, FileText, CheckCircle, XCircle, AlertCircle,
  Download, Eye, Clock, TrendingUp, Users, DollarSign,
  ChevronDown, Calendar, Filter, RefreshCw, Plus, X,
  Loader2
} from 'lucide-react';
import { userApi } from '@/lib/dolibarr-hrm';
import { payrollApi, overtimeApi, OVERTIME_TYPE_LABELS } from '@/lib/dolibarr-payroll';
import { useApi } from '@/contexts/ApiContext';

// Types
interface Payroll {
  id: number;
  user_id: number;
  user_name: string;
  user_login?: string;
  user_email?: string;
  period_year: number;
  period_month: number;
  working_days: number;
  actual_days: number;
  overtime_hours: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  status: 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID' | 'CANCELLED';
  payment_date?: string | null;
  created_at?: string;
}

interface Salary {
  id: number;
  fk_user: number;
  salary?: number;
  salaryextra?: number;
  meal_allocation?: number;
  transport_allocation?: number;
  hours_per_month?: number;
  user_name?: string;
}

interface Overtime {
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

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <Clock className="w-3 h-3" /> },
    CALCULATED: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Calculator className="w-3 h-3" /> },
    APPROVED: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
    PAID: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <DollarSign className="w-3 h-3" /> },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="w-3 h-3" /> },
  };

  const labels: Record<string, string> = {
    DRAFT: 'Taslak',
    CALCULATED: 'Hesaplandı',
    APPROVED: 'Onaylandı',
    PAID: 'Ödendi',
    PENDING: 'Bekliyor',
    CANCELLED: 'İptal Edildi',
  };

  const style = styles[status] || styles.DRAFT;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.icon}
      {labels[status] || status}
    </span>
  );
};

// Months
const months = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export const BordroListesi: React.FC = () => {
  const { config } = useApi();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [users, setUsers] = useState<{id: number; firstname: string; lastname: string; email?: string}[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [overtimes, setOvertimes] = useState<Overtime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [showCalculateModal, setShowCalculateModal] = useState(false);

  // Calculate summary
  const summary = {
    totalEmployees: payrolls.length || users.length,
    totalGross: payrolls.reduce((sum, p) => sum + (p.gross_salary || 0), 0),
    totalNet: payrolls.reduce((sum, p) => sum + (p.net_salary || 0), 0),
    totalDeductions: payrolls.reduce((sum, p) => sum + (p.total_deductions || 0), 0),
    paidCount: payrolls.filter(p => p.status === 'PAID').length,
    pendingCount: payrolls.filter(p => ['DRAFT', 'CALCULATED', 'PENDING'].includes(p.status)).length,
  };

  // Calculate payroll for a user
  const calculateUserPayroll = useCallback((userId: number, userName: string): Payroll => {
    const salary = salaries.find(s => s.fk_user === userId);
    const userOvertimes = overtimes.filter(o => o.fk_user === userId);

    const baseSalary = salary?.salary || 0;
    const mealAllowance = salary?.meal_allocation || 0;
    const transportAllowance = salary?.transport_allocation || 0;

    // Calculate overtime amounts
    const overtimeAmount = userOvertimes.reduce((sum, ot) => sum + (ot.total_amount || 0), 0);
    const overtimeHours = userOvertimes.reduce((sum, ot) => sum + ot.duration, 0);

    const grossSalary = baseSalary + mealAllowance + transportAllowance + overtimeAmount;

    // Calculate deductions (simplified Turkish labor law)
    const sgkDeduction = grossSalary * 0.14; // SGK employee share
    const unemploymentDeduction = grossSalary * 0.01; // Unemployment insurance
    const incomeTax = calculateIncomeTax(grossSalary);
    const stampDuty = grossSalary * 0.008; // Stamp duty

    const totalDeductions = sgkDeduction + unemploymentDeduction + incomeTax + stampDuty;
    const netSalary = grossSalary - totalDeductions;

    return {
      id: 0,
      user_id: userId,
      user_name: userName,
      period_year: selectedYear,
      period_month: selectedMonth,
      working_days: 22,
      actual_days: 22,
      overtime_hours: overtimeHours,
      gross_salary: Math.round(grossSalary * 100) / 100,
      total_deductions: Math.round(totalDeductions * 100) / 100,
      net_salary: Math.round(netSalary * 100) / 100,
      status: 'DRAFT',
    };
  }, [salaries, overtimes, selectedYear, selectedMonth]);

  // Income tax calculation (2025 brackets)
  const calculateIncomeTax = (grossSalary: number): number => {
    const annualGross = grossSalary * 12;
    let annualTax = 0;

    if (annualGross <= 110000) {
      annualTax = annualGross * 0.15;
    } else if (annualGross <= 230000) {
      annualTax = 16500 + (annualGross - 110000) * 0.20;
    } else if (annualGross <= 580000) {
      annualTax = 40500 + (annualGross - 230000) * 0.27;
    } else if (annualGross <= 3000000) {
      annualTax = 134850 + (annualGross - 580000) * 0.35;
    } else {
      annualTax = 882850 + (annualGross - 3000000) * 0.40;
    }

    return annualTax / 12;
  };

  // Fetch data from Dolibarr API
  const fetchData = useCallback(async () => {
    if (!config.isConnected) {
      setError('Dolibarr bağlantısı kurulamadı. Lütfen ayarları kontrol edin.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch users
      const usersResponse = await userApi.list({ limit: 100 });
      setUsers(usersResponse);

      // Fetch salaries from Dolibarr HR module
      try {
        const salariesResponse = await payrollApi.listSalaries({ limit: 100 });
        setSalaries(salariesResponse);
      } catch (e) {
        console.log('Salary API not available, using user salary field');
        // Fallback: use salary field from user
        setSalaries(usersResponse.map(u => ({
          id: 0,
          fk_user: u.id,
          salary: (u as any).salary || 0,
          user_name: `${u.firstname} ${u.lastname}`,
        })));
      }

      // Fetch overtime records
      try {
        const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
        const overtimesResponse = await overtimeApi.list({
          limit: 100,
          date_start: startDate,
          date_end: endDate,
        });
        setOvertimes(overtimesResponse);
      } catch (e) {
        console.log('Overtime API not available');
        setOvertimes([]);
      }

      // Calculate payrolls for all users
      const calculatedPayrolls: Payroll[] = usersResponse.map(user => {
        const userName = `${user.firstname} ${user.lastname}`;
        return calculateUserPayroll(user.id, userName);
      });
      setPayrolls(calculatedPayrolls);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [config.isConnected, selectedYear, selectedMonth, calculateUserPayroll]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewDetail = (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setShowDetailModal(true);
  };

  const handleCalculate = async () => {
    setShowCalculateModal(false);
    setLoading(true);

    try {
      // Recalculate all payrolls
      const calculatedPayrolls: Payroll[] = users.map(user => {
        const userName = `${user.firstname} ${user.lastname}`;
        return {
          ...calculateUserPayroll(user.id, userName),
          status: 'CALCULATED' as const,
        };
      });
      setPayrolls(calculatedPayrolls);
    } catch (err) {
      setError('Hesaplama sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (payrollId: number) => {
    // In real implementation, this would call the backend API
    setPayrolls(prev => prev.map(p =>
      p.id === payrollId ? { ...p, status: 'APPROVED' as const } : p
    ));
  };

  const handlePay = async (payrollId: number) => {
    // In real implementation, this would call the backend API
    setPayrolls(prev => prev.map(p =>
      p.id === payrollId ? { ...p, status: 'PAID' as const, payment_date: new Date().toISOString() } : p
    ));
  };

  return (
    <div className="p-6">

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Period Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Dönem:</span>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {months.map((month, index) => (
              <option key={index} value={index + 1}>{month}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
            <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
            <option value={new Date().getFullYear() - 2}>{new Date().getFullYear() - 2}</option>
          </select>
          <span className="text-sm text-gray-500">
            {payrolls.length} personel
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Toplam Personel</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalEmployees}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Toplam Brüt Maaş</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalGross)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Toplam Net Maaş</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalNet)}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ödenen / Bekleyen</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                <span className="text-green-600">{summary.paidCount}</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-orange-600">{summary.pendingCount}</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
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

      {/* Payroll Table */}
      {!loading && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Bordro Listesi</h2>
            <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              Excel'e Aktar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personel</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Çalışma</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Brüt Maaş</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Kesintiler</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Maaş</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payrolls.map((payroll) => (
                  <tr key={payroll.id || payroll.user_id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {payroll.user_name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{payroll.user_name}</p>
                          <p className="text-sm text-gray-500">#{payroll.user_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="text-sm">
                        <span className="text-gray-900">{payroll.actual_days}/{payroll.working_days}</span>
                        {payroll.overtime_hours > 0 && (
                          <span className="ml-2 text-orange-600 text-xs">+{payroll.overtime_hours} saat mesai</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-gray-900">
                      {formatCurrency(payroll.gross_salary)}
                    </td>
                    <td className="px-5 py-4 text-right text-red-600">
                      -{formatCurrency(payroll.total_deductions)}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-green-600">
                      {formatCurrency(payroll.net_salary)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={payroll.status} />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewDetail(payroll)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Detay"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {payroll.status === 'CALCULATED' && (
                          <button
                            onClick={() => handleApprove(payroll.id)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Onayla"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {payroll.status === 'APPROVED' && (
                          <button
                            onClick={() => handlePay(payroll.id)}
                            className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
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

          {/* Table Footer */}
          <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Toplam: {payrolls.length} kayıt</span>
              <div className="flex items-center gap-4">
                <span className="text-gray-600">
                  Toplam Brüt: <strong className="text-gray-900">{formatCurrency(summary.totalGross)}</strong>
                </span>
                <span className="text-gray-600">
                  Toplam Net: <strong className="text-green-600">{formatCurrency(summary.totalNet)}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Bordro Detayı</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Personnel Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xl font-medium">
                      {selectedPayroll.user_name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedPayroll.user_name}</h4>
                    <p className="text-gray-500">#{selectedPayroll.user_id}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {months[selectedPayroll.period_month - 1]} {selectedPayroll.period_year}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <StatusBadge status={selectedPayroll.status} />
                  </div>
                </div>
              </div>

              {/* Working Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{selectedPayroll.actual_days}</p>
                  <p className="text-sm text-gray-500">Çalışma Günü</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-orange-600">{selectedPayroll.overtime_hours}</p>
                  <p className="text-sm text-gray-500">Mesai Saati</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{selectedPayroll.working_days - selectedPayroll.actual_days}</p>
                  <p className="text-sm text-gray-500">Devamsızlık</p>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Maaş Detayı</h4>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Brüt Maaş</span>
                    <span className="text-lg font-semibold text-gray-900">{formatCurrency(selectedPayroll.gross_salary)}</span>
                  </div>
                  <div className="border-t border-green-200 pt-2 mt-2">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Temel Maaş</span>
                        <span className="text-green-600">{formatCurrency(selectedPayroll.gross_salary - selectedPayroll.overtime_hours * 200)}</span>
                      </div>
                      {selectedPayroll.overtime_hours > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Mesai Ücreti</span>
                          <span className="text-green-600">+{formatCurrency(selectedPayroll.overtime_hours * 200)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Toplam Kesinti</span>
                    <span className="text-lg font-semibold text-red-600">-{formatCurrency(selectedPayroll.total_deductions)}</span>
                  </div>
                  <div className="border-t border-red-200 pt-2 mt-2">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">SGK (14%)</span>
                        <span className="text-red-600">-{formatCurrency(selectedPayroll.gross_salary * 0.14)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">İşsizlik Sigortası (1%)</span>
                        <span className="text-red-600">-{formatCurrency(selectedPayroll.gross_salary * 0.01)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Gelir Vergisi</span>
                        <span className="text-red-600">-{formatCurrency(selectedPayroll.gross_salary * 0.15)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Damga Vergisi</span>
                        <span className="text-red-600">-{formatCurrency(selectedPayroll.gross_salary * 0.008)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-blue-900">Net Maaş</span>
                    <span className="text-2xl font-bold text-blue-600">{formatCurrency(selectedPayroll.net_salary)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download className="w-4 h-4" />
                  PDF İndir
                </button>
                {selectedPayroll.status === 'CALCULATED' && (
                  <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <CheckCircle className="w-4 h-4" />
                    Onayla
                  </button>
                )}
                {selectedPayroll.status === 'APPROVED' && (
                  <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    <DollarSign className="w-4 h-4" />
                    Ödeme Yap
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calculate Modal */}
      {showCalculateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Bordro Hesapla</h3>
              <button
                onClick={() => setShowCalculateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">
                <strong>{months[selectedMonth - 1]} {selectedYear}</strong> dönemi için bordro hesaplaması başlatılacak.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Dikkat!</p>
                    <p className="mt-1">Mevcut taslak bordrolar silinecek ve yeniden hesaplanacaktır.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCalculateModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleCalculate}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Calculator className="w-4 h-4" />
                  Hesapla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};