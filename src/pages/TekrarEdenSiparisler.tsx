import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Edit2, Trash2, Copy, Play, Pause,
  Calendar, Clock, Repeat, Loader2, AlertTriangle, CheckCircle
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, Button, Input, Select,
  Badge, Table, Pagination, Alert, Modal
} from '@/components/ui';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { thirdPartyApi, productApi, orderApi } from '@/lib/dolibarr';
import type { ThirdParty, Product } from '@/lib/types/dolibarr';

// Recurring order types
type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
type OrderStatus = 'active' | 'paused' | 'completed';

interface RecurringOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface RecurringOrder {
  id: number;
  title: string;
  customerId: number;
  customerName: string;
  items: RecurringOrderItem[];
  totalAmount: number;
  recurrenceType: RecurrenceType;
  recurrenceInterval: number;
  nextRunDate: string;
  lastRunDate?: string;
  status: OrderStatus;
  autoCreateInvoice: boolean;
  notes?: string;
}

const recurrenceLabels: Record<RecurrenceType, string> = {
  daily: 'Günlük',
  weekly: 'Haftalık',
  monthly: 'Aylık',
  quarterly: 'Çeyreklik',
  yearly: 'Yıllık',
};

const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case 'active':
      return <Badge variant="success">Aktif</Badge>;
    case 'paused':
      return <Badge variant="warning">Duraklatıldı</Badge>;
    case 'completed':
      return <Badge variant="gray">Tamamlandı</Badge>;
    default:
      return <Badge variant="gray">Bilinmiyor</Badge>;
  }
};

export default function TekrarEdenSiparisler() {
  const [recurringOrders, setRecurringOrders] = useState<RecurringOrder[]>([]);
  const [customers, setCustomers] = useState<ThirdParty[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<RecurringOrder | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    customerId: '',
    recurrenceType: 'monthly' as RecurrenceType,
    recurrenceInterval: '1',
    autoCreateInvoice: true,
    notes: '',
  });
  const [orderItems, setOrderItems] = useState<RecurringOrderItem[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [customerData, productData] = await Promise.all([
        thirdPartyApi.list({ limit: 100, mode: 'customer' }),
        productApi.list({ limit: 100 }),
      ]);
      setCustomers(customerData);
      setProducts(productData);

      // Mock recurring orders
      const mockOrders: RecurringOrder[] = [
        {
          id: 1,
          title: 'ABC Gıda - Haftalık Sipariş',
          customerId: 1,
          customerName: 'ABC Gıda Ltd.',
          items: [
            { productId: 1, productName: 'Ürün A', quantity: 10, unitPrice: 100 },
            { productId: 2, productName: 'Ürün B', quantity: 5, unitPrice: 200 },
          ],
          totalAmount: 2000,
          recurrenceType: 'weekly',
          recurrenceInterval: 1,
          nextRunDate: '2025-02-01',
          lastRunDate: '2025-01-25',
          status: 'active',
          autoCreateInvoice: true,
          notes: 'Her cuma günü teslimat',
        },
        {
          id: 2,
          title: 'XYZ Hırdavat - Aylık Sipariş',
          customerId: 2,
          customerName: 'XYZ Hırdavat A.Ş.',
          items: [
            { productId: 3, productName: 'Ürün C', quantity: 20, unitPrice: 50 },
          ],
          totalAmount: 1000,
          recurrenceType: 'monthly',
          recurrenceInterval: 1,
          nextRunDate: '2025-02-15',
          status: 'active',
          autoCreateInvoice: false,
        },
        {
          id: 3,
          title: 'Tekel Bayii - Günlük Sipariş',
          customerId: 3,
          customerName: 'Tekel Bayii',
          items: [
            { productId: 4, productName: 'Ürün D', quantity: 100, unitPrice: 25 },
          ],
          totalAmount: 2500,
          recurrenceType: 'daily',
          recurrenceInterval: 1,
          nextRunDate: '2025-01-20',
          lastRunDate: '2025-01-19',
          status: 'paused',
          autoCreateInvoice: true,
          notes: 'Geçici olarak duraklatıldı',
        },
      ];
      setRecurringOrders(mockOrders);
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
    setEditingOrder(null);
    setFormData({
      title: '',
      customerId: '',
      recurrenceType: 'monthly',
      recurrenceInterval: '1',
      autoCreateInvoice: true,
      notes: '',
    });
    setOrderItems([]);
    setShowModal(true);
  };

  const handleEdit = (order: RecurringOrder) => {
    setEditingOrder(order);
    setFormData({
      title: order.title,
      customerId: String(order.customerId),
      recurrenceType: order.recurrenceType,
      recurrenceInterval: String(order.recurrenceInterval),
      autoCreateInvoice: order.autoCreateInvoice,
      notes: order.notes || '',
    });
    setOrderItems(order.items);
    setShowModal(true);
  };

  const handleDelete = (orderId: number) => {
    if (confirm('Bu tekrarlayan siparişi silmek istediğinizden emin misiniz?')) {
      setRecurringOrders((prev) => prev.filter((o) => o.id !== orderId));
    }
  };

  const handleToggleStatus = (orderId: number) => {
    setRecurringOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: o.status === 'active' ? 'paused' : 'active',
          };
        }
        return o;
      })
    );
  };

  const handleDuplicate = (order: RecurringOrder) => {
    const newOrder: RecurringOrder = {
      ...order,
      id: Date.now(),
      title: `${order.title} (Kopya)`,
      status: 'paused',
    };
    setRecurringOrders((prev) => [...prev, newOrder]);
  };

  const addOrderItem = () => {
    setOrderItems((prev) => [
      ...prev,
      { productId: 0, productName: '', quantity: 1, unitPrice: 0 },
    ]);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p) => p.id === parseInt(productId));
    if (product) {
      setOrderItems((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                productId: product.id || 0,
                productName: product.label || '',
                unitPrice: product.price || 0,
              }
            : item
        )
      );
    }
  };

  const handleItemChange = (index: number, field: keyof RecurringOrderItem, value: number | string) => {
    setOrderItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const removeOrderItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      alert('Lütfen sipariş başlığı girin');
      return;
    }
    if (!formData.customerId) {
      alert('Lütfen müşteri seçin');
      return;
    }

    const validItems = orderItems.filter((item) => item.productId > 0);
    if (validItems.length === 0) {
      alert('Lütfen en az bir ürün ekleyin');
      return;
    }

    const totalAmount = validItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const customer = customers.find((c) => c.id === parseInt(formData.customerId));

    const newOrder: RecurringOrder = {
      id: editingOrder?.id || Date.now(),
      title: formData.title,
      customerId: parseInt(formData.customerId),
      customerName: customer?.name || '',
      items: validItems,
      totalAmount,
      recurrenceType: formData.recurrenceType,
      recurrenceInterval: parseInt(formData.recurrenceInterval),
      nextRunDate: calculateNextRunDate(formData.recurrenceType, parseInt(formData.recurrenceInterval)),
      lastRunDate: editingOrder?.lastRunDate,
      status: editingOrder?.status || 'active',
      autoCreateInvoice: formData.autoCreateInvoice,
      notes: formData.notes,
    };

    if (editingOrder) {
      setRecurringOrders((prev) => prev.map((o) => (o.id === editingOrder.id ? newOrder : o)));
    } else {
      setRecurringOrders((prev) => [...prev, newOrder]);
    }

    setShowModal(false);
  };

  const calculateNextRunDate = (type: RecurrenceType, interval: number): string => {
    const today = new Date();
    switch (type) {
      case 'daily':
        today.setDate(today.getDate() + interval);
        break;
      case 'weekly':
        today.setDate(today.getDate() + interval * 7);
        break;
      case 'monthly':
        today.setMonth(today.getMonth() + interval);
        break;
      case 'quarterly':
        today.setMonth(today.getMonth() + interval * 3);
        break;
      case 'yearly':
        today.setFullYear(today.getFullYear() + interval);
        break;
    }
    return today.toISOString().split('T')[0];
  };

  const filteredOrders = recurringOrders.filter(
    (order) =>
      order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalActive = recurringOrders.filter((o) => o.status === 'active').length;
  const totalAmount = recurringOrders
    .filter((o) => o.status === 'active')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
          <p className="text-gray-500">Tekrarlayan siparişler yükleniyor...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tekrar Eden Siparişler</h1>
            <p className="text-sm text-gray-500 mt-1">
              Otomatik olarak tekrarlanan siparişleri yönetin
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4" />
            Yeni Tekrarlayan Sipariş
          </Button>
        </div>
      </div>

      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Aktif Siparişler</p>
              <p className="text-2xl font-bold text-gray-900">{totalActive}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Repeat className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Aylık Tahmini Tutar</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Bu Ay Çalıştırılan</p>
              <p className="text-2xl font-bold text-gray-900">
                {recurringOrders.filter((o) => o.lastRunDate?.startsWith('2025-01')).length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Sipariş veya müşteri ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Orders List */}
      <Card>
        <Table
          data={filteredOrders}
          columns={[
            {
              key: 'title',
              header: 'Sipariş Adı',
              render: (value, record) => {
                const order = record as RecurringOrder;
                return (
                  <div>
                    <div className="font-medium text-gray-900">{value as string}</div>
                    <div className="text-sm text-gray-500">{order.customerName}</div>
                  </div>
                );
              },
            },
            {
              key: 'recurrenceType',
              header: 'Tekrar',
              render: (value) => {
                const type = value as RecurrenceType;
                const order = filteredOrders.find((o) => o.recurrenceType === type);
                return (
                  <div className="flex items-center gap-1">
                    <Repeat className="w-4 h-4 text-gray-400" />
                    <span>{recurrenceLabels[type]}</span>
                  </div>
                );
              },
            },
            {
              key: 'totalAmount',
              header: 'Tutar',
              align: 'right' as const,
              render: (value) => (
                <span className="font-semibold">{formatCurrency(value as number)}</span>
              ),
            },
            {
              key: 'nextRunDate',
              header: 'Sonraki Çalışma',
              render: (value) => (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{formatDate(value as string)}</span>
                </div>
              ),
            },
            {
              key: 'lastRunDate',
              header: 'Son Çalışma',
              render: (value) => (
                <span className="text-gray-500">
                  {value ? formatDate(value as string) : '-'}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Durum',
              render: (value) => getStatusBadge(value as OrderStatus),
            },
            {
              key: 'autoCreateInvoice',
              header: 'Otomatik Fatura',
              render: (value) =>
                value ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <span className="text-gray-400">-</span>
                ),
            },
            {
              key: 'actions',
              header: '',
              render: (_, record) => {
                const order = record as RecurringOrder;
                return (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(order.id)}
                      title={order.status === 'active' ? 'Duraklat' : 'Başlat'}
                    >
                      {order.status === 'active' ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(order)}
                      title="Kopyala"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(order)}
                      title="Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(order.id)}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingOrder ? 'Tekrarlayan Siparişi Düzenle' : 'Yeni Tekrarlayan Sipariş'}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sipariş Adı <span className="text-danger">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="örn: Aylık Malzeme Siparişi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Müşteri <span className="text-danger">*</span>
              </label>
              <Select
                value={formData.customerId}
                onChange={(value) => setFormData((prev) => ({ ...prev, customerId: value }))}
                options={customers.map((c) => ({ value: String(c.id), label: c.name }))}
                placeholder="Müşteri seçin"
              />
            </div>

            {/* Recurrence Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tekrar Sıklığı
                </label>
                <Select
                  value={formData.recurrenceType}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, recurrenceType: value as RecurrenceType }))
                  }
                  options={Object.entries(recurrenceLabels).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tekrar Aralığı
                </label>
                <Input
                  type="number"
                  min={1}
                  value={formData.recurrenceInterval}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, recurrenceInterval: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoCreateInvoice"
                checked={formData.autoCreateInvoice}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, autoCreateInvoice: e.target.checked }))
                }
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="autoCreateInvoice" className="text-sm text-gray-700">
                Çalıştırıldığında otomatik fatura oluştur
              </label>
            </div>

            {/* Order Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Sipariş Kalemleri</label>
                <Button variant="secondary" size="sm" onClick={addOrderItem}>
                  <Plus className="w-4 h-4" />
                  Ürün Ekle
                </Button>
              </div>
              <div className="space-y-2">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Select
                        value={String(item.productId)}
                        onChange={(value) => handleProductSelect(index, value)}
                        options={products.map((p) => ({
                          value: String(p.id),
                          label: `${p.ref} - ${p.label}`,
                        }))}
                        placeholder="Ürün seçin"
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        placeholder="Adet"
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        placeholder="Fiyat"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOrderItem(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                {orderItems.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Henüz ürün eklenmemiş.
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Sipariş notları..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={2}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              İptal
            </Button>
            <Button onClick={handleSave}>
              {editingOrder ? 'Kaydet' : 'Oluştur'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}