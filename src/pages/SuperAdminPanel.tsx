/**
 * Süper Admin - Tüm Firmaları Yönetim Paneli
 * Multi-tenant SaaS altyapısı için ana kontrol paneli
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  CreditCard,
  Settings,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Package,
  Bell,
  ChevronRight,
  Filter,
  RefreshCw,
  Shield,
  Key,
  BarChart3,
  Activity,
  Clock,
  Globe,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { formatDate, formatCurrency, cn } from '@/lib/utils';

// Firma durumu
type FirmStatus = 'active' | 'suspended' | 'pending' | 'trial';

// Modül tipleri
type ModuleType =
  | 'crm'
  | 'inventory'
  | 'project'
  | 'hr'
  | 'accounting'
  | 'sales'
  | 'pos'
  | 'banking'
  | 'calendar'
  | 'webhooks'
  | 'api';

// Abonelik planları
type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';

// Mock firmalar verisi
const mockFirms = [
  {
    id: 'firm_001',
    name: 'ABC Ticaret A.Ş.',
    email: 'info@abcticaret.com',
    phone: '+90 212 555 1234',
    status: 'active' as FirmStatus,
    plan: 'enterprise' as SubscriptionPlan,
    modules: ['crm', 'inventory', 'project', 'hr', 'accounting', 'sales', 'pos', 'banking', 'calendar', 'webhooks', 'api'] as ModuleType[],
    userCount: 45,
    maxUsers: 100,
    storage: 25,
    maxStorage: 100,
    monthlyPrice: 2999,
    trialEnds: null,
    createdAt: '2023-06-15',
    lastActive: '2024-05-19 14:30',
  },
  {
    id: 'firm_002',
    name: 'XYZ Holding',
    email: 'contact@xyzholding.com',
    phone: '+90 312 555 9876',
    status: 'active' as FirmStatus,
    plan: 'professional' as SubscriptionPlan,
    modules: ['crm', 'inventory', 'project', 'hr', 'accounting', 'sales'] as ModuleType[],
    userCount: 28,
    maxUsers: 50,
    storage: 12,
    maxStorage: 50,
    monthlyPrice: 1499,
    trialEnds: null,
    createdAt: '2023-09-22',
    lastActive: '2024-05-19 12:15',
  },
  {
    id: 'firm_003',
    name: 'DEF Lojistik',
    email: 'info@deflojistik.com',
    phone: '+90 232 555 4567',
    status: 'trial' as FirmStatus,
    plan: 'professional' as SubscriptionPlan,
    modules: ['crm', 'inventory', 'sales'] as ModuleType[],
    userCount: 8,
    maxUsers: 50,
    storage: 3,
    maxStorage: 50,
    monthlyPrice: 1499,
    trialEnds: '2024-06-05',
    createdAt: '2024-05-05',
    lastActive: '2024-05-19 10:00',
  },
  {
    id: 'firm_004',
    name: 'GHI Teknoloji',
    email: 'destek@ghi.com',
    phone: '+90 216 555 7890',
    status: 'suspended' as FirmStatus,
    plan: 'starter' as SubscriptionPlan,
    modules: ['crm', 'inventory'] as ModuleType[],
    userCount: 5,
    maxUsers: 10,
    storage: 2,
    maxStorage: 10,
    monthlyPrice: 499,
    trialEnds: null,
    createdAt: '2024-01-10',
    lastActive: '2024-04-15 08:30',
  },
  {
    id: 'firm_005',
    name: 'JKL Pazarlama',
    email: 'info@jklpazarlama.com',
    phone: '+90 224 555 3210',
    status: 'pending' as FirmStatus,
    plan: 'starter' as SubscriptionPlan,
    modules: ['crm', 'sales'] as ModuleType[],
    userCount: 0,
    maxUsers: 10,
    storage: 0,
    maxStorage: 10,
    monthlyPrice: 499,
    trialEnds: null,
    createdAt: '2024-05-18',
    lastActive: null,
  },
];

// Tüm mevcut modüller
const allModules: { id: ModuleType; name: string; description: string; price: number }[] = [
  { id: 'crm', name: 'CRM', description: 'Müşteri ilişkileri yönetimi', price: 299 },
  { id: 'inventory', name: 'Stok Yönetimi', description: 'Ürün ve stok takibi', price: 199 },
  { id: 'project', name: 'Proje Yönetimi', description: 'Proje ve görev takibi', price: 249 },
  { id: 'hr', name: 'İK Yönetimi', description: 'İnsan kaynakları modülü', price: 199 },
  { id: 'accounting', name: 'Muhasebe', description: 'Finansal işlemler ve raporlama', price: 299 },
  { id: 'sales', name: 'Satış', description: 'Sipariş ve teklif yönetimi', price: 199 },
  { id: 'pos', name: 'POS', description: 'Satış noktası entegrasyonu', price: 149 },
  { id: 'banking', name: 'Banka', description: 'Banka ve ödeme entegrasyonları', price: 149 },
  { id: 'calendar', name: 'Takvim', description: 'Randevu ve etkinlik yönetimi', price: 99 },
  { id: 'webhooks', name: 'Webhooks', description: 'Otomatik tetikleyiciler', price: 99 },
  { id: 'api', name: 'API Erişimi', description: 'REST API erişimi', price: 199 },
];

// Plan özellikleri
const planFeatures = {
  starter: { name: 'Başlangıç', maxUsers: 10, maxStorage: 10, basePrice: 499 },
  professional: { name: 'Profesyonel', maxUsers: 50, maxStorage: 50, basePrice: 1499 },
  enterprise: { name: 'Kurumsal', maxUsers: -1, maxStorage: 100, basePrice: 2999 },
};

// İstatistikler
const statistics = {
  totalFirms: mockFirms.length,
  activeFirms: mockFirms.filter(f => f.status === 'active').length,
  trialFirms: mockFirms.filter(f => f.status === 'trial').length,
  monthlyRevenue: mockFirms.filter(f => f.status === 'active').reduce((acc, f) => acc + f.monthlyPrice, 0),
  totalUsers: mockFirms.reduce((acc, f) => acc + f.userCount, 0),
};

export default function SuperAdminPanel() {
  const [firms, setFirms] = useState(mockFirms);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | FirmStatus>('all');
  const [filterPlan, setFilterPlan] = useState<'all' | SubscriptionPlan>('all');
  const [selectedFirm, setSelectedFirm] = useState<typeof mockFirms[0] | null>(null);
  const [showNewFirm, setShowNewFirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'firms' | 'modules' | 'subscriptions' | 'settings'>('overview');

  const filteredFirms = firms.filter(firm => {
    if (filterStatus !== 'all' && firm.status !== filterStatus) return false;
    if (filterPlan !== 'all' && firm.plan !== filterPlan) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return firm.name.toLowerCase().includes(query) || firm.email.toLowerCase().includes(query);
    }
    return true;
  });

  const getStatusBadge = (status: FirmStatus) => {
    const badges = {
      active: { label: 'Aktif', className: 'bg-emerald-100 text-emerald-700' },
      suspended: { label: 'Askıya Alındı', className: 'bg-red-100 text-red-700' },
      pending: { label: 'Bekliyor', className: 'bg-amber-100 text-amber-700' },
      trial: { label: 'Deneme', className: 'bg-blue-100 text-blue-700' },
    };
    return badges[status];
  };

  const getPlanBadge = (plan: SubscriptionPlan) => {
    const badges = {
      starter: { label: 'Başlangıç', className: 'bg-slate-100 text-slate-700' },
      professional: { label: 'Profesyonel', className: 'bg-indigo-100 text-indigo-700' },
      enterprise: { label: 'Kurumsal', className: 'bg-violet-100 text-violet-700' },
    };
    return badges[plan];
  };

  const toggleFirmStatus = (firmId: string) => {
    setFirms(firms.map(f => {
      if (f.id !== firmId) return f;
      return { ...f, status: f.status === 'active' ? 'suspended' : 'active' };
    }));
  };

  const toggleModule = (firmId: string, moduleId: ModuleType) => {
    setFirms(firms.map(f => {
      if (f.id !== firmId) return f;
      const hasModule = f.modules.includes(moduleId);
      return {
        ...f,
        modules: hasModule
          ? f.modules.filter(m => m !== moduleId)
          : [...f.modules, moduleId]
      };
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Süper Admin Panel</h1>
                <p className="text-sm text-slate-500">Çoklu Kiracı ERP Yönetim Sistemi</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 transition-all">
                <Plus className="w-4 h-4" />
                Yeni Firma Ekle
              </button>
              <div className="flex items-center gap-2">
                <Badge variant="primary" className="bg-teal-100 text-teal-700">
                  <Activity className="w-3 h-3 mr-1" />
                  Süper Admin
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 flex gap-6 border-t border-slate-100">
          {[
            { id: 'overview', label: 'Genel Bakış', icon: BarChart3 },
            { id: 'firms', label: 'Firmalar', icon: Building2 },
            { id: 'modules', label: 'Modüller', icon: Package },
            { id: 'subscriptions', label: 'Abonelikler', icon: CreditCard },
            { id: 'settings', label: 'Ayarlar', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-all',
                  activeTab === tab.id
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Toplam Firma</p>
                    <p className="text-3xl font-bold text-white mt-1">{statistics.totalFirms}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-white/50" />
                </div>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 border-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Aktif Firma</p>
                    <p className="text-3xl font-bold text-white mt-1">{statistics.activeFirms}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-white/50" />
                </div>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500 to-orange-600 border-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">Deneme (Trial)</p>
                    <p className="text-3xl font-bold text-white mt-1">{statistics.trialFirms}</p>
                  </div>
                  <Clock className="w-8 h-8 text-white/50" />
                </div>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-violet-600 border-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Toplam Kullanıcı</p>
                    <p className="text-3xl font-bold text-white mt-1">{statistics.totalUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-white/50" />
                </div>
              </Card>
              <Card className="bg-gradient-to-br from-rose-500 to-pink-600 border-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-rose-100 text-sm font-medium">Aylık Gelir</p>
                    <p className="text-3xl font-bold text-white mt-1">{formatCurrency(statistics.monthlyRevenue)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-white/50" />
                </div>
              </Card>
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Firms */}
              <Card className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Son Kayıtlar</h3>
                  <Link to="/super-admin/firms" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                    Tümünü Gör
                  </Link>
                </div>
                <div className="space-y-3">
                  {firms.slice(0, 5).map((firm) => {
                    const status = getStatusBadge(firm.status);
                    return (
                      <div
                        key={firm.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                        onClick={() => setSelectedFirm(firm)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                            {firm.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{firm.name}</p>
                            <p className="text-xs text-slate-500">{firm.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className={cn('text-xs', status.className)}>
                            {status.label}
                          </Badge>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Quick Actions */}
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Hızlı İşlemler</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                    <Plus className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Yeni Firma Ekle</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
                    <Package className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-slate-700">Modül Ekle/Düzenle</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-700">Faturalama Ayarları</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <Bell className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Sistem Bildirimleri</span>
                  </button>
                </div>
              </Card>
            </div>

            {/* Module Usage */}
            <Card>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Modül Kullanımı</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {allModules.map((module) => {
                  const usageCount = firms.filter(f => f.modules.includes(module.id)).length;
                  const usagePercent = Math.round((usageCount / statistics.totalFirms) * 100);
                  return (
                    <div key={module.id} className="p-4 bg-slate-50 rounded-xl text-center">
                      <div className="text-2xl font-bold text-slate-900">{usageCount}</div>
                      <div className="text-sm text-slate-500">{module.name}</div>
                      <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full"
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'firms' && (
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Firma ara..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as 'all' | FirmStatus)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="active">Aktif</option>
                    <option value="trial">Deneme</option>
                    <option value="pending">Bekliyor</option>
                    <option value="suspended">Askıda</option>
                  </select>
                  <select
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value as 'all' | SubscriptionPlan)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                  >
                    <option value="all">Tüm Planlar</option>
                    <option value="starter">Başlangıç</option>
                    <option value="professional">Profesyonel</option>
                    <option value="enterprise">Kurumsal</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Firms Table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Firma</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Plan</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Durum</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Kullanıcı</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Modüller</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Aylık Ücret</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFirms.map((firm) => {
                      const status = getStatusBadge(firm.status);
                      const plan = getPlanBadge(firm.plan);
                      return (
                        <tr key={firm.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                                {firm.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{firm.name}</p>
                                <p className="text-xs text-slate-500">{firm.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="default" className={cn('text-xs', plan.className)}>
                              {plan.label}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="default" className={cn('text-xs', status.className)}>
                              {status.label}
                            </Badge>
                            {firm.trialEnds && (
                              <p className="text-xs text-slate-500 mt-1">
                                Deneme: {formatDate(new Date(firm.trialEnds), 'short')}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-slate-900">{firm.userCount}/{firm.maxUsers}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1">
                              {firm.modules.slice(0, 3).map((mod) => (
                                <span key={mod} className="px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                                  {mod}
                                </span>
                              ))}
                              {firm.modules.length > 3 && (
                                <span className="px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                                  +{firm.modules.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm font-semibold text-slate-900">
                              {formatCurrency(firm.monthlyPrice)}
                            </span>
                            <span className="text-xs text-slate-500">/ay</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setSelectedFirm(firm)}
                                className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Görüntüle"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleFirmStatus(firm.id)}
                                className={cn(
                                  'p-2 rounded-lg transition-colors',
                                  firm.status === 'active'
                                    ? 'text-amber-600 hover:bg-amber-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                )}
                                title={firm.status === 'active' ? 'Askıya Al' : 'Aktifleştir'}
                              >
                                {firm.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                              </button>
                              <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="Düzenle">
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Modül Yönetimi</h3>
                  <p className="text-sm text-slate-500">ERP sistem modüllerini tanımlayın ve fiyatlandırın</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 transition-all">
                  <Plus className="w-4 h-4" />
                  Yeni Modül Ekle
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allModules.map((module) => {
                  const usageCount = firms.filter(f => f.modules.includes(module.id)).length;
                  return (
                    <div key={module.id} className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900">{module.name}</h4>
                          <p className="text-xs text-slate-500">{module.description}</p>
                        </div>
                        <Badge variant="primary" className="bg-teal-100 text-teal-700">
                          {formatCurrency(module.price)}/ay
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">
                          {usageCount} firma kullanıyor
                        </span>
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 text-slate-400 hover:bg-white rounded transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Plan Cards */}
              {(Object.keys(planFeatures) as SubscriptionPlan[]).map((planKey) => {
                const plan = planFeatures[planKey];
                const firmsOnPlan = firms.filter(f => f.plan === planKey).length;
                return (
                  <Card key={planKey} className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                        <Badge variant="primary" className="bg-teal-100 text-teal-700">
                          {firmsOnPlan} firma
                        </Badge>
                      </div>
                      <div className="mb-6">
                        <span className="text-3xl font-bold text-slate-900">{formatCurrency(plan.basePrice)}</span>
                        <span className="text-slate-500">/ay</span>
                      </div>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {plan.maxUsers === -1 ? 'Sınırsız kullanıcı' : `${plan.maxUsers} kullanıcı`}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {plan.maxStorage} GB depolama
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Tüm modüller dahil
                        </div>
                      </div>
                      <button className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all">
                        Planı Düzenle
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Sistem Ayarları</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Globe className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Otomatik Domain</p>
                      <p className="text-xs text-slate-500">Her firma için otomatik subdomain oluştur</p>
                    </div>
                  </div>
                  <button className="w-12 h-6 bg-teal-500 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm" />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Key className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Trial Dönemi</p>
                      <p className="text-xs text-slate-500">Yeni firmalar için deneme süresi (gün)</p>
                    </div>
                  </div>
                  <input
                    type="number"
                    defaultValue={14}
                    className="w-20 px-3 py-2 rounded-xl border border-slate-200 text-center text-sm"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Varsayılan Para Birimi</p>
                      <p className="text-xs text-slate-500">TL, USD, EUR seçenekleri</p>
                    </div>
                  </div>
                  <select className="px-4 py-2 rounded-xl border border-slate-200 text-sm">
                    <option value="TRY">Türk Lirası (TRY)</option>
                    <option value="USD">Amerikan Doları (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Firm Detail Modal */}
      {selectedFirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                  {selectedFirm.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{selectedFirm.name}</h2>
                  <p className="text-sm text-slate-500">{selectedFirm.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFirm(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {/* Status & Plan */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Durum</p>
                  <Badge variant="default" className={cn('mt-1', getStatusBadge(selectedFirm.status).className)}>
                    {getStatusBadge(selectedFirm.status).label}
                  </Badge>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Plan</p>
                  <Badge variant="default" className={cn('mt-1', getPlanBadge(selectedFirm.plan).className)}>
                    {getPlanBadge(selectedFirm.plan).label}
                  </Badge>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Kullanıcı</p>
                  <p className="text-lg font-semibold text-slate-900">{selectedFirm.userCount}/{selectedFirm.maxUsers}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500">Depolama</p>
                  <p className="text-lg font-semibold text-slate-900">{selectedFirm.storage}/{selectedFirm.maxStorage} GB</p>
                </div>
              </div>

              {/* Modules */}
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Aktif Modüller</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {allModules.map((module) => {
                  const isActive = selectedFirm.modules.includes(module.id);
                  return (
                    <div
                      key={module.id}
                      onClick={() => toggleModule(selectedFirm.id, module.id)}
                      className={cn(
                        'p-3 rounded-xl border-2 cursor-pointer transition-all',
                        isActive
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{module.name}</p>
                          <p className="text-xs text-slate-500">{formatCurrency(module.price)}/ay</p>
                        </div>
                        {isActive && <CheckCircle2 className="w-5 h-5 text-teal-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => toggleFirmStatus(selectedFirm.id)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                    selectedFirm.status === 'active'
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  )}
                >
                  {selectedFirm.status === 'active' ? 'Askıya Al' : 'Aktifleştir'}
                </button>
                <button className="px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 transition-all">
                  Değişiklikleri Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}