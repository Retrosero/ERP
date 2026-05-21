/**
 * Performans Dashboard
 * Satış, stok, finans ve HR metrikleri
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

// Chart components using Recharts
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Mock data for charts
const salesData = [
  { month: 'Oca', satış: 125000, hedef: 100000 },
  { month: 'Şub', satış: 158000, hedef: 120000 },
  { month: 'Mar', satış: 189000, hedef: 140000 },
  { month: 'Nis', satış: 145000, hedef: 150000 },
  { month: 'May', satış: 178000, hedef: 160000 },
  { month: 'Haz', satış: 210000, hedef: 180000 },
  { month: 'Tem', satış: 195000, hedef: 200000 },
  { month: 'Ağu', satış: 235000, hedef: 220000 },
  { month: 'Eyl', satış: 268000, hedef: 240000 },
  { month: 'Eki', satış: 289000, hedef: 260000 },
  { month: 'Kas', satış: 312000, hedef: 280000 },
  { month: 'Ara', satış: 345000, hedef: 300000 },
];

const categoryData = [
  { name: 'Elektronik', value: 450000, color: '#3b82f6' },
  { name: 'Giyim', value: 280000, color: '#10b981' },
  { name: 'Gıda', value: 195000, color: '#f59e0b' },
  { name: 'Mobilya', value: 165000, color: '#8b5cf6' },
  { name: 'Diğer', value: 110000, color: '#6b7280' },
];

const employeePerformance = [
  { name: 'Ahmet Y.', satış: 85000, hedef: 80000 },
  { name: 'Ayşe K.', satış: 72000, hedef: 75000 },
  { name: 'Mehmet D.', satış: 95000, hedef: 85000 },
  { name: 'Fatma S.', satış: 68000, hedef: 70000 },
  { name: 'Ali R.', satış: 88000, hedef: 80000 },
];

const projectProgress = [
  { name: 'E-Ticaret', progress: 85, budget: 250000 },
  { name: 'Mobil App', progress: 62, budget: 180000 },
  { name: 'Web Sitesi', progress: 45, budget: 120000 },
  { name: 'ERP', progress: 78, budget: 350000 },
];

// KPI Cards Data
const kpiCards = [
  {
    title: 'Toplam Satış',
    value: '2,847,500',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    title: 'Aktif Müşteri',
    value: '1,284',
    change: '+8.2%',
    trend: 'up',
    icon: Users,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    title: 'Açık Sipariş',
    value: '147',
    change: '-3.1%',
    trend: 'down',
    icon: ShoppingCart,
    color: 'from-orange-500 to-amber-600',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
  },
  {
    title: 'Stok Değeri',
    value: '892,450',
    change: '+5.7%',
    trend: 'up',
    icon: Package,
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
];

export default function PerformansDashboard() {
  const [dateRange, setDateRange] = useState<'hafta' | 'ay' | 'yil'>('ay');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const refreshData = () => {
    setIsLoading(true);
    setLastUpdate(new Date());
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Performans Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Satış, stok ve iş performansı metrikleri
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-xl border border-slate-200 p-1">
            <button
              onClick={() => setDateRange('hafta')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                dateRange === 'hafta'
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              Hafta
            </button>
            <button
              onClick={() => setDateRange('ay')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                dateRange === 'ay'
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              Ay
            </button>
            <button
              onClick={() => setDateRange('yil')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                dateRange === 'yil'
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              Yıl
            </button>
          </div>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Yenile
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={index}
              className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', kpi.bgColor)}>
                    <Icon className={cn('w-6 h-6', kpi.textColor)} />
                  </div>
                  <div className={cn(
                    'flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full',
                    kpi.trend === 'up' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  )}>
                    {kpi.trend === 'up' ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {kpi.change}
                  </div>
                </div>
                <p className="text-slate-500 text-sm font-medium">{kpi.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{kpi.value}</p>
                <p className="text-xs text-slate-400 mt-2">
                  Son güncelleme: {formatDate(lastUpdate, 'time')}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Satış Trendi */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Satış Trendi</h3>
              <p className="text-sm text-slate-500">Aylık satış performansı</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-teal-500" />
                <span className="text-sm text-slate-600">Satış</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <span className="text-sm text-slate-600">Hedef</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSatış" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area
                  type="monotone"
                  dataKey="satış"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  fill="url(#colorSatış)"
                />
                <Area
                  type="monotone"
                  dataKey="hedef"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Kategori Dağılımı */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Kategori Dağılımı</h3>
              <p className="text-sm text-slate-500">Satış kategorileri</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {categoryData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personel Performansı */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Personel Performansı</h3>
              <p className="text-sm text-slate-500">Satış temsilcileri</p>
            </div>
            <Link
              to="/yonetim"
              className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              Detaylar
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employeePerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `${v / 1000}k`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#94a3b8" width={60} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="satış" fill="#14b8a6" radius={[0, 4, 4, 0]} barSize={24} />
                <Bar dataKey="hedef" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Proje İlerlemesi */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Proje İlerlemesi</h3>
              <p className="text-sm text-slate-500">Aktif projeler</p>
            </div>
            <Link
              to="/projeler"
              className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              Tümü
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {projectProgress.map((project, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">{project.name}</span>
                  <span className="text-sm font-semibold text-slate-900">{project.progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      project.progress >= 80 ? 'bg-emerald-500' :
                      project.progress >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Son Aktiviteler */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Son Aktiviteler</h3>
            <Badge variant="default" className="bg-teal-100 text-teal-700">Canlı</Badge>
          </div>
          <div className="space-y-4">
            {[
              { icon: ShoppingCart, text: 'Yeni sipariş #10245 oluşturuldu', time: '2 dk önce', color: 'bg-blue-500' },
              { icon: Package, text: 'Stok girişi: 150 adet ürün eklendi', time: '15 dk önce', color: 'bg-emerald-500' },
              { icon: Users, text: 'Yeni müşteri kaydı: ABC Ltd.', time: '1 saat önce', color: 'bg-purple-500' },
              { icon: DollarSign, text: 'Tahsilat yapıldı: ₺45,000', time: '2 saat önce', color: 'bg-amber-500' },
              { icon: AlertTriangle, text: 'Kritik stok uyarısı: Ürün-X', time: '3 saat önce', color: 'bg-red-500' },
            ].map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start gap-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', `${activity.color}/10`)}>
                    <Icon className={cn('w-4 h-4', activity.color.replace('/', '-'))} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">{activity.text}</p>
                    <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Hızlı İstatistikler */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Hızlı İstatistikler</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Aylık Hedef</p>
                  <p className="text-lg font-semibold text-slate-900">₺2,500,000</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-600">87%</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Ortalama Sipariş Süresi</p>
                  <p className="text-lg font-semibold text-slate-900">2.4 gün</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Müşteri Memnuniyeti</p>
                  <p className="text-lg font-semibold text-slate-900">4.7/5.0</p>
                </div>
              </div>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={cn('w-4 h-4', star <= 4 ? 'text-amber-400' : 'text-slate-300')} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Yaklaşan Görevler */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Yaklaşan Görevler</h3>
          <div className="space-y-3">
            {[
              { title: 'Q4 Satış Raporu', due: 'Bugün', priority: 'high', color: 'bg-red-500' },
              { title: 'Müşteri Toplantısı', due: 'Yarın', priority: 'medium', color: 'bg-amber-500' },
              { title: 'Stok Sayımı', due: '22 Mayıs', priority: 'medium', color: 'bg-amber-500' },
              { title: 'Eğitim Oturumu', due: '25 Mayıs', priority: 'low', color: 'bg-blue-500' },
            ].map((task, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className={cn('w-2 h-10 rounded-full', task.color)} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{task.title}</p>
                  <p className="text-xs text-slate-400">{task.due}</p>
                </div>
                <Badge
                  variant="default"
                  className={cn(
                    'text-xs',
                    task.priority === 'high' ? 'bg-red-100 text-red-600' :
                    task.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                    'bg-blue-100 text-blue-600'
                  )}
                >
                  {task.priority === 'high' ? 'Acil' : task.priority === 'medium' ? 'Normal' : 'Düşük'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}