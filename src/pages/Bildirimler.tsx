import { useState, useEffect, useCallback } from 'react';
import {
  Bell, Mail, MessageSquare, Phone, Settings, Plus, Edit2, Trash2,
  Send, CheckCircle, AlertCircle, Clock, Loader2, ToggleLeft, ToggleRight
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, Button, Input, Select,
  Badge, Table, Alert, Modal
} from '@/components/ui';
import { formatDate, cn } from '@/lib/utils';
import type { ThirdParty, Order } from '@/lib/types/dolibarr';
import { thirdPartyApi, orderApi } from '@/lib/dolibarr';

// Notification types
type NotificationType = 'email' | 'sms' | 'whatsapp' | 'push';
type NotificationTrigger = 'order_created' | 'order_status' | 'invoice_created' | 'payment_received' | 'low_stock' | 'custom';
type NotificationStatus = 'active' | 'paused';

interface NotificationTemplate {
  id: number;
  name: string;
  type: NotificationType;
  trigger: NotificationTrigger;
  subject?: string;
  message: string;
  recipients: string[]; // customer IDs or groups
  isActive: boolean;
  lastSent?: string;
  sentCount: number;
}

interface NotificationLog {
  id: number;
  type: NotificationType;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt: string;
  error?: string;
}

const notificationTypeLabels: Record<NotificationType, string> = {
  email: 'E-posta',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  push: 'Push Bildirimi',
};

const triggerLabels: Record<NotificationTrigger, string> = {
  order_created: 'Sipariş Oluşturulduğunda',
  order_status: 'Sipariş Durumu Değiştiğinde',
  invoice_created: 'Fatura Oluşturulduğunda',
  payment_received: 'Ödeme Alındığında',
  low_stock: 'Düşük Stok Uyarısı',
  custom: 'Özel Bildirim',
};

export default function Bildirimler() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [customers, setCustomers] = useState<ThirdParty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'templates' | 'logs'>('templates');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'email' as NotificationType,
    trigger: 'custom' as NotificationTrigger,
    subject: '',
    message: '',
    recipients: [] as string[],
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const customerData = await thirdPartyApi.list({ limit: 100 });
      setCustomers(customerData);

      // Mock templates
      const mockTemplates: NotificationTemplate[] = [
        {
          id: 1,
          name: 'Sipariş Onayı',
          type: 'email',
          trigger: 'order_created',
          subject: 'Siparişiniz Alındı - {{order_ref}}',
          message: 'Sayın {{customer_name}},\n\nSiparişiniz başarıyla alındı.\n\nSipariş No: {{order_ref}}\nTutar: {{order_total}}\n\nTeşekkürler.',
          recipients: [],
          isActive: true,
          lastSent: '2025-01-18',
          sentCount: 45,
        },
        {
          id: 2,
          name: 'Ödeme Hatırlatması',
          type: 'sms',
          trigger: 'custom',
          subject: '',
          message: 'Sayın {{customer_name}}, {{invoice_ref}} numaralı faturanız için {{due_date}} tarihine kadar {{amount}} TL ödeme yapmanız gerekmektedir.',
          recipients: [],
          isActive: true,
          lastSent: '2025-01-15',
          sentCount: 12,
        },
        {
          id: 3,
          name: 'Stok Uyarısı',
          type: 'push',
          trigger: 'low_stock',
          subject: '',
          message: '{{product_name}} ürününün stoğu kritik seviyede ({{stock}} adet kaldı).',
          recipients: [],
          isActive: false,
          sentCount: 8,
        },
      ];

      // Mock logs
      const mockLogs: NotificationLog[] = [
        { id: 1, type: 'email', recipient: 'musteri@ornek.com', subject: 'Siparişiniz Alındı', status: 'sent', sentAt: '2025-01-18 14:30' },
        { id: 2, type: 'sms', recipient: '0532 123 4567', subject: '', status: 'sent', sentAt: '2025-01-18 10:15' },
        { id: 3, type: 'email', recipient: 'firma@ornek.com', subject: 'Faturanız Hazır', status: 'failed', sentAt: '2025-01-17 16:45', error: 'Geçersiz e-posta adresi' },
        { id: 4, type: 'whatsapp', recipient: '0532 987 6543', subject: '', status: 'pending', sentAt: '2025-01-19 09:00' },
      ];

      setTemplates(mockTemplates);
      setNotificationLogs(mockLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veriler yüklenirken hata oluştu');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      type: 'email',
      trigger: 'custom',
      subject: '',
      message: '',
      recipients: [],
    });
    setShowModal(true);
  };

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      trigger: template.trigger,
      subject: template.subject || '',
      message: template.message,
      recipients: template.recipients,
    });
    setShowModal(true);
  };

  const handleDelete = (templateId: number) => {
    if (confirm('Bu bildirim şablonunu silmek istediğinizden emin misiniz?')) {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    }
  };

  const handleToggleActive = (templateId: number) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === templateId ? { ...t, isActive: !t.isActive } : t
      )
    );
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Lütfen şablon adı girin');
      return;
    }
    if (!formData.message.trim()) {
      alert('Lütfen mesaj içeriği girin');
      return;
    }

    const newTemplate: NotificationTemplate = {
      id: editingTemplate?.id || Date.now(),
      name: formData.name,
      type: formData.type,
      trigger: formData.trigger,
      subject: formData.subject || undefined,
      message: formData.message,
      recipients: formData.recipients,
      isActive: editingTemplate?.isActive ?? true,
      lastSent: editingTemplate?.lastSent,
      sentCount: editingTemplate?.sentCount ?? 0,
    };

    if (editingTemplate) {
      setTemplates((prev) => prev.map((t) => (t.id === editingTemplate.id ? newTemplate : t)));
    } else {
      setTemplates((prev) => [...prev, newTemplate]);
    }

    setShowModal(false);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="success">Aktif</Badge>
    ) : (
      <Badge variant="gray">Pasif</Badge>
    );
  };

  const getLogStatusBadge = (status: NotificationLog['status']) => {
    switch (status) {
      case 'sent':
        return <Badge variant="success">Gönderildi</Badge>;
      case 'failed':
        return <Badge variant="danger">Başarısız</Badge>;
      case 'pending':
        return <Badge variant="warning">Bekliyor</Badge>;
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
          <p className="text-gray-500">Bildirimler yükleniyor...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bildirimler</h1>
            <p className="text-sm text-gray-500 mt-1">
              E-posta, SMS ve push bildirimleri yönetin
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4" />
            Yeni Şablon
          </Button>
        </div>
      </div>

      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('templates')}
          className={cn(
            'pb-3 px-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'templates'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Şablonlar ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={cn(
            'pb-3 px-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'logs'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Gönderim Kayıtları ({notificationLogs.length})
        </button>
      </div>

      {activeTab === 'templates' ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Aktif Şablon</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {templates.filter((t) => t.isActive).length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">E-posta</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {templates.filter((t) => t.type === 'email').length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">SMS</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {templates.filter((t) => t.type === 'sms').length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Toplam Gönderim</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {templates.reduce((sum, t) => sum + t.sentCount, 0)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Send className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Templates Table */}
          <Card>
            <Table
              data={templates}
              columns={[
                {
                  key: 'name',
                  header: 'Şablon Adı',
                  render: (value, record) => {
                    const template = record as NotificationTemplate;
                    return (
                      <div>
                        <div className="font-medium text-gray-900">{value as string}</div>
                        <div className="text-sm text-gray-500">
                          {notificationTypeLabels[template.type]} • {triggerLabels[template.trigger]}
                        </div>
                      </div>
                    );
                  },
                },
                {
                  key: 'isActive',
                  header: 'Durum',
                  render: (value) => getStatusBadge(value as boolean),
                },
                {
                  key: 'sentCount',
                  header: 'Gönderim',
                  align: 'right' as const,
                  render: (value, record) => {
                    const template = record as NotificationTemplate;
                    return (
                      <div className="text-right">
                        <div className="font-medium">{value as number}</div>
                        {template.lastSent && (
                          <div className="text-xs text-gray-500">
                            Son: {formatDate(template.lastSent)}
                          </div>
                        )}
                      </div>
                    );
                  },
                },
                {
                  key: 'actions',
                  header: '',
                  render: (_, record) => {
                    const template = record as NotificationTemplate;
                    return (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(template.id)}
                          title={template.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                        >
                          {template.isActive ? (
                            <ToggleRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                          title="Sil"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  },
                },
              ]}
            />
          </Card>
        </>
      ) : (
        <Card>
          <Table
            data={notificationLogs}
            columns={[
              {
                key: 'type',
                header: 'Tür',
                render: (value) => {
                  const type = value as NotificationType;
                  const icon = type === 'email' ? Mail : type === 'sms' ? MessageSquare : type === 'whatsapp' ? Phone : Bell;
                  return (
                    <div className="flex items-center gap-2">
                      {icon && <Bell className="w-4 h-4 text-gray-400" />}
                      <span>{notificationTypeLabels[type]}</span>
                    </div>
                  );
                },
              },
              { key: 'recipient', header: 'Alıcı' },
              {
                key: 'subject',
                header: 'Konu/İçerik',
                render: (value, record) => {
                  const log = record as NotificationLog;
                  return (
                    <div className="max-w-xs truncate">
                      {log.subject || log.recipient}
                    </div>
                  );
                },
              },
              {
                key: 'status',
                header: 'Durum',
                render: (value) => getLogStatusBadge(value as NotificationLog['status']),
              },
              {
                key: 'sentAt',
                header: 'Tarih',
                render: (value) => formatDate(value as string),
              },
              {
                key: 'error',
                header: 'Hata',
                render: (value) =>
                  value ? (
                    <span className="text-red-600 text-sm">{value as string}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  ),
              },
            ]}
          />
        </Card>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingTemplate ? 'Şablonu Düzenle' : 'Yeni Bildirim Şablonu'}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Şablon Adı <span className="text-danger">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="örn: Sipariş Onayı"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                <Select
                  value={formData.type}
                  onChange={(value) => setFormData((prev) => ({ ...prev, type: value as NotificationType }))}
                  options={Object.entries(notificationTypeLabels).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tetikleyici</label>
                <Select
                  value={formData.trigger}
                  onChange={(value) => setFormData((prev) => ({ ...prev, trigger: value as NotificationTrigger }))}
                  options={Object.entries(triggerLabels).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              </div>
            </div>
            {formData.type === 'email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Konu <span className="text-danger">*</span>
                </label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="E-posta konusu..."
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mesaj İçeriği <span className="text-danger">*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Mesaj içeriği... (Değişkenler: {{customer_name}}, {{order_ref}}, {{order_total}}, {{due_date}}, {{product_name}}, {{stock}}, {{amount}})"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={5}
              />
              <p className="mt-1 text-xs text-gray-500">
                Değişkenler: {'{{customer_name}}'}, {'{{order_ref}}'}, {'{{order_total}}'}, {'{{due_date}}'}, {'{{product_name}}'}, {'{{stock}}'}, {'{{amount}}'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              İptal
            </Button>
            <Button onClick={handleSave}>
              {editingTemplate ? 'Kaydet' : 'Oluştur'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}