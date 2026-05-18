import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Printer, Settings, Download, Loader2,
  ChevronDown, PrinterIcon, QrCode, Barcode, Package, Eye
} from 'lucide-react';
import { MainLayout } from '@/components/layout';
import {
  Card, CardHeader, CardTitle, Button, Input, Select,
  Badge, Table, Alert, Modal
} from '@/components/ui';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { productApi, orderApi } from '@/lib/dolibarr';
import type { Product, Order } from '@/lib/types/dolibarr';

// Receipt types
interface ReceiptTemplate {
  id: number;
  name: string;
  type: 'sale' | 'return' | 'order' | 'quote';
  width: number; // mm
  paperType: '58mm' | '80mm';
  showLogo: boolean;
  showBarcode: boolean;
  showQR: boolean;
  showCompanyInfo: boolean;
  showCustomerInfo: boolean;
  showItems: boolean;
  showTotals: boolean;
  footerText?: string;
}

interface PrintQueueItem {
  id: number;
  type: 'receipt' | 'label' | 'report';
  title: string;
  data: unknown;
  templateId: number;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  createdAt: string;
  printerName?: string;
}

const defaultTemplates: ReceiptTemplate[] = [
  {
    id: 1,
    name: 'Satış Fişi (58mm)',
    type: 'sale',
    width: 58,
    paperType: '58mm',
    showLogo: true,
    showBarcode: true,
    showQR: false,
    showCompanyInfo: true,
    showCustomerInfo: true,
    showItems: true,
    showTotals: true,
    footerText: 'Teşekkürler, yine bekleriz!',
  },
  {
    id: 2,
    name: 'Satış Fişi (80mm)',
    type: 'sale',
    width: 80,
    paperType: '80mm',
    showLogo: true,
    showBarcode: true,
    showQR: true,
    showCompanyInfo: true,
    showCustomerInfo: true,
    showItems: true,
    showTotals: true,
    footerText: 'Teşekkürler, yine bekleriz!',
  },
  {
    id: 3,
    name: 'Ürün Etiketi',
    type: 'sale',
    width: 40,
    paperType: '58mm',
    showLogo: false,
    showBarcode: true,
    showQR: false,
    showCompanyInfo: false,
    showCustomerInfo: false,
    showItems: true,
    showTotals: false,
  },
];

export default function TermalBaski() {
  const [templates, setTemplates] = useState<ReceiptTemplate[]>(defaultTemplates);
  const [printQueue, setPrintQueue] = useState<PrintQueueItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReceiptTemplate | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ type: 'product' | 'order'; id: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'print' | 'templates' | 'queue'>('print');
  const printAreaRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [productData, orderData] = await Promise.all([
        productApi.list({ limit: 50 }),
        orderApi.list({ limit: 20, status: 2 }),
      ]);
      setProducts(productData);
      setOrders(orderData);
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

  const handlePrintReceipt = (item: { type: 'product' | 'order'; id: number }) => {
    setSelectedItem(item);
    setShowPreviewModal(true);
  };

  const handleAddToQueue = () => {
    if (!selectedItem || !selectedTemplate) return;

    const queueItem: PrintQueueItem = {
      id: Date.now(),
      type: 'receipt',
      title: selectedItem.type === 'product' ? 'Ürün Etiketi' : 'Satış Fişi',
      data: selectedItem,
      templateId: selectedTemplate.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setPrintQueue((prev) => [...prev, queueItem]);
    setShowPreviewModal(false);
    alert('Yazdırma kuyruğuna eklendi');
  };

  const handlePrintDirect = () => {
    if (!printAreaRef.current) return;

    // Create a print-friendly version
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = printAreaRef.current.innerHTML;
    printWindow.document.write(`
      <html>
        <head>
          <title>Termal Baskı</title>
          <style>
            @page { margin: 0; size: ${selectedTemplate?.paperType === '80mm' ? '80mm' : '58mm'} auto; }
            body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 0; }
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleTestPrint = () => {
    setShowPreviewModal(true);
  };

  // Sample receipt content
  const renderReceiptPreview = () => {
    if (!selectedTemplate) return null;

    const width = selectedTemplate.paperType === '80mm' ? '75mm' : '55mm';

    return (
      <div
        ref={printAreaRef}
        className="bg-white p-2 mx-auto"
        style={{ width, fontFamily: 'monospace', fontSize: '11px' }}
      >
        {/* Header */}
        {selectedTemplate.showCompanyInfo && (
          <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
            <div className="font-bold text-sm">FİRMA ADI A.Ş.</div>
            <div className="text-xs">Atatürk Cad. No:123</div>
            <div className="text-xs">Şişli / İstanbul</div>
            <div className="text-xs">Tel: 0212 123 4567</div>
            <div className="text-xs">Vergi No: 1234567890</div>
          </div>
        )}

        {/* Title */}
        <div className="text-center font-bold border-b border-dashed border-gray-400 pb-1 mb-2">
          {selectedTemplate.type === 'sale' ? 'SATIŞ FİŞİ' : 'İADE FİŞİ'}
        </div>

        {/* Info */}
        <div className="text-xs mb-2">
          <div>Tarih: {new Date().toLocaleDateString('tr-TR')}</div>
          <div>Fiş No: {String(Math.floor(Math.random() * 10000)).padStart(6, '0')}</div>
          {selectedTemplate.showCustomerInfo && (
            <>
              <div>Müşteri: Perakende Satış</div>
              <div>Cinsi: Nakit</div>
            </>
          )}
        </div>

        {/* Items */}
        {selectedTemplate.showItems && (
          <>
            <div className="border-t border-b border-dashed border-gray-400 py-1 mb-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Ürün</span>
                <span>Tutar</span>
              </div>
            </div>
            <div className="text-xs space-y-1 mb-2">
              <div className="flex justify-between">
                <span>Ürün A x 2</span>
                <span>200.00</span>
              </div>
              <div className="flex justify-between">
                <span>Ürün B x 1</span>
                <span>150.00</span>
              </div>
              <div className="flex justify-between">
                <span>Ürün C x 3</span>
                <span>300.00</span>
              </div>
            </div>
          </>
        )}

        {/* Totals */}
        {selectedTemplate.showTotals && (
          <div className="border-t border-dashed border-gray-400 pt-2 mb-2">
            <div className="flex justify-between text-xs">
              <span>Ara Toplam:</span>
              <span>650.00 TL</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>KDV (%18):</span>
              <span>117.00 TL</span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-dashed border-gray-400 mt-1 pt-1">
              <span>GENEL TOPLAM:</span>
              <span>767.00 TL</span>
            </div>
          </div>
        )}

        {/* Barcode */}
        {selectedTemplate.showBarcode && (
          <div className="text-center border-t border-dashed border-gray-400 pt-2 mb-2">
            <div className="text-xs mb-1">*1234567890*</div>
            <div className="h-16 flex items-center justify-center border-b border-gray-300">
              {'█'.repeat(40)}
            </div>
          </div>
        )}

        {/* QR */}
        {selectedTemplate.showQR && (
          <div className="text-center border-t border-dashed border-gray-400 pt-2 mb-2">
            <div className="w-16 h-16 mx-auto border border-gray-300 flex items-center justify-center text-xs">
              QR
            </div>
          </div>
        )}

        {/* Footer */}
        {selectedTemplate.footerText && (
          <div className="text-center text-xs border-t border-dashed border-gray-400 pt-2">
            {selectedTemplate.footerText}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
          <p className="text-gray-500">Termal baskı yükleniyor...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Termal Baskı</h1>
        <p className="text-sm text-gray-500 mt-1">
          58mm ve 80mm termal yazıcılar için fiş ve etiket baskısı
        </p>
      </div>

      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('print')}
          className={cn(
            'pb-3 px-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'print'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Baskı
        </button>
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
          onClick={() => setActiveTab('queue')}
          className={cn(
            'pb-3 px-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'queue'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Yazdırma Kuyruğu ({printQueue.length})
        </button>
      </div>

      {activeTab === 'print' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Print Options */}
          <Card>
            <CardHeader>
              <CardTitle>Fiş/Etiket Baskısı</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şablon Seçimi
                </label>
                <Select
                  value={String(selectedTemplate?.id || '')}
                  onChange={(value) => {
                    const template = templates.find((t) => t.id === parseInt(value));
                    setSelectedTemplate(template || null);
                  }}
                  options={templates.map((t) => ({
                    value: String(t.id),
                    label: `${t.name} (${t.paperType})`,
                  }))}
                  placeholder="Şablon seçin"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Hızlı Baskı</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => handleTestPrint()}
                    disabled={!selectedTemplate}
                  >
                    <Printer className="w-4 h-4" />
                    Test Baskısı
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handlePrintDirect}
                    disabled={!selectedTemplate}
                  >
                    <Download className="w-4 h-4" />
                    Doğrudan Yazdır
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Son Siparişler</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-sm">{order.ref}</div>
                        <div className="text-xs text-gray-500">{formatCurrency(order.total_ttc)}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedItem({ type: 'order', id: order.id });
                          handlePrintReceipt({ type: 'order', id: order.id });
                        }}
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Önizleme</CardTitle>
            </CardHeader>
            <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4 min-h-[400px]">
              {selectedTemplate ? (
                renderReceiptPreview()
              ) : (
                <div className="text-center text-gray-500">
                  <Printer className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Önizleme için şablon seçin</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'templates' && (
        <Card>
          <Table
            data={templates}
            columns={[
              { key: 'name', header: 'Şablon Adı' },
              {
                key: 'paperType',
                header: 'Kağıt',
                render: (value) => (
                  <Badge variant="gray">{value as string}</Badge>
                ),
              },
              {
                key: 'showBarcode',
                header: 'Barkod',
                render: (value) => (
                  value ? <Badge variant="success">Var</Badge> : <Badge variant="gray">Yok</Badge>
                ),
              },
              {
                key: 'showQR',
                header: 'QR Kod',
                render: (value) => (
                  value ? <Badge variant="success">Var</Badge> : <Badge variant="gray">Yok</Badge>
                ),
              },
              {
                key: 'actions',
                header: '',
                render: (_, record) => {
                  const template = record as ReceiptTemplate;
                  return (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowPreviewModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                },
              },
            ]}
          />
        </Card>
      )}

      {activeTab === 'queue' && (
        <Card>
          {printQueue.length === 0 ? (
            <div className="text-center py-12">
              <Printer className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Kuyruk Boş</h3>
              <p className="text-gray-500">Yazdırılacak belge bulunmuyor.</p>
            </div>
          ) : (
            <Table
              data={printQueue}
              columns={[
                { key: 'title', header: 'Başlık' },
                {
                  key: 'type',
                  header: 'Tür',
                  render: (value) => (
                    <Badge variant="gray">{value as string}</Badge>
                  ),
                },
                {
                  key: 'status',
                  header: 'Durum',
                  render: (value) => {
                    const status = value as PrintQueueItem['status'];
                    return status === 'completed' ? (
                      <Badge variant="success">Tamamlandı</Badge>
                    ) : status === 'failed' ? (
                      <Badge variant="danger">Başarısız</Badge>
                    ) : status === 'printing' ? (
                      <Badge variant="warning">Yazdırılıyor</Badge>
                    ) : (
                      <Badge variant="gray">Bekliyor</Badge>
                    );
                  },
                },
                {
                  key: 'createdAt',
                  header: 'Tarih',
                  render: (value) => formatDate(value as string),
                },
              ]}
            />
          )}
        </Card>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="Fiş Önizleme"
          size="sm"
        >
          <div className="flex justify-center bg-gray-100 p-4 rounded-lg">
            {renderReceiptPreview()}
          </div>
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
              Kapat
            </Button>
            <Button onClick={handleAddToQueue}>
              <Printer className="w-4 h-4" />
              Yazdırma Kuyruğuna Ekle
            </Button>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}