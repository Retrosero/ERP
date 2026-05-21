/**
 * API Gateway
 * API endpointleri, yetkilendirme ve rate limiting
 */

import { useState, useEffect } from 'react';
import {
  Globe,
  Key,
  Shield,
  Activity,
  Settings,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Server,
  Code,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Zap,
  BarChart3,
  Search,
  Filter,
  ChevronRight,
  Terminal,
  Database,
  Cpu,
  Network,
  ShoppingCart,
  Package,
  FileText,
  DollarSign,
  Warehouse,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { formatDate, cn } from '@/lib/utils';

// API Method types
type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API Endpoint status
type EndpointStatus = 'active' | 'deprecated' | 'maintenance' | 'beta';

// API Endpoint interfaces
interface ApiEndpoint {
  id: number;
  path: string;
  method: ApiMethod;
  description: string;
  status: EndpointStatus;
  category: string;
  rateLimit: number;
  authenticated: boolean;
  lastUpdated: string;
  calls: number;
}

// API Key interfaces
interface ApiKey {
  id: number;
  name: string;
  key: string;
  permissions: string[];
  createdAt: string;
  lastUsed: string;
  status: 'active' | 'revoked';
}

// Mock API endpoints data
const mockEndpoints: ApiEndpoint[] = [
  {
    id: 1,
    path: '/api/v1/customers',
    method: 'GET',
    description: 'Müşteri listesi',
    status: 'active',
    category: 'CRM',
    rateLimit: 100,
    authenticated: true,
    lastUpdated: '2024-05-15',
    calls: 12458,
  },
  {
    id: 2,
    path: '/api/v1/customers/:id',
    method: 'GET',
    description: 'Müşteri detayı',
    status: 'active',
    category: 'CRM',
    rateLimit: 100,
    authenticated: true,
    lastUpdated: '2024-05-15',
    calls: 8756,
  },
  {
    id: 3,
    path: '/api/v1/orders',
    method: 'POST',
    description: 'Sipariş oluştur',
    status: 'active',
    category: 'Sipariş',
    rateLimit: 50,
    authenticated: true,
    lastUpdated: '2024-05-18',
    calls: 5623,
  },
  {
    id: 4,
    path: '/api/v1/products',
    method: 'GET',
    description: 'Ürün listesi',
    status: 'active',
    category: 'Ürün',
    rateLimit: 200,
    authenticated: false,
    lastUpdated: '2024-05-10',
    calls: 18234,
  },
  {
    id: 5,
    path: '/api/v1/invoices',
    method: 'POST',
    description: 'Fatura oluştur',
    status: 'beta',
    category: 'Fatura',
    rateLimit: 30,
    authenticated: true,
    lastUpdated: '2024-05-19',
    calls: 1245,
  },
  {
    id: 6,
    path: '/api/v1/payments',
    method: 'POST',
    description: 'Ödeme işle',
    status: 'active',
    category: 'Ödeme',
    rateLimit: 20,
    authenticated: true,
    lastUpdated: '2024-05-17',
    calls: 3456,
  },
  {
    id: 7,
    path: '/api/v1/stock',
    method: 'GET',
    description: 'Stok bilgisi',
    status: 'deprecated',
    category: 'Stok',
    rateLimit: 100,
    authenticated: true,
    lastUpdated: '2024-03-01',
    calls: 23456,
  },
  {
    id: 8,
    path: '/api/v1/reports',
    method: 'GET',
    description: 'Rapor oluştur',
    status: 'maintenance',
    category: 'Rapor',
    rateLimit: 10,
    authenticated: true,
    lastUpdated: '2024-05-20',
    calls: 567,
  },
];

// Mock API keys data
const mockApiKeys: ApiKey[] = [
  {
    id: 1,
    name: 'Üretim API Anahtarı',
    key: 'dol_api_prod_a1b2c3d4e5f6g7h8',
    permissions: ['read', 'write', 'delete'],
    createdAt: '2024-01-15',
    lastUsed: '2024-05-19 14:30',
    status: 'active',
  },
  {
    id: 2,
    name: 'Test API Anahtarı',
    key: 'dol_api_test_x9y8z7w6v5u4t3s2',
    permissions: ['read'],
    createdAt: '2024-03-20',
    lastUsed: '2024-05-18 09:15',
    status: 'active',
  },
  {
    id: 3,
    name: 'Mobil Uygulama',
    key: 'dol_api_mobile_m1n2o3p4q5r6s7t8',
    permissions: ['read', 'write'],
    createdAt: '2024-04-10',
    lastUsed: '2024-05-19 12:45',
    status: 'active',
  },
];

// API categories
const apiCategories = [
  { name: 'CRM', count: 24, icon: Database },
  { name: 'Sipariş', count: 18, icon: ShoppingCart },
  { name: 'Ürün', count: 32, icon: Package },
  { name: 'Fatura', count: 15, icon: FileText },
  { name: 'Ödeme', count: 12, icon: DollarSign },
  { name: 'Stok', count: 20, icon: Warehouse },
];

// Method colors
const methodColors: Record<ApiMethod, string> = {
  GET: 'bg-emerald-100 text-emerald-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-amber-100 text-amber-700',
  PATCH: 'bg-purple-100 text-purple-700',
  DELETE: 'bg-red-100 text-red-700',
};

// Status colors
const statusColors = {
  active: 'bg-emerald-100 text-emerald-700',
  deprecated: 'bg-slate-100 text-slate-700',
  maintenance: 'bg-amber-100 text-amber-700',
  beta: 'bg-blue-100 text-blue-700',
};

// Sample request/response
const sampleRequest = {
  method: 'GET',
  endpoint: '/api/v1/customers',
  headers: {
    'Authorization': 'Bearer dol_api_prod_a1b2c3d4e5f6g7h8',
    'Content-Type': 'application/json',
  },
};

const sampleResponse = {
  status: 200,
  headers: {
    'Content-Type': 'application/json',
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': '95',
  },
  body: {
    data: [
      { id: 1, name: 'ABC Ticaret', email: 'info@abcticaret.com', phone: '+90 212 555 1234' },
      { id: 2, name: 'XYZ Ltd.', email: 'contact@xyzltd.com', phone: '+90 312 555 5678' },
    ],
    meta: { total: 2, page: 1, per_page: 20 },
  },
};

export default function APIGateway() {
  const [endpoints] = useState(mockEndpoints);
  const [apiKeys, setApiKeys] = useState(mockApiKeys);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showKey, setShowKey] = useState<number | null>(null);

  const filteredEndpoints = endpoints.filter(ep => {
    if (filterCategory !== 'all' && ep.category !== filterCategory) return false;
    if (filterMethod !== 'all' && ep.method !== filterMethod) return false;
    if (searchQuery && !ep.path.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const revokeKey = (id: number) => {
    setApiKeys(apiKeys.map(k =>
      k.id === id ? { ...k, status: 'revoked' as const } : k
    ));
  };

  const getStatusLabel = (status: EndpointStatus) => {
    const labels = {
      active: 'Aktif',
      deprecated: 'Kullanımdışı',
      maintenance: 'Bakımda',
      beta: 'Beta',
    };
    return labels[status];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">API Gateway</h1>
          <p className="text-slate-500 mt-1">
            API endpointleri ve erişim anahtarları yönetimi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all">
            <Activity className="w-4 h-4" />
            API İstatistikleri
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 transition-all">
            <Key className="w-4 h-4" />
            Yeni API Anahtarı
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Toplam Endpoint</p>
              <p className="text-2xl font-bold text-slate-900">{endpoints.length}</p>
            </div>
          </div>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Aktif API</p>
              <p className="text-2xl font-bold text-slate-900">{endpoints.filter(e => e.status === 'active').length}</p>
            </div>
          </div>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Toplam Çağrı</p>
              <p className="text-2xl font-bold text-slate-900">
                {endpoints.reduce((acc, e) => acc + e.calls, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Ortalama Süre</p>
              <p className="text-2xl font-bold text-slate-900">245ms</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Endpoints List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filters */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Endpoint ara..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                >
                  <option value="all">Tüm Kategoriler</option>
                  <option value="CRM">CRM</option>
                  <option value="Sipariş">Sipariş</option>
                  <option value="Ürün">Ürün</option>
                  <option value="Fatura">Fatura</option>
                  <option value="Ödeme">Ödeme</option>
                  <option value="Stok">Stok</option>
                </select>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                >
                  <option value="all">Tüm Metodlar</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Endpoints Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Endpoint</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Metod</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Durum</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Rate Limit</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Çağrılar</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEndpoints.map((endpoint) => (
                    <tr
                      key={endpoint.id}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedEndpoint(endpoint)}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {endpoint.authenticated ? (
                            <Lock className="w-4 h-4 text-teal-600" />
                          ) : (
                            <Unlock className="w-4 h-4 text-slate-400" />
                          )}
                          <div>
                            <p className="text-sm font-mono font-medium text-slate-900">{endpoint.path}</p>
                            <p className="text-xs text-slate-500">{endpoint.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="default" className={cn('text-xs font-bold', methodColors[endpoint.method])}>
                          {endpoint.method}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="default" className={cn('text-xs', statusColors[endpoint.status])}>
                          {getStatusLabel(endpoint.status)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {endpoint.rateLimit}/dk
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {endpoint.calls.toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="Düzenle">
                            <Settings className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="Kopyala">
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* API Keys */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">API Anahtarları</h3>
              <Badge variant="primary">{apiKeys.filter(k => k.status === 'active').length}</Badge>
            </div>
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900">{key.name}</span>
                    <Badge
                      variant={key.status === 'active' ? 'success' : 'danger'}
                      className="text-xs"
                    >
                      {key.status === 'active' ? 'Aktif' : 'İptal'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono text-slate-600 bg-white px-2 py-1 rounded truncate">
                      {showKey === key.id ? key.key : '•'.repeat(24) + key.key.slice(-4)}
                    </code>
                    <button
                      onClick={() => setShowKey(showKey === key.id ? null : key.id)}
                      className="p-1 text-slate-400 hover:bg-white rounded transition-colors"
                    >
                      {showKey === key.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(key.key)}
                      className="p-1 text-slate-400 hover:bg-white rounded transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    <span>Son: {key.lastUsed}</span>
                    {key.status === 'active' && (
                      <button
                        onClick={() => revokeKey(key.id)}
                        className="text-red-500 hover:underline ml-auto"
                      >
                        İptal
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Categories */}
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Kategoriler</h3>
            <div className="space-y-2">
              {apiCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={cat.name}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setFilterCategory(cat.name)}
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm text-slate-700">{cat.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">{cat.count}</span>
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
                <Terminal className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">API Tester</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <Code className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Dokümantasyon</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <Activity className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Rate Limit Ayarları</span>
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Sample Request/Response */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sample Request */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Örnek İstek</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors">
              <Copy className="w-4 h-4" />
              curl
            </button>
          </div>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto text-sm font-mono">
            <div className="text-emerald-400">{sampleRequest.method} {sampleRequest.endpoint}</div>
            <div className="mt-2 text-slate-400">
              <div>Authorization: Bearer {'{API_KEY}'}</div>
              <div>Content-Type: application/json</div>
            </div>
          </pre>
        </Card>

        {/* Sample Response */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Örnek Yanıt</h3>
            <Badge variant="success" className="bg-emerald-100 text-emerald-700">
              200 OK
            </Badge>
          </div>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto text-sm font-mono">
            <div className="text-slate-400">X-RateLimit-Remaining: 95</div>
            <div className="text-slate-400">Content-Type: application/json</div>
            <div className="mt-2">{JSON.stringify(sampleResponse.body, null, 2)}</div>
          </pre>
        </Card>
      </div>

      {/* Endpoint Detail */}
      {selectedEndpoint && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Badge variant="default" className={cn('text-sm font-bold', methodColors[selectedEndpoint.method])}>
                {selectedEndpoint.method}
              </Badge>
              <code className="text-lg font-mono font-semibold text-slate-900">{selectedEndpoint.path}</code>
            </div>
            <button
              onClick={() => setSelectedEndpoint(null)}
              className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-600 mb-4">{selectedEndpoint.description}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500">Kategori</p>
              <p className="text-lg font-semibold text-slate-900">{selectedEndpoint.category}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500">Rate Limit</p>
              <p className="text-lg font-semibold text-slate-900">{selectedEndpoint.rateLimit}/dk</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500">Toplam Çağrı</p>
              <p className="text-lg font-semibold text-slate-900">{selectedEndpoint.calls.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500">Yetkilendirme</p>
              <p className="text-lg font-semibold text-slate-900">
                {selectedEndpoint.authenticated ? 'Gerekli' : 'Opsiyonel'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}