import { useState, useEffect, useCallback } from 'react';
import { Warehouse, Plus, Edit2, Trash2, MapPin, Package, AlertTriangle, Search, Eye, ArrowLeftRight, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, Button, Input, Select, Table, Badge, Modal } from '@/components/ui';
import { warehouseApi, productApi, stockApi } from '@/lib/dolibarr';
import type { Warehouse as WarehouseType, StockMovement } from '@/lib/types/dolibarr';

export default function Depolar() {
  const [depolar, setDepolar] = useState<WarehouseType[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    manager: '',
  });

  // Fetch warehouses
  const fetchDepolar = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await warehouseApi.list();
      setDepolar(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Depolar yüklenirken hata oluştu');
      console.error('Depolar fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch stock movements
  const fetchStockMovements = useCallback(async (warehouseId?: number) => {
    try {
      const params = warehouseId ? { warehouse_id: warehouseId, limit: 100 } : { limit: 100 };
      const data = await stockApi.listMovements(params);
      setStockMovements(data);
    } catch (err) {
      console.error('Stock movements fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchDepolar();
    fetchStockMovements();
  }, [fetchDepolar, fetchStockMovements]);

  // Filter warehouses
  const filteredDepolar = depolar.filter(depo =>
    depo.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    depo.ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    depo.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats from real data
  const totalDepo = depolar.length;
  const totalStok = stockMovements.reduce((sum, m) => sum + (m.qty || m.quantity || 0), 0);
  const kritikStok = 0; // Will be calculated when stock API provides min/max info

  // Open new warehouse modal
  const handleNewWarehouse = () => {
    setIsEditing(false);
    setFormData({ name: '', code: '', address: '', phone: '', manager: '' });
    setShowWarehouseModal(true);
  };

  // Open edit warehouse modal
  const handleEditWarehouse = (depo: WarehouseType) => {
    setIsEditing(true);
    setSelectedWarehouse(depo);
    setFormData({
      name: depo.label || '',
      code: depo.ref || '',
      address: depo.address || '',
      phone: '',
      manager: '',
    });
    setShowWarehouseModal(true);
  };

  // Open stock detail modal
  const handleViewStock = (depo: WarehouseType) => {
    setSelectedWarehouse(depo);
    setShowStockModal(true);
  };

  // Get stock movements for selected warehouse
  const getWarehouseStock = (warehouseId: number) => {
    return stockMovements.filter(m => m.fk_entrepot === warehouseId);
  };

  // Save warehouse (create new)
  const handleSaveWarehouse = async () => {
    if (isEditing && selectedWarehouse) {
      // Update existing warehouse - would need PUT endpoint
      alert('Depo güncelleme yakında eklenecek');
      setShowWarehouseModal(false);
    } else {
      // Create new warehouse
      alert('Yeni depo oluşturma yakında eklenecek (API desteği gerekiyor)');
      setShowWarehouseModal(false);
    }
  };

  // Delete warehouse
  const handleDeleteWarehouse = async (depoId: number) => {
    if (confirm('Bu depoyu silmek istediğinizden emin misiniz?')) {
      try {
        // Dolibarr API doesn't have delete for warehouses, so we just show message
        alert('Depo silme Dolibarr API tarafından desteklenmiyor');
      } catch (err) {
        console.error('Delete warehouse error:', err);
      }
    }
  };

  // Format warehouse data for table
  const warehouseTableData = filteredDepolar.map(depo => ({
    ...depo,
    code: depo.ref || '-',
    name: depo.label || '-',
    address: depo.address || '-',
    manager: '-',
    productCount: getWarehouseStock(depo.id || 0).length,
    stockCount: getWarehouseStock(depo.id || 0).reduce((sum, m) => sum + (m.qty || m.quantity || 0), 0),
    isActive: true, // Dolibarr warehouses don't have isActive flag in basic API
    minStockAlert: false,
  }));

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Depo Yönetimi</h1>
          <p className="page-subtitle">Depolarınızı ve stok durumlarınızı yönetin</p>
        </div>
        <Button variant="primary" onClick={handleNewWarehouse}>
          <Plus className="w-4 h-4" />
          Yeni Depo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Toplam Depo</p>
              <p className="text-2xl font-bold">{isLoading ? '-' : totalDepo}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Toplam Stok</p>
              <p className="text-2xl font-bold">{isLoading ? '-' : totalStok.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Kritik Stok</p>
              <p className="text-2xl font-bold">-</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Aktif Depo</p>
              <p className="text-2xl font-bold">{isLoading ? '-' : totalDepo}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Depo ara (ad, kod veya adres)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <div className="p-4 flex items-center gap-3 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading ? (
        <Card>
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-gray-500">Depolar yükleniyor...</p>
          </div>
        </Card>
      ) : (
        /* Warehouse List */
        <Card>
          <Table
            columns={[
              {
                key: 'code',
                header: 'Depo Kodu',
                render: (value) => <span className="font-mono font-medium">{value as string}</span>,
              },
              {
                key: 'name',
                header: 'Depo Adı',
                render: (value) => <span className="font-medium">{value as string}</span>,
              },
              {
                key: 'address',
                header: 'Adres',
                render: (value) => <span className="text-sm text-gray-600">{value as string}</span>,
              },
              {
                key: 'manager',
                header: 'Yönetici',
                render: (value) => <span>{value as string}</span>,
              },
              {
                key: 'productCount',
                header: 'Ürün Sayısı',
                render: (value) => <span className="font-semibold">{value as number}</span>,
              },
              {
                key: 'stockCount',
                header: 'Stok Adedi',
                render: (value) => <span className="font-semibold">{value as number}</span>,
              },
              {
                key: 'isActive',
                header: 'Durum',
                render: () => (
                  <Badge variant="success">Aktif</Badge>
                ),
              },
              {
                key: 'actions',
                header: '',
                render: (_, row) => {
                  const depo = row as unknown as WarehouseType & { stockCount: number };
                  return (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewStock(depo)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditWarehouse(depo)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                },
              },
            ]}
            data={warehouseTableData as unknown as Record<string, unknown>[]}
            emptyMessage="Depo bulunamadı"
          />
        </Card>
      )}

      {/* New/Edit Warehouse Modal */}
      <Modal
        open={showWarehouseModal}
        onClose={() => setShowWarehouseModal(false)}
        title={isEditing ? 'Depo Düzenle' : 'Yeni Depo Ekle'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Bilgi:</strong> Depo oluşturma/güncelleme işlemleri Dolibarr REST API ile gerçekleştirilir.
              Bu özellik için Dolibarr'ın uygun modüllerinin aktif olması gerekmektedir.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Depo Kodu"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="DEP-001"
            />
            <Input
              label="Depo Adı"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ana Depo"
            />
          </div>
          <Input
            label="Adres"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="İkitelli OSB, İstanbul"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Telefon"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0212 549 0000"
            />
            <Input
              label="Yönetici"
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              placeholder="Ahmet Yılmaz"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setShowWarehouseModal(false)}>İptal</Button>
          <Button variant="primary" onClick={handleSaveWarehouse}>
            {isEditing ? 'Güncelle' : 'Ekle'}
          </Button>
        </div>
      </Modal>

      {/* Stock Detail Modal */}
      <Modal
        open={showStockModal}
        onClose={() => setShowStockModal(false)}
        title={`${selectedWarehouse?.label || 'Depo'} - Stok Detayı`}
        size="lg"
      >
        {selectedWarehouse && (
          <div className="space-y-4">
            {/* Warehouse Info */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Depo Kodu</p>
                <p className="font-mono font-medium">{selectedWarehouse.ref || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Depo Adı</p>
                <p className="font-semibold">{selectedWarehouse.label || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Toplam Stok</p>
                <p className="font-semibold">{getWarehouseStock(selectedWarehouse.id || 0).length}</p>
              </div>
            </div>

            {/* Stock List */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Tarih</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Ürün</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Miktar</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Tip</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {getWarehouseStock(selectedWarehouse.id || 0).length > 0 ? (
                    getWarehouseStock(selectedWarehouse.id || 0).slice(0, 10).map((stock, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {stock.datem ? new Date(stock.datem * 1000).toLocaleDateString('tr-TR') : '-'}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {stock.fk_product || stock.product_id ? `Ürün #${stock.fk_product || stock.product_id}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(stock.qty || stock.quantity || 0) > 0 ? (
                            <span className="text-green-600">+{stock.qty || stock.quantity}</span>
                          ) : (
                            <span className="text-red-600">{stock.qty || stock.quantity}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={(stock.type_movement || 0) > 0 ? 'success' : 'warning'}>
                            {(stock.type_movement || 0) > 0 ? 'Giriş' : 'Çıkış'}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        Bu depoya ait stok hareketi bulunamadı
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Transfer Button */}
            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-gray-500">Depolar arası transfer yapmak için:</p>
              <Button variant="secondary" size="sm">
                <ArrowLeftRight className="w-4 h-4" />
                Transfer Yap
              </Button>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setShowStockModal(false)}>Kapat</Button>
        </div>
      </Modal>
    </>
  );
}