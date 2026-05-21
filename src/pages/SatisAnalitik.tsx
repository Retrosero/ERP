/**
 * Satış Analitik
 * Detaylı satış metrikleri ve trend analizi
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Award,
  Percent,
  CreditCard,
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
} from 'recharts';

// Sales funnel data
const salesFunnelData = [
  { name: 'Teklif Oluşturuldu', value: 150, fill: '#3b82f6' },
  { name: 'Teklif Görüntülendi', value: 120, fill: '#6366f1' },
  { name: 'Müzakere', value: 80, fill: '#8b5cf6' },
  { name: 'Sipariş Verildi', value: 65, fill: '#a855f7' },
  { name: 'Tamamlandı', value: 55, fill: '#14b8a6' },
];

// Top products data
const topProductsData = [
  { name: 'Ürün A', satış: 125000, adet: 450, trend: 15 },
  { name: 'Ürün B', satış: 98000, adet: 320, trend: 8 },
  { name: 'Ürün C', satış: 87000, adet: 280, trend: -5 },
  { name: 'Ürün D', satış: 76000, adet: 240, trend: 12 },
  { name: 'Ürün E', satış: 65000, adet: 210, trend: 3 },
];

// Regional sales
const regionalSales = [
  { region: 'İstanbul', satış: 890000, percentage: 35 },
  { region: 'Ankara', satış: 450000, percentage: 18 },
  { region: 'İzmir', satış: 380000, percentage: 15 },
  { region: 'Bursa', satış: 210000, percentage: 8 },
  { region: 'Antalya', satış: 185000, percentage: 7 },
  { region: 'Diğer', satış: 732500, percentage: 17 },
];

// Conversion data
const conversionData = [
  { month: 'Oca', teklif: 45, siparis: 32, fatura: 30 },
  { month: 'Şub', teklif: 52, siparis: 38, fatura: 35 },
  { month: 'Mar', teklif: 48, siparis: 35, fatura: 33 },
  { month: 'Nis', teklif: 60, siparis: 45, fatura: 42 },
  { month: 'May', teklif: 55, siparis: 42, fatura: 40 },
  { month: 'Haz', teklif: 68, siparis: 52, fatura: 48 },
];

// Key metrics
const keyMetrics = [
  {
    title: 'Toplam Ciro',
    value: '2,847,500',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'emerald',
    prefix: '₺',
  },
  {
    title: 'Ortalama Sipariş',
    value: '18,420',
    change: '+5.2%',
    trend: 'up',
    icon: ShoppingCart,
    color: 'blue',
    prefix: '₺',
  },
  {
    title: 'Müşteri Başına Satış',
    value: '2,218',
    change: '+8.7%',
    trend: 'up',
    icon: Users,
    color: 'purple',
    prefix: '₺',
  },
  {
    title: 'Dönüşüm Oranı',
    value: '68%',
    change: '+3.2%',
    trend: 'up',
    icon: Percent,
    color: 'amber',
    prefix: '',
  },
];

export default function SatisAnalitik() {
  const [dateRange, setDateRange] = useState<'1hafta' | '1ay' | '3ay' | '1yil'>('1ay');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-500 to-teal-600',
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-violet-600',
    amber: 'from-amber-500 to-orange-600',
  };

  const textColorMap: Record<string, string> = {
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    amber: 'text-amber-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Satış Analitik</h1>
          <p className="text-slate-500 mt-1">
            Detaylı satış metrikleri ve performans analizi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-xl border border-slate-200 p-1">
            {(['1hafta', '1ay', '3ay', '1yil'] as const).map((range) => (
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
                {range === '1hafta' ? '1 Hafta' : range === '1ay' ? '1 Ay' : range === '3ay' ? '3 Ay' : '1 Yıl'}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all">
            <Download className="w-4 h-4" />
            Rapor İndir
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {keyMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card
              key={index}
              className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
            >
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity', colorMap[metric.color])} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100')}>
                    <Icon className={cn('w-6 h-6', textColorMap[metric.color])} />
                  </div>
                  <div className={cn(
                    'flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full',
                    metric.trend === 'up' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
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
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {metric.prefix}{metric.value}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Satış Trendi */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Satış Trendi</h3>
              <p className="text-sm text-slate-500">Dönüşüm hunisi</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis dataKey="month" type="category" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="teklif" name="Teklif" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="siparis" name="Sipariş" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="fatura" name="Fatura" fill="#14b8a6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Satış Hunisi */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Satış Hunisi</h3>
              <p className="text-sm text-slate-500">Müşteri yolculuğu</p>
            </div>
          </div>
          <div className="space-y-3">
            {salesFunnelData.map((item, index) => {
              const percentage = Math.round((item.value / 150) * 100);
              return (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                      <Badge variant="default" className="bg-slate-100 text-slate-600">{percentage}%</Badge>
                    </div>
                  </div>
                  <div className="h-8 bg-slate-100 rounded-xl overflow-hidden">
                    <div
                      className="h-full rounded-xl transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.fill,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Toplam Dönüşüm</p>
                <p className="text-2xl font-bold text-slate-900">36.7%</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Products & Regions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* En Çok Satan Ürünler */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">En Çok Satan Ürünler</h3>
              <p className="text-sm text-slate-500">Top 5 ürün performansı</p>
            </div>
            <Link
              to="/urunler"
              className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              Tüm Ürünler
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Ürün</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-500">Satış</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-500">Adet</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-500">Trend</th>
                </tr>
              </thead>
              <tbody>
                {topProductsData.map((product, index) => (
                  <tr key={index} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                          <Package className="w-5 h-5 text-slate-600" />
                        </div>
                        <span className="font-medium text-slate-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-slate-900">
                      {formatCurrency(product.satış)}
                    </td>
                    <td className="py-4 px-4 text-right text-slate-600">
                      {product.adet} adet
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
                        product.trend > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                      )}>
                        {product.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(product.trend)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Bölgesel Satış */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Bölgesel Dağılım</h3>
              <p className="text-sm text-slate-500">Satış bölgeleri</p>
            </div>
          </div>
          <div className="space-y-4">
            {regionalSales.map((region, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">{region.region}</span>
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(region.satış)}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all"
                    style={{ width: `${region.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 text-right">{region.percentage}%</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ödeme Yöntemleri */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Ödeme Yöntemleri</h3>
          <div className="space-y-4">
            {[
              { method: 'Kredi Kartı', amount: '1,423,750', percentage: 50, color: 'bg-blue-500' },
              { method: 'Havale/EFT', amount: '854,250', percentage: 30, color: 'bg-emerald-500' },
              { method: 'Nakit', amount: '426,125', percentage: 15, color: 'bg-amber-500' },
              { method: 'Çek/Senet', amount: '143,375', percentage: 5, color: 'bg-purple-500' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className={cn('w-4 h-4 rounded', item.color)} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{item.method}</span>
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(parseInt(item.amount.replace(/,/g, '')))}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', item.color)}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Müşteri Segmentasyonu */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Müşteri Segmentasyonu</h3>
          <div className="space-y-4">
            {[
              { segment: 'VIP Müşteriler', count: 45, value: '1,423,750', color: 'bg-purple-500' },
              { segment: 'Aktif Müşteriler', count: 892, value: '998,625', color: 'bg-emerald-500' },
              { segment: 'Yeni Müşteriler', count: 347, value: '312,500', color: 'bg-blue-500' },
              { segment: 'Riskli Müşteriler', count: 23, value: '112,625', color: 'bg-red-500' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', item.color, 'bg-opacity-20')}>
                  <Users className={cn('w-5 h-5', item.color.replace('bg-', 'text-'))} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{item.segment}</p>
                  <p className="text-xs text-slate-500">{item.count} müşteri</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(parseInt(item.value.replace(/,/g, '')))}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Satış Hedefleri */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Satış Hedefleri</h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Aylık Hedef</span>
                <span className="text-sm font-semibold text-slate-900">87%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: '87%' }} />
              </div>
              <p className="text-xs text-slate-500 mt-1">₺2,175,000 / ₺2,500,000</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Çeyreklik Hedef</span>
                <span className="text-sm font-semibold text-slate-900">92%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: '92%' }} />
              </div>
              <p className="text-xs text-slate-500 mt-1">₺6,900,000 / ₺7,500,000</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Yıllık Hedef</span>
                <span className="text-sm font-semibold text-slate-900">78%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full" style={{ width: '78%' }} />
              </div>
              <p className="text-xs text-slate-500 mt-1">₺22,260,000 / ₺28,500,000</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}