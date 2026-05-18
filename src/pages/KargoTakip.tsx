import { useState, useEffect, useCallback } from 'react';
import {
  Package, Truck, MapPin, Search, Filter, Download, Loader2,
  Clock, CheckCircle, AlertCircle, Phone, MessageSquare,
  ChevronRight, Eye, Edit2, RefreshCw, Send
} from 'lucide-react';
import { MainLayout } from '@/components/layout';
import {
  Card, CardHeader, CardTitle, Button, Input, Select,
  Badge, Table, Alert, Modal
} from '@/components/ui';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import type { Order } from '@/lib/types/dolibarr';
import { orderApi } from '@/lib/dolibarr';

// Cargo tracking types
type CargoStatus = 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned' | 'failed';
type Carrier = 'aras' | 'ptt' | 'ups' | 'dhl' | 'yurtici' | 'mng' | 'other';

interface CargoShipment {
  id: number;
  orderId: number;
  orderRef: string;
  trackingNumber: string;
  carrier: Carrier;
  carrierName: string;
  status: CargoStatus;
  senderName: string;
  senderAddress: string;
  recipientName: string;
  recipientAddress: string;
  recipientPhone: string;
  weight: number;
  pieces: number;
  createdAt: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  lastUpdate: string;
  events: CargoEvent[];
  cost: number;
}

interface CargoEvent {
  date: string;
  location: string;
  description: string;
  status: CargoStatus;
}

const statusLabels: Record<CargoStatus, string> = {
  pending: 'Beklemede',
  picked_up: 'Teslim Alındı',
  in_transit: 'Yolda',
  out_for_delivery: 'Dağıtımda',
  delivered: 'Teslim Edildi',
  returned: 'İade Edildi',
  failed: 'Teslim Edilemedi',
};

const statusColors: Record<CargoStatus, string> = {
  pending: 'gray',
  picked_up: 'blue',
  in_transit: 'blue',
  out_for_delivery: 'warning',
  delivered: 'success',
  returned: 'danger',
  failed: 'danger',
};

const carrierNames: Record<Carrier, string> = {
  aras: 'Aras Kargo',
  ptt: 'PTT Kargo',
  ups: 'UPS',
  dhl: 'DHL',
  yurtici: 'Yurtiçi Kargo',
  mng: 'MNG Kargo',
  other: 'Diğer',
};

export default function KargoTakip() {
  const [shipments, setShipments] = useState<CargoShipment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CargoStatus | ''>('');
  const [carrierFilter, setCarrierFilter] = useState<Carrier | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<CargoShipment | null>(null);
  const [activeTab, setActiveTab] = useState<'tracking' | 'labels'>('tracking');

  // Create form state
  const [createForm, setCreateForm] = useState({
    orderId: '',
    carrier: 'aras' as Carrier,
    recipientName: '',
    recipientPhone: '',
    recipientAddress: '',
    weight: '1',
    pieces: '1',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const orderData = await orderApi.list({ limit: 100 });
      setOrders(orderData);

      // Mock shipments data
      const mockShipments: CargoShipment[] = [
        {
          id: 1,
          orderId: 1,
          orderRef: 'ORD-2025-001',
          trackingNumber: 'AR123456789',
          carrier: 'aras',
          carrierName: 'Aras Kargo',
          status: 'in_transit',
          senderName: 'Firma Adı A.Ş.',
          senderAddress: 'Atatürk Cad. No:123, Şişli/İstanbul',
          recipientName: 'Ahmet Yılmaz',
          recipientAddress: 'Demir Cad. No:45, Kadıköy/İstanbul',
          recipientPhone: '0532 123 4567',
          weight: 2.5,
          pieces: 2,
          createdAt: '2025-01-15 10:30',
          estimatedDelivery: '2025-01-17',
          lastUpdate: '2025-01-16 14:20',
          events: [
            { date: '2025-01-15 10:30', location: 'İstanbul Şişli', description: 'Gönderi hazırlandı', status: 'pending' },
            { date: '2025-01-15 14:45', location: 'İstanbul Şişli', description: 'Kargo yetkilisine teslim edildi', status: 'picked_up' },
            { date: '2025-01-16 08:15', location: 'İstanbul Hub', description: 'Dağıtım merkezine ulaştı', status: 'in_transit' },
            { date: '2025-01-16 14:20', location: 'İstanbul Hub', description: 'Dağıtıma çıkış için hazır', status: 'in_transit' },
          ],
          cost: 45.00,
        },
        {
          id: 2,
          orderId: 2,
          orderRef: 'ORD-2025-002',
          trackingNumber: 'PT987654321',
          carrier: 'ptt',
          carrierName: 'PTT Kargo',
          status: 'delivered',
          senderName: 'Firma Adı A.Ş.',
          senderAddress: 'Atatürk Cad. No:123, Şişli/İstanbul',
          recipientName: 'Mehmet Kaya',
          recipientAddress: 'Vatan Cad. No:78, Fatih/İstanbul',
          recipientPhone: '0533 987 6543',
          weight: 1.0,
          pieces: 1,
          createdAt: '2025-01-10 09:00',
          deliveredAt: '2025-01-12 15:30',
          lastUpdate: '2025-01-12 15:30',
          events: [
            { date: '2025-01-10 09:00', location: 'İstanbul Şişli', description: 'Gönderi hazırlandı', status: 'pending' },
            { date: '2025-01-10 16:00', location: 'İstanbul Şişli', description: 'Kargo yetkilisine teslim edildi', status: 'picked_up' },
            { date: '2025-01-11 10:00', location: 'İstanbul PTT Merkez', description: 'Dağıtım merkezine ulaştı', status: 'in_transit' },
            { date: '2025-01-12 11:00', location: 'İstanbul Fatih', description: 'Dağıtımda', status: 'out_for_delivery' },
            { date: '2025-01-12 15:30', location: 'İstanbul Fatih', description: 'Teslim edildi', status: 'delivered' },
          ],
          cost: 35.00,
        },
        {
          id: 3,
          orderId: 3,
          orderRef: 'ORD-2025-003',
          trackingNumber: 'YI456789123',
          carrier: 'yurtici',
          carrierName: 'Yurtiçi Kargo',
          status: 'out_for_delivery',
          senderName: 'Firma Adı A.Ş.',
          senderAddress: 'Atatürk Cad. No:123, Şişli/İstanbul',
          recipientName: 'Ayşe Demir',
          recipientAddress: 'Bağdat Cad. No:234, Kadıköy/İstanbul',
          recipientPhone: '0542 555 1234',
          weight: 3.0,
          pieces: 3,
          createdAt: '2025-01-14 11:00',
          estimatedDelivery: '2025-01-16',
          lastUpdate: '2025-01-16 08:00',
          events: [
            { date: '2025-01-14 11:00', location: 'İstanbul Şişli', description: 'Gönderi hazırlandı', status: 'pending' },
            { date: '2025-01-14 15:30', location: 'İstanbul Şişli', description: 'Kargo yetkilisine teslim edildi', status: 'picked_up' },
            { date: '2025-01-15 09:00', location: 'İstanbul Hub', description: 'Dağıtım merkezine ulaştı', status: 'in_transit' },
            { date: '2025-01-16 08:00', location: 'İstanbul Kadıköy', description: 'Dağıtımda', status: 'out_for_delivery' },
          ],
          cost: 55.00,
        },
        {
          id: 4,
          orderId: 4,
          orderRef: 'ORD-2025-004',
          trackingNumber: 'UP789123456',
          carrier: 'ups',
          carrierName: 'UPS',
          status: 'failed',
          senderName: 'Firma Adı A.Ş.',
          senderAddress: 'Atatürk Cad. No:123, Şişli/İstanbul',
          recipientName: 'Mustafa Özkan',
          recipientAddress: 'Cevizli Mah. No:56, Maltepe/İstanbul',
          recipientPhone: '0536 444 5678',
          weight: 5.0,
          pieces: 1,
          createdAt: '2025-01-12 08:00',
          lastUpdate: '2025-01-14 12:00',
          events: [
            { date: '2025-01-12 08:00', location: 'İstanbul Şişli', description: 'Gönderi hazırlandı', status: 'pending' },
            { date: '2025-01-12 14:00', location: 'İstanbul Şişli', description: 'Kargo yetkilisine teslim edildi', status: 'picked_up' },
            { date: '2025-01-13 16:00', location: 'İstanbul UPS Merkez', description: 'Dağıtım merkezine ulaştı', status: 'in_transit' },
            { date: '2025-01-14 10:00', location: 'İstanbul Maltepe', description: 'Dağıtımda', status: 'out_for_delivery' },
            { date: '2025-01-14 12:00', location: 'İstanbul Maltepe', description: 'Teslim edilemedi - Alıcı adreste yok', status: 'failed' },
          ],
          cost: 85.00,
        },
      ];

      setShipments(mockShipments);
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

  const filteredShipments = shipments.filter(s => {
    const matchesSearch =
      s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.orderRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.recipientPhone.includes(searchQuery);
    const matchesStatus = !statusFilter || s.status === statusFilter;
    const matchesCarrier = !carrierFilter || s.carrier === carrierFilter;
    return matchesSearch && matchesStatus && matchesCarrier;
  });

  const handleViewDetails = (shipment: CargoShipment) => {
    setSelectedShipment(shipment);
    setShowModal(true);
  };

  const handleCreateShipment = () => {
    if (!createForm.orderId || !createForm.recipientName || !createForm.recipientPhone) {
      alert('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    const order = orders.find(o => o.id === parseInt(createForm.orderId));
    if (!order) {
      alert('Sipariş bulunamadı');
      return;
    }

    const newShipment: CargoShipment = {
      id: Date.now(),
      orderId: parseInt(createForm.orderId),
      orderRef: order.ref,
      trackingNumber: `${createForm.carrier.substring(0, 2).toUpperCase()}${Date.now().toString().slice(-9)}`,
      carrier: createForm.carrier,
      carrierName: carrierNames[createForm.carrier],
      status: 'pending',
      senderName: 'Firma Adı A.Ş.',
      senderAddress: 'Atatürk Cad. No:123, Şişli/İstanbul',
      recipientName: createForm.recipientName,
      recipientAddress: createForm.recipientAddress,
      recipientPhone: createForm.recipientPhone,
      weight: parseFloat(createForm.weight),
      pieces: parseInt(createForm.pieces),
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      lastUpdate: new Date().toISOString().slice(0, 16).replace('T', ' '),
      events: [
        {
          date: new Date().toISOString().slice(0, 16).replace('T', ' '),
          location: 'İstanbul Şişli',
          description: 'Gönderi oluşturuldu',
          status: 'pending'
        }
      ],
      cost: 40 + Math.random() * 30,
    };

    setShipments(prev => [...prev, newShipment]);
    setShowCreateModal(false);
    setCreateForm({
      orderId: '',
      carrier: 'aras',
      recipientName: '',
      recipientPhone: '',
      recipientAddress: '',
      weight: '1',
      pieces: '1',
    });
    alert('Kargo gönderisi oluşturuldu');
  };

  const getStatusBadge = (status: CargoStatus) => {
    return <Badge variant={statusColors[status] as 'success' | 'warning' | 'danger' | 'gray' | 'blue'}>{statusLabels[status]}</Badge>;
  };

  const stats = {
    total: shipments.length,
    inTransit: shipments.filter(s => ['in_transit', 'out_for_delivery', 'picked_up'].includes(s.status)).length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    failed: shipments.filter(s => ['failed', 'returned'].includes(s.status)).length,
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
          <p className="text-gray-500">Kargo takip yükleniyor...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kargo Takip</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gönderi takibi ve kargo yönetimi
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Package className="w-4 h-4" />
            Yeni Gönderi
          </Button>
        </div>
      </div>

      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Toplam Gönderi</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Yolda</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inTransit}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Teslim Edildi</p>
              <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sorunlu</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Takip no, sipariş no veya alıcı ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as CargoStatus | '')}
            options={[
              { value: '', label: 'Tüm Durumlar' },
              ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))
            ]}
            className="w-full sm:w-48"
          />
          <Select
            value={carrierFilter}
            onChange={(value) => setCarrierFilter(value as Carrier | '')}
            options={[
              { value: '', label: 'Tüm Kargo Firmaları' },
              ...Object.entries(carrierNames).map(([value, label]) => ({ value, label }))
            ]}
            className="w-full sm:w-48"
          />
          <Button variant="secondary">
            <RefreshCw className="w-4 h-4" />
            Yenile
          </Button>
        </div>
      </Card>

      {/* Shipments Table */}
      <Card>
        <Table
          data={filteredShipments}
          columns={[
            {
              key: 'trackingNumber',
              header: 'Takip No',
              render: (value) => (
                <span className="font-mono font-medium text-primary">{value as string}</span>
              ),
            },
            { key: 'orderRef', header: 'Sipariş' },
            {
              key: 'carrier',
              header: 'Kargo Firması',
              render: (value, record) => {
                const shipment = record as CargoShipment;
                return (
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-400" />
                    {shipment.carrierName}
                  </div>
                );
              },
            },
            {
              key: 'recipientName',
              header: 'Alıcı',
              render: (value, record) => {
                const shipment = record as CargoShipment;
                return (
                  <div>
                    <div className="font-medium">{value as string}</div>
                    <div className="text-xs text-gray-500">{shipment.recipientPhone}</div>
                  </div>
                );
              },
            },
            {
              key: 'status',
              header: 'Durum',
              render: (value) => getStatusBadge(value as CargoStatus),
            },
            {
              key: 'createdAt',
              header: 'Tarih',
              render: (value) => formatDate(value as string),
            },
            {
              key: 'cost',
              header: 'Maliyet',
              align: 'right' as const,
              render: (value) => formatCurrency(value as number),
            },
            {
              key: 'actions',
              header: '',
              render: (_, record) => {
                const shipment = record as CargoShipment;
                return (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(shipment)}
                      title="Detay"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="SMS Gönder"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                );
              },
            },
          ]}
        />
      </Card>

      {/* Detail Modal */}
      {showModal && selectedShipment && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`Kargo Takip - ${selectedShipment.trackingNumber}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Status Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Güncel Durum</p>
                <p className="text-lg font-bold">{statusLabels[selectedShipment.status]}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Tahmini Teslimat</p>
                <p className="font-medium">
                  {selectedShipment.estimatedDelivery ? formatDate(selectedShipment.estimatedDelivery) : '-'}
                </p>
              </div>
            </div>

            {/* Shipment Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  Gönderici
                </h4>
                <p className="font-medium">{selectedShipment.senderName}</p>
                <p className="text-sm text-gray-600">{selectedShipment.senderAddress}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Alıcı
                </h4>
                <p className="font-medium">{selectedShipment.recipientName}</p>
                <p className="text-sm text-gray-600">{selectedShipment.recipientAddress}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" />
                  {selectedShipment.recipientPhone}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="font-medium mb-4">Kargo Hareketleri</h4>
              <div className="space-y-4">
                {selectedShipment.events.slice().reverse().map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        event.status === 'delivered' ? 'bg-green-500' :
                        event.status === 'failed' ? 'bg-red-500' :
                        'bg-blue-500'
                      )} />
                      {index < selectedShipment.events.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium text-sm">{event.description}</p>
                      <p className="text-xs text-gray-500">{event.location}</p>
                      <p className="text-xs text-gray-400">{event.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Kapat
              </Button>
              <Button variant="secondary">
                <Send className="w-4 h-4" />
                SMS Gönder
              </Button>
              <Button>
                <Download className="w-4 h-4" />
                Etiket Yazdır
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Yeni Kargo Gönderisi"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sipariş <span className="text-danger">*</span>
              </label>
              <Select
                value={createForm.orderId}
                onChange={(value) => setCreateForm(prev => ({ ...prev, orderId: value }))}
                options={orders.map(o => ({
                  value: String(o.id),
                  label: `${o.ref} - ${formatCurrency(o.total_ttc || 0)}`
                }))}
                placeholder="Sipariş seçin"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kargo Firması
                </label>
                <Select
                  value={createForm.carrier}
                  onChange={(value) => setCreateForm(prev => ({ ...prev, carrier: value as Carrier }))}
                  options={Object.entries(carrierNames).map(([value, label]) => ({ value, label }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alıcı Adı <span className="text-danger">*</span>
                </label>
                <Input
                  value={createForm.recipientName}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, recipientName: e.target.value }))}
                  placeholder="Alıcı adı"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon <span className="text-danger">*</span>
                </label>
                <Input
                  value={createForm.recipientPhone}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, recipientPhone: e.target.value }))}
                  placeholder="0532 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres
                </label>
                <Input
                  value={createForm.recipientAddress}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, recipientAddress: e.target.value }))}
                  placeholder="Teslimat adresi"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ağırlık (kg)
                </label>
                <Input
                  type="number"
                  value={createForm.weight}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, weight: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parça Sayısı
                </label>
                <Input
                  type="number"
                  value={createForm.pieces}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, pieces: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              İptal
            </Button>
            <Button onClick={handleCreateShipment}>
              <Package className="w-4 h-4" />
              Gönderi Oluştur
            </Button>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}
