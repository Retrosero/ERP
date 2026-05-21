import { useState, useEffect } from 'react';
import {
  FileText, Send, Download, Search, Filter, Eye,
  Clock, CheckCircle, XCircle, AlertTriangle, Mail, RefreshCw, Settings
} from 'lucide-react';
import { Card, Button, Input, Select, Table, Badge, Modal, StatCard, Alert } from '@/components/ui';
import { testConnection, getIncomingInvoices, getOutgoingInvoices, sendInvoice, Invoice } from '@/lib/efatura';
import { useNavigate } from 'react-router-dom';

// Mock data for when API is not configured
const mockEFaturalar: EFaturaInvoice[] = [
  {
    id: 1,
    uuid: 'urn:uuid:12345678-1234-1234-1234-123456789012',
    type: 'invoice',
    direction: 'outbound',
    status: 'sent',
    issue_date: '2024-01-18',
    ref: 'FTR-2024-0100',
    recipient_name: 'ABC Ticaret A.Ş.',
    recipient_tax_number: '1234567890',
    total_amount: 11800,
    currency: 'TRY',
    created_at: '2024-01-18 14:30',
  },
  {
    id: 2,
    uuid: 'urn:uuid:87654321-4321-4321-4321-210987654321',
    type: 'invoice',
    direction: 'outbound',
    status: 'received',
    issue_date: '2024-01-17',
    ref: 'FTR-2024-0099',
    recipient_name: 'XYZ Ltd. Şti.',
    recipient_tax_number: '0987654321',
    total_amount: 5900,
    currency: 'TRY',
    created_at: '2024-01-17 10:15',
  },
  {
    id: 3,
    uuid: 'urn:uuid:55555555-5555-5555-5555-555555555555',
    type: 'invoice',
    direction: 'outbound',
    status: 'draft',
    issue_date: '2024-01-16',
    ref: 'FTR-2024-0098',
    recipient_name: 'Firma D',
    recipient_tax_number: '5678901234',
    total_amount: 35400,
    currency: 'TRY',
    created_at: '2024-01-16 16:00',
  },
  {
    id: 4,
    uuid: 'urn:uuid:66666666-6666-6666-6666-666666666666',
    type: 'invoice',
    direction: 'outbound',
    status: 'error',
    issue_date: '2024-01-15',
    ref: 'FTR-2024-0097',
    recipient_name: 'Müşteri E',
    recipient_tax_number: '3456789012',
    total_amount: 11800,
    currency: 'TRY',
    error_message: 'GİB sisteminde hata oluştu',
    created_at: '2024-01-15 11:20',
  },
  {
    id: 5,
    uuid: 'urn:uuid:77777777-7777-7777-7777-777777777777',
    type: 'credit_note',
    direction: 'outbound',
    status: 'sent',
    issue_date: '2024-01-14',
    ref: 'FTR-2024-0096',
    recipient_name: 'ABC Ticaret A.Ş.',
    recipient_tax_number: '1234567890',
    total_amount: -1180,
    currency: 'TRY',
    created_at: '2024-01-14 09:00',
  },
];

const statusConfig = {
  draft: { label: 'Taslak', icon: Clock, variant: 'gray' as const },
  signed: { label: 'İmzalandı', icon: CheckCircle, variant: 'info' as const },
  sent: { label: 'Gönderildi', icon: Send, variant: 'success' as const },
  received: { label: 'Alındı', icon: Mail, variant: 'success' as const },
  read: { label: 'Okundu', icon: Eye, variant: 'success' as const },
  error: { label: 'Hata', icon: XCircle, variant: 'danger' as const },
};

interface EFaturaInvoice {
  id: number;
  uuid: string;
  type: 'invoice' | 'credit_note';
  direction: 'outbound' | 'inbound';
  status: keyof typeof statusConfig;
  issue_date: string;
  ref: string;
  recipient_name: string;
  recipient_tax_number: string;
  total_amount: number;
  currency: string;
  created_at: string;
  error_message?: string;
}

export default function EFatura() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'outbound' | 'inbound'>('outbound');
  const [activeStatus, setActiveStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<EFaturaInvoice | null>(null);
  const [invoices, setInvoices] = useState<EFaturaInvoice[]>(mockEFaturalar);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Check e-Fatura configuration on mount
  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const settingsStr = localStorage.getItem('efatura_settings');
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        if (settings.apiKey && settings.vkn) {
          setIsConfigured(true);
          // Test connection
          const result = await testConnection();
          setConnectionStatus(result.success ? 'connected' : 'disconnected');
        }
      }
    } catch {
      setIsConfigured(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'outbound') {
        const result = await getOutgoingInvoices();
        if (result.success && result.data) {
          // Transform API response to UI format
          const transformedData = (result.data as Array<unknown>).map((item: unknown) => {
            const apiInvoice = item as {
              id: number;
              uuid?: string;
              type?: string;
              direction?: string;
              status?: string;
              issue_date?: string;
              ref?: string;
              recipient_name?: string;
              recipient_tax_number?: string;
              total_amount?: number;
              currency?: string;
              created_at?: string;
            };
            return {
              id: apiInvoice.id,
              uuid: apiInvoice.uuid || '',
              type: apiInvoice.type === 'invoice' ? 'invoice' as const : 'credit_note' as const,
              direction: 'outbound' as const,
              status: (apiInvoice.status || 'draft') as keyof typeof statusConfig,
              issue_date: apiInvoice.issue_date || '',
              ref: apiInvoice.ref || '',
              recipient_name: apiInvoice.recipient_name || '',
              recipient_tax_number: apiInvoice.recipient_tax_number || '',
              total_amount: apiInvoice.total_amount || 0,
              currency: apiInvoice.currency || 'TRY',
              created_at: apiInvoice.created_at || '',
            };
          });
          if (transformedData.length > 0) {
            setInvoices(transformedData);
          }
        }
      } else {
        const result = await getIncomingInvoices();
        if (result.success && result.data) {
          const transformedData = (result.data as Array<unknown>).map((item: unknown) => {
            const apiInvoice = item as {
              id: number;
              uuid?: string;
              type?: string;
              direction?: string;
              status?: string;
              issue_date?: string;
              ref?: string;
              recipient_name?: string;
              recipient_tax_number?: string;
              total_amount?: number;
              currency?: string;
              created_at?: string;
            };
            return {
              id: apiInvoice.id,
              uuid: apiInvoice.uuid || '',
              type: apiInvoice.type === 'invoice' ? 'invoice' as const : 'credit_note' as const,
              direction: 'inbound' as const,
              status: (apiInvoice.status || 'received') as keyof typeof statusConfig,
              issue_date: apiInvoice.issue_date || '',
              ref: apiInvoice.ref || '',
              recipient_name: apiInvoice.recipient_name || '',
              recipient_tax_number: apiInvoice.recipient_tax_number || '',
              total_amount: apiInvoice.total_amount || 0,
              currency: apiInvoice.currency || 'TRY',
              created_at: apiInvoice.created_at || '',
            };
          });
          if (transformedData.length > 0) {
            setInvoices(transformedData);
          }
        }
      }
      setLastSync(new Date().toLocaleString('tr-TR'));
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvoice = async (invoice: EFaturaInvoice) => {
    // Transform to Invoice format for API
    const invoiceData: Invoice = {
      ref: invoice.ref,
      type: 'sales',
      customer: {
        name: invoice.recipient_name,
        vkn: invoice.recipient_tax_number,
        alias: '',
        address: '',
      },
      date: invoice.issue_date,
      dueDate: invoice.issue_date,
      lines: [],
      subtotal: invoice.total_amount,
      discount: 0,
      discountAmount: 0,
      vatAmount: 0,
      total: invoice.total_amount,
      currency: invoice.currency,
      status: 'draft',
    };

    const result = await sendInvoice(invoiceData);
    if (result.success) {
      alert('Fatura başarıyla gönderildi!');
      handleSync();
    } else {
      alert('Fatura gönderilemedi: ' + result.message);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (invoice.direction !== activeTab) return false;
    if (activeStatus && invoice.status !== activeStatus) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        invoice.ref.toLowerCase().includes(search) ||
        invoice.recipient_name.toLowerCase().includes(search) ||
        invoice.uuid.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const sentCount = filteredInvoices.filter(i => i.status === 'sent' || i.status === 'received').length;
  const errorCount = filteredInvoices.filter(i => i.status === 'error').length;

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">e-Fatura / e-Arşiv</h1>
          <p className="page-subtitle">Elektronik faturalarınızı yönetin</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsTemplateModalOpen(true)}>
            <FileText className="w-4 h-4" />
            Şablon Ayarla
          </Button>
          <Button variant="primary" onClick={() => navigate('/faturalar/yeni')}>
            <FileText className="w-4 h-4" />
            Yeni e-Fatura
          </Button>
        </div>
      </div>

      {/* Configuration Warning */}
      {!isConfigured && (
        <Alert type="warning" title="e-Fatura Ayarları Yapılandırılmamış">
          e-Fatura işlemleri için önce Ayarlar sayfasından NES veya diğer e-Fatura sağlayıcınızın ayarlarını yapılandırmanız gerekmektedir.
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigate('/ayarlar')}>
            <Settings className="w-4 h-4" />
            Ayarlara Git
          </Button>
        </Alert>
      )}

      {/* Gib Status */}
      <Card className="mb-6">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : connectionStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'}`} />
            <div>
              <p className="font-medium">
                {connectionStatus === 'connected' ? 'GİB Bağlantısı Aktif' : connectionStatus === 'disconnected' ? 'Bağlantı Hatası' : 'Bağlantı Durumu Bilinmiyor'}
              </p>
              <p className="text-sm text-gray-500">
                {lastSync ? `Son senkron: ${lastSync}` : 'Henüz senkron edilmedi'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/ayarlar#efatura')}>
              <Settings className="w-4 h-4" />
              Ayarlar
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSync} loading={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Yenile
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          label="Toplam e-Fatura"
          value={String(invoices.length)}
        />
        <StatCard
          icon={<Send className="w-5 h-5" />}
          label="Gönderilen"
          value={String(sentCount)}
          iconColor="text-green-600"
        />
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          label="Toplam Tutar"
          value={totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Hatalı"
          value={String(errorCount)}
          iconColor="text-red-600"
        />
      </div>

      {/* Direction Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('outbound')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'outbound'
              ? 'bg-green-100 text-green-700 border-2 border-green-500'
              : 'bg-gray-50 text-gray-600 border border-gray-200'
          }`}
        >
          <Send className="w-4 h-4 inline mr-2" />
          Giden
        </button>
        <button
          onClick={() => setActiveTab('inbound')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'inbound'
              ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
              : 'bg-gray-50 text-gray-600 border border-gray-200'
          }`}
        >
          <Mail className="w-4 h-4 inline mr-2" />
          Gelen
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveStatus('')}
          className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap ${
            !activeStatus ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          Tümü
        </button>
        {Object.entries(statusConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setActiveStatus(key)}
            className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap flex items-center gap-2 ${
              activeStatus === key ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <config.icon className="w-4 h-4" />
            {config.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Fatura numarası, alıcı veya UUID ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              options={[
                { value: 'invoice', label: 'Fatura' },
                { value: 'credit_note', label: 'Düzeltme Faturası' },
              ]}
              className="w-40"
              onChange={() => {}}
            />
            <Button variant="ghost">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={[
            {
              key: 'ref',
              header: 'Fatura No',
              render: (value) => <span className="font-mono font-medium">{value as string}</span>,
            },
            {
              key: 'recipient_name',
              header: 'Alıcı',
              render: (value, row) => {
                const invoice = row as unknown as EFaturaInvoice;
                return (
                  <div>
                    <p className="font-medium">{value as string}</p>
                    <p className="text-xs text-gray-500">{invoice.recipient_tax_number}</p>
                  </div>
                );
              },
            },
            {
              key: 'type',
              header: 'Tür',
              render: (value) => (
                <Badge variant={value === 'invoice' ? 'info' : 'warning'}>
                  {value === 'invoice' ? 'Fatura' : 'Düzeltme'}
                </Badge>
              ),
            },
            {
              key: 'issue_date',
              header: 'Tarih',
              render: (value) => new Date(value as string).toLocaleDateString('tr-TR'),
            },
            {
              key: 'total_amount',
              header: 'Tutar',
              render: (value) => (
                <span className={`font-semibold ${(value as number) < 0 ? 'text-red-600' : ''}`}>
                  {(value as number).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Durum',
              render: (value) => {
                const config = statusConfig[value as keyof typeof statusConfig];
                return (
                  <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
                    <config.icon className="w-3 h-3" />
                    {config.label}
                  </Badge>
                );
              },
            },
            {
              key: 'actions',
              header: '',
              render: (_, row) => {
                const invoice = row as unknown as EFaturaInvoice;
                return (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(invoice)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {invoice.status === 'draft' && (
                      <Button variant="primary" size="sm" onClick={() => handleSendInvoice(invoice)}>
                        <Send className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                );
              },
            },
          ]}
          data={filteredInvoices as unknown as Record<string, unknown>[]}
          emptyMessage="e-Fatura bulunamadı"
        />
      </Card>

      {/* Template Modal */}
      <Modal
        open={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Fatura Şablonu Ayarla"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Logo</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Logo yükle</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Şablon Adı</label>
                <Input placeholder="Varsayılan Şablon" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Kağıt Boyutu</label>
                <Select
                  options={[
                    { value: 'a4', label: 'A4' },
                    { value: 'a5', label: 'A5' },
                    { value: '80mm', label: '80mm (Termal)' },
                  ]}
                  onChange={() => {}}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Yazıtipi</label>
                <Select
                  options={[
                    { value: 'inter', label: 'Inter' },
                    { value: 'arial', label: 'Arial' },
                    { value: 'times', label: 'Times New Roman' },
                  ]}
                  onChange={() => {}}
                />
              </div>
            </div>
          </div>
          <div className="border-t pt-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Şablon Önizleme</label>
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <p className="text-gray-400 text-sm">Şablon önizlemesi burada görünecek</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setIsTemplateModalOpen(false)}>İptal</Button>
          <Button variant="primary">Kaydet</Button>
        </div>
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title="e-Fatura Detayı"
        size="lg"
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Fatura Numarası</label>
                <p className="font-mono font-medium">{selectedInvoice.ref}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Durum</label>
                <Badge variant={statusConfig[selectedInvoice.status].variant}>
                  {statusConfig[selectedInvoice.status].label}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Alıcı</label>
                <p className="font-medium">{selectedInvoice.recipient_name}</p>
                <p className="text-sm text-gray-500">{selectedInvoice.recipient_tax_number}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Tarih</label>
                <p>{new Date(selectedInvoice.issue_date).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">UUID</label>
              <p className="font-mono text-xs text-gray-600 break-all">{selectedInvoice.uuid}</p>
            </div>
            <div className="border-t pt-4">
              <label className="text-sm text-gray-500">Toplam Tutar</label>
              <p className="text-2xl font-bold">
                {selectedInvoice.total_amount.toLocaleString('tr-TR', { style: 'currency', currency: selectedInvoice.currency })}
              </p>
            </div>
            {selectedInvoice.error_message && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">{selectedInvoice.error_message}</p>
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setSelectedInvoice(null)}>Kapat</Button>
          {selectedInvoice && selectedInvoice.status === 'draft' && (
            <Button variant="primary" onClick={() => handleSendInvoice(selectedInvoice)}>
              <Send className="w-4 h-4" />
              Gönder
            </Button>
          )}
          <Button variant="secondary">
            <Download className="w-4 h-4" />
            PDF İndir
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4" />
            XML İndir
          </Button>
        </div>
      </Modal>
    </>
  );
}