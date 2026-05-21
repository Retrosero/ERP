import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users,
  Package, Receipt, Calendar, Download, Filter, FileText,
  PieChart as LucidePieChart, Activity, Loader2
} from 'lucide-react';
import { Card, Button, Select, StatCard, Alert } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { invoiceApi, orderApi, thirdPartyApi, productApi } from '@/lib/dolibarr';
import type { Invoice, Order, ThirdParty, Product } from '@/lib/types/dolibarr';

// Recharts components
import {
  AreaChart,
  Area,
  BarChart as BarChartComp,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function RaporMerkezi() {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedReport, setSelectedReport] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Report data
  const [monthlyData, setMonthlyData] = useState<{ month: string; gelir: number; gider: number }[]>([]);
  const [topCustomers, setTopCustomers] = useState<{ name: string; amount: number; invoiceCount: number }[]>([]);
  const [agingData, setAgingData] = useState<{ label: string; amount: number; color: string }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [stats, setStats] = useState({ totalSales: 0, totalExpenses: 0, grossProfit: 0, collectionRate: 0 });

  // Fetch report data from Dolibarr
  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [invoicesData, ordersData, customersData] = await Promise.all([
        invoiceApi.list({ limit: 100, sortfield: 'date', sortorder: 'DESC' }).catch(() => [] as Invoice[]),
        orderApi.list({ limit: 100, sortfield: 'date_commande', sortorder: 'DESC' }).catch(() => [] as Order[]),
        thirdPartyApi.list({ limit: 100, mode: 'customer' }).catch(() => [] as ThirdParty[]),
      ]);

      // Calculate totals
      const totalSales = (invoicesData as Invoice[]).reduce((sum, inv) => sum + ((inv.total_ttc as number) || 0), 0);
      const paidInvoices = invoicesData.filter((inv: Invoice) => inv.status === 2);
      const paidAmount = paidInvoices.reduce((sum, inv) => sum + ((inv.total_paye as number) || 0), 0);
      const collectionRate = totalSales > 0 ? Math.round((paidAmount / totalSales) * 100) : 0;

      setStats({
        totalSales,
        totalExpenses: 0, // Would need expense API
        grossProfit: totalSales * 0.4, // Estimate
        collectionRate,
      });

      // Calculate top customers by invoice total
      const customerTotals = new Map<number, { name: string; amount: number; count: number }>();
      invoicesData.forEach((inv: Invoice) => {
        const socId = inv.socid || inv.fk_soc;
        if (socId) {
          const existing = customerTotals.get(socId) || { name: '', amount: 0, count: 0 };
          const customer = (customersData as ThirdParty[]).find(c => c.id === socId);
          customerTotals.set(socId, {
            name: customer?.name || `Müşteri #${socId}`,
            amount: existing.amount + ((inv.total_ttc as number) || 0),
            count: existing.count + 1,
          });
        }
      });

      const topCust = Array.from(customerTotals.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map(c => ({ name: c.name, amount: c.amount, invoiceCount: c.count }));

      setTopCustomers(topCust);

      // Age analysis
      const currentTimestamp = Date.now();
      const aging = [
        { label: 'Vadesinde', amount: 0, color: '#10b981' },
        { label: '1-30 gün geç', amount: 0, color: '#f59e0b' },
        { label: '31-60 gün geç', amount: 0, color: '#f97316' },
        { label: '60+ gün geç', amount: 0, color: '#ef4444' },
      ];

      invoicesData.forEach(inv => {
        if (inv.status !== 2 && inv.date_lim_reglement) {
          const dueDate = typeof inv.date_lim_reglement === 'number'
            ? inv.date_lim_reglement * 1000
            : new Date(inv.date_lim_reglement).getTime();
          const daysPastDue = Math.floor((currentTimestamp - dueDate) / (1000 * 60 * 60 * 24));
          const remain = (inv.remain_to_pay || inv.total_ttc || 0) as number;

          if (daysPastDue <= 0) aging[0].amount += remain;
          else if (daysPastDue <= 30) aging[1].amount += remain;
          else if (daysPastDue <= 60) aging[2].amount += remain;
          else aging[3].amount += remain;
        }
      });

      setAgingData(aging);

      // Monthly data (last 6 months) - aggregate from invoices
      const nowDate = new Date();
      const months: { month: string; gelir: number; gider: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
        const monthStr = d.toLocaleDateString('tr-TR', { month: 'short' });
        const monthStart = d.getTime() / 1000;
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() / 1000;

        const monthInvoices = invoicesData.filter((inv: Invoice) => {
          const invDate = typeof inv.date === 'number' ? inv.date : 0;
          return invDate >= monthStart && invDate < monthEnd;
        });

        months.push({
          month: monthStr,
          gelir: monthInvoices.reduce((sum, inv) => sum + ((inv.total_ttc as number) || 0), 0),
          gider: 0, // Would need expense data
        });
      }
      setMonthlyData(months);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Raporlar yüklenirken hata oluştu');
      console.error('Report fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
          <p className="text-gray-500">Raporlar yükleniyor...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Alert type="error" title="Hata">
          {error}
        </Alert>
      </>
    );
  }

  const reportTypes = [
    { id: 'dashboard', label: 'Özet Rapor', icon: Activity, description: 'Genel durum özeti' },
    { id: 'sales', label: 'Satış Raporu', icon: TrendingUp, description: 'Satış performansı' },
    { id: 'collection', label: 'Tahsilat Raporu', icon: DollarSign, description: 'Alacak takibi' },
    { id: 'cashflow', label: 'Nakit Akışı', icon: Activity, description: 'Gelir-gider raporu' },
    { id: 'vat', label: 'KDV Raporu', icon: Receipt, description: 'KDV beyannamesi' },
    { id: 'aging', label: 'Yaşlandırma', icon: Calendar, description: 'Vadesi geçen alacaklar' },
  ];

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Rapor Merkezi</h1>
          <p className="page-subtitle">İşletmenizin finansal raporlarını görüntüleyin</p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedPeriod}
            onChange={(value) => setSelectedPeriod(value)}
            options={[
              { value: 'weekly', label: 'Bu Hafta' },
              { value: 'monthly', label: 'Bu Ay' },
              { value: 'quarterly', label: 'Bu Çeyrek' },
              { value: 'yearly', label: 'Bu Yıl' },
            ]}
            className="w-40"
          />
          <Button variant="secondary">
            <Download className="w-4 h-4" />
            Dışa Aktar
          </Button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {reportTypes.map(report => (
          <Card
            key={report.id}
            className={`cursor-pointer hover:shadow-md transition-all ${
              selectedReport === report.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedReport(report.id)}
          >
            <div className="p-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <report.icon className="w-5 h-5" />
              </div>
              <p className="font-medium text-sm">{report.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Toplam Satış"
          value={formatCurrency(stats.totalSales, false)}
          icon={TrendingUp}
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          title="Toplam Gider"
          value={formatCurrency(stats.totalExpenses, false)}
          icon={TrendingDown}
        />
        <StatCard
          title="Brüt Kar"
          value={formatCurrency(stats.grossProfit, false)}
          icon={BarChart3}
          trend={{ value: 8, positive: true }}
        />
        <StatCard
          title="Tahsilat Oranı"
          value={`%${stats.collectionRate}`}
          icon={DollarSign}
          trend={{ value: 3, positive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gelir-Gider Grafiği */}
        <Card>
          <Card.Header>
            <h3 className="font-semibold">Aylık Gelir-Gider</h3>
          </Card.Header>
          <Card.Body>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toLocaleString('tr-TR')} ₺`} />
                <Legend />
                <Area type="monotone" dataKey="gelir" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Gelir" />
                <Area type="monotone" dataKey="gider" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Gider" />
              </AreaChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>

        {/* Satış Dağılımı */}
        <Card>
          <Card.Header>
            <h3 className="font-semibold">Satış Dağılımı</h3>
          </Card.Header>
          <Card.Body>
            <div className="flex items-center">
              <ResponsiveContainer width="60%" height={300}>
                <RechartsPie>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="w-40 space-y-3">
                {categoryData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="font-semibold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* En Çok Satan Müşteriler */}
        <Card>
          <Card.Header className="flex items-center justify-between">
            <h3 className="font-semibold">En Çok Satan Müşteriler</h3>
            <Button variant="ghost" size="sm">
              <Users className="w-4 h-4" />
              Tümünü Gör
            </Button>
          </Card.Header>
          <Card.Body className="p-0">
            {topCustomers.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {topCustomers.map((customer, index) => (
                  <div key={customer.name} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.invoiceCount} fatura</p>
                      </div>
                    </div>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(customer.amount, false)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-4 text-center text-gray-500">Müşteri verisi bulunamadı</p>
            )}
          </Card.Body>
        </Card>

        {/* Alacak Yaşlandırma */}
        <Card>
          <Card.Header className="flex items-center justify-between">
            <h3 className="font-semibold">Alacak Yaşlandırma</h3>
            <Button variant="ghost" size="sm">
              <Calendar className="w-4 h-4" />
              Detay
            </Button>
          </Card.Header>
          <Card.Body>
            <ResponsiveContainer width="100%" height={250}>
              <BarChartComp data={agingData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="label" width={100} />
                <Tooltip formatter={(value: number) => `${formatCurrency(value, false)}`} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {agingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChartComp>
            </ResponsiveContainer>
          </Card.Body>
        </Card>
      </div>

      {/* KDV Özeti */}
      <Card>
        <Card.Header className="flex items-center justify-between">
          <h3 className="font-semibold">KDV Özeti</h3>
          <Button variant="ghost" size="sm">
            <Receipt className="w-4 h-4" />
            Beyanname Detayı
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Dönem</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Satış KDV</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Alış KDV</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Ödenecek KDV</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">İndirilecek KDV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'].map((month, i) => (
                  <tr key={month} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{month} 2024</td>
                    <td className="px-6 py-4 text-right text-green-600">
                      {(8500 + i * 500).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </td>
                    <td className="px-6 py-4 text-right text-red-600">
                      {(4200 + i * 200).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">
                      {(4300 + i * 300).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </td>
                    <td className="px-6 py-4 text-right text-blue-600">
                      {(3200 + i * 150).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>
    </>
  );
}