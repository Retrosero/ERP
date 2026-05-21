/**
 * İK Analitik
 * İnsan kaynakları metrikleri ve analizi
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserPlus,
  UserX,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  DollarSign,
  Award,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  Briefcase,
  Heart,
  GraduationCap,
  AlertTriangle,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

// Chart components
import {
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
  AreaChart,
  Area,
} from 'recharts';

// Employee demographics
const departmentData = [
  { name: 'Satış', value: 45, color: '#3b82f6' },
  { name: 'Muhasebe', value: 22, color: '#10b981' },
  { name: 'IT', value: 18, color: '#8b5cf6' },
  { name: 'Üretim', value: 35, color: '#f59e0b' },
  { name: 'İnsan Kaynakları', value: 8, color: '#ec4899' },
  { name: 'Lojistik', value: 15, color: '#6366f1' },
];

// Age distribution
const ageDistribution = [
  { group: '18-25', count: 42, percentage: 18 },
  { group: '26-35', count: 78, percentage: 33 },
  { group: '36-45', count: 65, percentage: 28 },
  { group: '46-55', count: 38, percentage: 16 },
  { group: '55+', count: 12, percentage: 5 },
];

// Attendance data
const attendanceData = [
  { month: 'Oca', oran: 96, izin: 12 },
  { month: 'Şub', oran: 94, izin: 18 },
  { month: 'Mar', oran: 97, izin: 8 },
  { month: 'Nis', oran: 95, izin: 15 },
  { month: 'May', oran: 98, izin: 10 },
  { month: 'Haz', oran: 93, izin: 22 },
];

// Performance scores
const performanceData = [
  { name: 'Ahmet Y.', puan: 92, departman: 'Satış' },
  { name: 'Ayşe K.', puan: 88, departman: 'Satış' },
  { name: 'Mehmet D.', puan: 95, departman: 'Muhasebe' },
  { name: 'Fatma S.', puan: 85, departman: 'IT' },
  { name: 'Ali R.', puan: 90, departman: 'Üretim' },
];

// Key HR Metrics
const hrMetrics = [
  {
    title: 'Toplam Personel',
    value: '235',
    change: '+5',
    trend: 'up',
    icon: Users,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    title: 'Aktif Pozisyon',
    value: '12',
    change: '-2',
    trend: 'down',
    icon: Briefcase,
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    title: 'Devir Oranı',
    value: '8.2%',
    change: '-1.5%',
    trend: 'up',
    icon: ArrowDownRight,
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
  {
    title: 'Memnuniyet',
    value: '4.6/5',
    change: '+0.3',
    trend: 'up',
    icon: Heart,
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-600',
  },
];

// Leave balance
const leaveBalance = [
  { type: 'Yıllık İzin', total: 20, used: 12, remaining: 8 },
  { type: 'Raporlu', total: 14, used: 3, remaining: 11 },
  { type: 'Doğum İzni', total: 112, used: 0, remaining: 112 },
];

export default function IKAnalitik() {
  const [dateRange, setDateRange] = useState<'ay' | 'ceyrek' | 'yil'>('ceyrek');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">İK Analitik</h1>
          <p className="text-slate-500 mt-1">
            İnsan kaynakları metrikleri ve performans analizi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-xl border border-slate-200 p-1">
            {(['ay', 'ceyrek', 'yil'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  dateRange === range
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {range === 'ay' ? 'Aylık' : range === 'ceyrek' ? 'Çeyreklik' : 'Yıllık'}
              </button>
            ))}
          </div>
          <Link
            to="/personel"
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 transition-all"
          >
            <Users className="w-4 h-4" />
            Personel Yönetimi
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {hrMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card
              key={index}
              className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
            >
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity', metric.color)} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', metric.bgColor)}>
                    <Icon className={cn('w-6 h-6', metric.textColor)} />
                  </div>
                  <div className={cn(
                    'flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full',
                    metric.trend === 'up' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  )}>
                    {metric.trend === 'up' ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {metric.change}
                  </div>
                </div>
                <p className="text-slate-500 text-sm font-medium">{metric.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{metric.value}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Department & Age Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departman Dağılımı */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Departman Dağılımı</h3>
              <p className="text-sm text-slate-500">Personel sayısı</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {departmentData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-slate-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                    <span className="text-xs text-slate-400">kişi</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Yaş Dağılımı */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Yaş Dağılımı</h3>
              <p className="text-sm text-slate-500">Demografik analiz</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis dataKey="group" type="category" tick={{ fontSize: 12 }} stroke="#94a3b8" width={50} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                  }}
                  formatter={(value: number, name: string) => [`${value} kişi`, name === 'count' ? 'Kişi Sayısı' : 'Yüzde']}
                />
                <Bar dataKey="count" fill="#14b8a6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Attendance & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Devam Oranı */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Devam Oranı</h3>
              <p className="text-sm text-slate-500">Aylık devam performansı</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-500" />
              <span className="text-sm text-slate-600">Devam Oranı</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData}>
                <defs>
                  <linearGradient id="colorOran" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[85, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="oran"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  fill="url(#colorOran)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* İzin Bakiyeleri */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">İzin Bakiyeleri</h3>
            <Link
              to="/izin-bakiyesi"
              className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              Detay
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {leaveBalance.map((leave, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">{leave.type}</span>
                  <span className="text-sm font-semibold text-slate-900">{leave.remaining}/{leave.total}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-teal-500 rounded-l-full"
                    style={{ width: `${(leave.used / leave.total) * 100}%` }}
                  />
                  <div
                    className="h-full bg-slate-300 rounded-r-full"
                    style={{ width: `${(leave.remaining / leave.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-teal-500" />
                <span className="text-sm text-slate-600">Kullanıldı</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <span className="text-sm text-slate-600">Kalan</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">En İyi Performans</h3>
              <p className="text-sm text-slate-500">Bu ayın en iyileri</p>
            </div>
            <Badge variant="default" className="bg-teal-100 text-teal-700">
              <Award className="w-3 h-3 mr-1" />
              Top 5
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Personel</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Departman</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-500">Puan</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-500">Trend</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.map((person, index) => (
                  <tr key={index} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-semibold">
                          {person.name.split(' ')[0][0]}{person.name.split(' ')[1][0]}
                        </div>
                        <span className="font-medium text-slate-900">{person.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="default" className="bg-slate-100 text-slate-600">
                        {person.departman}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                            style={{ width: `${person.puan}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{person.puan}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-600">
                        <TrendingUp className="w-3 h-3" />
                        +3
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* İşe Alım Durumu */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">İşe Alım Durumu</h3>
            <Link
              to="/ise-alim"
              className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              Detay
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {[
              { position: 'Senior Developer', applicants: 24, status: 'Mülakat', color: 'bg-blue-500' },
              { position: 'Satış Müdürü', applicants: 18, status: 'Değerlendirme', color: 'bg-amber-500' },
              { position: 'Muhasebe Uzmanı', applicants: 12, status: 'Tamamlandı', color: 'bg-emerald-500' },
              { position: 'UI Designer', applicants: 31, status: 'Yeni Başvuru', color: 'bg-purple-500' },
            ].map((job, index) => (
              <div key={index} className="flex items-start gap-4 p-3 bg-slate-50 rounded-xl">
                <div className={cn('w-2 h-12 rounded-full', job.color)} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{job.position}</p>
                  <p className="text-xs text-slate-500 mt-1">{job.applicants} başvuru</p>
                </div>
                <Badge
                  variant="default"
                  className={cn(
                    'text-xs',
                    job.status === 'Tamamlandı' ? 'bg-emerald-100 text-emerald-600' :
                    job.status === 'Mülakat' ? 'bg-blue-100 text-blue-600' :
                    job.status === 'Değerlendirme' ? 'bg-amber-100 text-amber-600' :
                    'bg-purple-100 text-purple-600'
                  )}
                >
                  {job.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* İK Maliyetleri */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personel Maliyeti */}
        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Toplam Personel Maliyeti</p>
              <p className="text-2xl font-bold text-slate-900">₺4,850,000</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-600">Maaşlar</span>
              <span className="text-sm font-semibold text-slate-900">₺3,200,000</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-600">SGK</span>
              <span className="text-sm font-semibold text-slate-900">₺890,000</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-600">Diğer</span>
              <span className="text-sm font-semibold text-slate-900">₺760,000</span>
            </div>
          </div>
        </Card>

        {/* Eğitim ve Gelişim */}
        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Eğitim Yatırımı</p>
              <p className="text-2xl font-bold text-slate-900">₺125,000</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Bu dönem eğitim saati</span>
              <span className="text-sm font-semibold text-slate-900">1,240 saat</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Eğitim alan personel</span>
              <span className="text-sm font-semibold text-slate-900">145 kişi</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Ortalama maliyet/kişi</span>
              <span className="text-sm font-semibold text-slate-900">₺862</span>
            </div>
          </div>
        </Card>

        {/* Çalışan Memnuniyeti */}
        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Çalışan Memnuniyeti</p>
              <p className="text-2xl font-bold text-slate-900">4.6/5.0</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Anket katılım</span>
              <span className="text-sm font-semibold text-slate-900">92%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Öneri sayısı</span>
              <span className="text-sm font-semibold text-slate-900">156</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Çalışan bağlılığı</span>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Heart
                    key={star}
                    className={cn('w-4 h-4', star <= 4 ? 'text-pink-500 fill-pink-500' : 'text-slate-300')}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}