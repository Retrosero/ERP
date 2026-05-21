/**
 * Webhooks Yönetimi
 * Webhook endpointleri, olaylar ve tetikleyiciler
 */

import { useState, useEffect } from 'react';
import {
  Webhook,
  Plus,
  Settings,
  Trash2,
  Copy,
  Check,
  MoreVertical,
  RefreshCw,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Link as LinkIcon,
  Server,
  Code,
  Eye,
  EyeOff,
  Play,
  Pause,
  Send,
  ChevronRight,
  Zap,
  Bell,
  Package,
  ShoppingCart,
  Users,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { formatDate, cn } from '@/lib/utils';

// Webhook event types
type WebhookEvent =
  | 'order.created'
  | 'order.updated'
  | 'order.cancelled'
  | 'payment.received'
  | 'payment.failed'
  | 'customer.created'
  | 'customer.updated'
  | 'product.stock_low'
  | 'invoice.sent'
  | 'invoice.paid';

// Webhook status
type WebhookStatus = 'active' | 'paused' | 'failed' | 'pending';

// Mock webhooks data
const mockWebhooks = [
  {
    id: 1,
    name: 'Sipariş Bildirimi',
    url: 'https://api.example.com/webhooks/orders',
    secret: 'whsec_abc123def456',
    events: ['order.created', 'order.updated', 'order.cancelled'] as WebhookEvent[],
    status: 'active' as WebhookStatus,
    createdAt: '2024-05-01',
    lastTriggered: '2024-05-19 14:30',
    successRate: 98.5,
    totalCalls: 1247,
    isSecretVisible: false,
  },
  {
    id: 2,
    name: 'Ödeme Bildirimi',
    url: 'https://api.payment-gateway.com/webhook',
    secret: 'whsec_xyz789ghi012',
    events: ['payment.received', 'payment.failed'] as WebhookEvent[],
    status: 'active' as WebhookStatus,
    createdAt: '2024-04-15',
    lastTriggered: '2024-05-19 12:15',
    successRate: 100,
    totalCalls: 856,
    isSecretVisible: false,
  },
  {
    id: 3,
    name: 'Stok Uyarısı',
    url: 'https://slack.com/api/webhook/incoming',
    secret: 'whsec_mno345pqr678',
    events: ['product.stock_low'] as WebhookEvent[],
    status: 'paused' as WebhookStatus,
    createdAt: '2024-03-20',
    lastTriggered: '2024-05-10 09:45',
    successRate: 92.3,
    totalCalls: 45,
    isSecretVisible: false,
  },
  {
    id: 4,
    name: 'Müşteri Senkronizasyonu',
    url: 'https://crm.example.com/sync',
    secret: 'whsec_stu901vwx234',
    events: ['customer.created', 'customer.updated'] as WebhookEvent[],
    status: 'failed' as WebhookStatus,
    createdAt: '2024-05-05',
    lastTriggered: '2024-05-19 08:00',
    successRate: 45.2,
    totalCalls: 234,
    isSecretVisible: false,
  },
];

// Event types with icons
const eventTypes = [
  { value: 'order.created', label: 'Sipariş Oluşturuldu', icon: ShoppingCart, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { value: 'order.updated', label: 'Sipariş Güncellendi', icon: Package, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  { value: 'order.cancelled', label: 'Sipariş İptal Edildi', icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
  { value: 'payment.received', label: 'Ödeme Alındı', icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  { value: 'payment.failed', label: 'Ödeme Başarısız', icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
  { value: 'customer.created', label: 'Müşteri Oluşturuldu', icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { value: 'customer.updated', label: 'Müşteri Güncellendi', icon: Users, color: 'text-violet-600', bgColor: 'bg-violet-100' },
  { value: 'product.stock_low', label: 'Stok Azaldı', icon: Package, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  { value: 'invoice.sent', label: 'Fatura Gönderildi', icon: FileText, color: 'text-teal-600', bgColor: 'bg-teal-100' },
  { value: 'invoice.paid', label: 'Fatura Ödendi', icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
];

// Mock recent deliveries
const recentDeliveries = [
  { id: 1, webhook: 'Sipariş Bildirimi', event: 'order.created', status: 'success', timestamp: '2024-05-19 14:30:22', duration: '245ms' },
  { id: 2, webhook: 'Ödeme Bildirimi', event: 'payment.received', status: 'success', timestamp: '2024-05-19 14:28:15', duration: '189ms' },
  { id: 3, webhook: 'Müşteri Senkronizasyonu', event: 'customer.updated', status: 'failed', timestamp: '2024-05-19 14:25:00', duration: '5000ms' },
  { id: 4, webhook: 'Sipariş Bildirimi', event: 'order.updated', status: 'success', timestamp: '2024-05-19 14:20:45', duration: '312ms' },
  { id: 5, webhook: 'Stok Uyarısı', event: 'product.stock_low', status: 'pending', timestamp: '2024-05-19 14:15:30', duration: '-' },
];

// Sample payload
const samplePayload = {
  id: 'evt_1234567890',
  type: 'order.created',
  timestamp: '2024-05-19T14:30:22Z',
  data: {
    order_id: 'ORD-2024-001234',
    customer: {
      id: 'cust_abc123',
      name: 'ABC Ticaret Ltd.',
      email: 'info@abcticaret.com',
    },
    items: [
      { product_id: 'prod_001', name: 'Ürün A', quantity: 5, price: 150 },
      { product_id: 'prod_002', name: 'Ürün B', quantity: 3, price: 200 },
    ],
    total: 1350,
    currency: 'TRY',
  },
};

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState(mockWebhooks);
  const [showNewWebhook, setShowNewWebhook] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<typeof mockWebhooks[0] | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | WebhookStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWebhooks = webhooks.filter(webhook => {
    if (filterStatus !== 'all' && webhook.status !== filterStatus) return false;
    if (searchQuery && !webhook.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleSecret = (id: number) => {
    setWebhooks(webhooks.map(w =>
      w.id === id ? { ...w, isSecretVisible: !w.isSecretVisible } : w
    ));
  };

  const toggleWebhookStatus = (id: number) => {
    setWebhooks(webhooks.map(w => {
      if (w.id !== id) return w;
      return { ...w, status: w.status === 'active' ? 'paused' : 'active' };
    }));
  };

  const deleteWebhook = (id: number) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
  };

  const getStatusBadge = (status: WebhookStatus) => {
    const badges = {
      active: { label: 'Aktif', variant: 'success' as const, className: 'bg-emerald-100 text-emerald-700' },
      paused: { label: 'Duraklatıldı', variant: 'warning' as const, className: 'bg-amber-100 text-amber-700' },
      failed: { label: 'Başarısız', variant: 'danger' as const, className: 'bg-red-100 text-red-700' },
      pending: { label: 'Bekliyor', variant: 'info' as const, className: 'bg-blue-100 text-blue-700' },
    };
    return badges[status];
  };

  const getEventIcon = (event: WebhookEvent) => {
    const found = eventTypes.find(e => e.value === event);
    return found ? found.icon : Webhook;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Webhooks</h1>
          <p className="text-slate-500 mt-1">
            Webhook endpointleri ve olay tetikleyicileri yönetimi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all">
            <Activity className="w-4 h-4" />
            Test Gönder
          </button>
          <button
            onClick={() => setShowNewWebhook(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 transition-all"
          >
            <Plus className="w-4 h-4" />
            Yeni Webhook
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setFilterStatus('all')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Webhook className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Toplam Webhook</p>
              <p className="text-2xl font-bold text-slate-900">{webhooks.length}</p>
            </div>
          </div>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setFilterStatus('active')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Aktif</p>
              <p className="text-2xl font-bold text-slate-900">{webhooks.filter(w => w.status === 'active').length}</p>
            </div>
          </div>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setFilterStatus('failed')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Başarısız</p>
              <p className="text-2xl font-bold text-slate-900">{webhooks.filter(w => w.status === 'failed').length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Başarı Oranı</p>
              <p className="text-2xl font-bold text-slate-900">
                {Math.round(webhooks.reduce((acc, w) => acc + w.successRate, 0) / webhooks.length)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Webhooks List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filters */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1">
                <Webhook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Webhook ara..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | WebhookStatus)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="active">Aktif</option>
                  <option value="paused">Duraklatıldı</option>
                  <option value="failed">Başarısız</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Webhooks Cards */}
          <div className="space-y-4">
            {filteredWebhooks.map((webhook) => {
              const status = getStatusBadge(webhook.status);
              return (
                <Card
                  key={webhook.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-lg',
                    webhook.status === 'failed' && 'border-l-4 border-l-red-500',
                    webhook.status === 'paused' && 'border-l-4 border-l-amber-500',
                    selectedWebhook?.id === webhook.id && 'ring-2 ring-teal-500'
                  )}
                  onClick={() => setSelectedWebhook(webhook)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                        <Webhook className="w-6 h-6 text-slate-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900">{webhook.name}</h4>
                          <Badge variant={status.variant} className={cn('text-xs', status.className)}>
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mb-2">{webhook.url}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <Bell className="w-3 h-3" />
                            {webhook.events.length} olay
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Son: {webhook.lastTriggered}
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            %{webhook.successRate} başarı
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleWebhookStatus(webhook.id); }}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          webhook.status === 'active'
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        )}
                        title={webhook.status === 'active' ? 'Duraklat' : 'Aktifleştir'}
                      >
                        {webhook.status === 'active' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteWebhook(webhook.id); }}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Types */}
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Olay Türleri</h3>
            <div className="space-y-2">
              {eventTypes.map((event) => {
                const Icon = event.icon;
                return (
                  <div
                    key={event.value}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', event.bgColor)}>
                      <Icon className={cn('w-4 h-4', event.color)} />
                    </div>
                    <span className="text-sm text-slate-700">{event.label}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Quick Links */}
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Hızlı Bağlantılar</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <Code className="w-5 h-5 text-slate-600" />
                <span className="text-sm text-slate-700">API Dokümantasyonu</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <Server className="w-5 h-5 text-slate-600" />
                <span className="text-sm text-slate-700">Sunucu Durumu</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <Activity className="w-5 h-5 text-slate-600" />
                <span className="text-sm text-slate-700">Delivery Logs</span>
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Deliveries */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Son Teslimatlar</h3>
          <Badge variant="primary">{recentDeliveries.length}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Webhook</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Olay</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Durum</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Zaman</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Süre</th>
              </tr>
            </thead>
            <tbody>
              {recentDeliveries.map((delivery) => (
                <tr key={delivery.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-slate-900">{delivery.webhook}</span>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant="default" className="bg-slate-100 text-slate-600 text-xs">
                      {delivery.event}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    {delivery.status === 'success' ? (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm">Başarılı</span>
                      </div>
                    ) : delivery.status === 'failed' ? (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Başarısız</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Bekliyor</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600">
                    {delivery.timestamp}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600">
                    {delivery.duration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payload Preview */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Örnek Payload</h3>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors">
            <Copy className="w-4 h-4" />
            Kopyala
          </button>
        </div>
        <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto text-sm font-mono">
          {JSON.stringify(samplePayload, null, 2)}
        </pre>
      </Card>
    </div>
  );
}