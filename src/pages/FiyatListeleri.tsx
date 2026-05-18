import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, Edit2, Trash2, Copy, DollarSign,
  Users, Package, ChevronDown, ChevronRight, Loader2, AlertTriangle
} from 'lucide-react';
import { MainLayout } from '@/components/layout';
import {
  Card, CardHeader, CardTitle, Button, Input, Select,
  Badge, Table, Pagination, Alert, Modal
} from '@/components/ui';
import { formatCurrency, cn } from '@/lib/utils';
import { thirdPartyApi, productApi } from '@/lib/dolibarr';
import type { ThirdParty, Product } from '@/lib/types/dolibarr';

// Price list types
interface PriceListItem {
  id: string;
  productId: number;
  productRef: string;
  productName: string;
  basePrice: number;
  customerPrice: number;
  margin: number;
  marginPercent: number;
}

interface PriceList {
  id: number;
  name: string;
  description: string;
  customerGroupId?: number;
  customerGroupName?: string;
  items: PriceListItem[];
  isActive: boolean;
}

// Customer groups from Dolibarr typent
const customerGroups = [
  { id: 0, label: 'Tüm Müşteriler' },
  { id: 1, label: 'Otomotiv' },
  { id: 2, label: 'Gıda' },
  { id: 3, label: 'Perakende' },
  { id: 4, label: 'Toptancı' },
  { id: 5, label: 'Hizmet' },
];

export default function FiyatListeleri() {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingList, setEditingList] = useState<PriceList | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set());

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customerGroupId: '0',
  });
  const [priceItems, setPriceItems] = useState<PriceListItem[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const productData = await productApi.list({ limit: 100 });
      setProducts(productData);

      // Mock price lists (in real app, would come from Dolibarr)
      const mockPriceLists: PriceList[] = [
        {
          id: 1,
          name: 'Toptancı Fiyat Listesi',
          description: 'Toptan satış müşterileri için özel fiyatlar',
          customerGroupId: 4,
          customerGroupName: 'Toptancı',
          isActive: true,
          items: [
            { id: '1', productId: 1, productRef: 'PRD001', productName: 'Ürün A', basePrice: 100, customerPrice: 85, margin: 15, marginPercent: 15 },
            { id: '2', productId: 2, productRef: 'PRD002', productName: 'Ürün B', basePrice: 200, customerPrice: 170, margin: 30, marginPercent: 15 },
            { id: '3', productId: 3, productRef: 'PRD003', productName: 'Ürün C', basePrice: 150, customerPrice: 127.5, margin: 22.5, marginPercent: 15 },
          ],
        },
        {
          id: 2,
          name: 'VIP Müşteri Listesi',
          description: 'Özel müşteriler için indirimli fiyatlar',
          customerGroupId: 5,
          customerGroupName: 'Hizmet',
          isActive: true,
          items: [
            { id: '4', productId: 1, productRef: 'PRD001', productName: 'Ürün A', basePrice: 100, customerPrice: 90, margin: 10, marginPercent: 10 },
            { id: '5', productId: 2, productRef: 'PRD002', productName: 'Ürün B', basePrice: 200, customerPrice: 180, margin: 20, marginPercent: 10 },
          ],
        },
      ];
      setPriceLists(mockPriceLists);
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

  const toggleList = (listId: number) => {
    setExpandedLists((prev) => {
      const newSet = new Set(prev);
      const key = String(listId);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleCreateNew = () => {
    setEditingList(null);
    setFormData({ name: '', description: '', customerGroupId: '0' });
    setPriceItems([]);
    setShowModal(true);
  };

  const handleEdit = (list: PriceList) => {
    setEditingList(list);
    setFormData({
      name: list.name,
      description: list.description,
      customerGroupId: String(list.customerGroupId || 0),
    });
    setPriceItems(list.items);
    setShowModal(true);
  };

  const handleDelete = (listId: number) => {
    if (confirm('Bu fiyat listesini silmek istediğinizden emin misiniz?')) {
      setPriceLists((prev) => prev.filter((l) => l.id !== listId));
    }
  };

  const handleDuplicate = (list: PriceList) => {
    const newList: PriceList = {
      ...list,
      id: Date.now(),
      name: `${list.name} (Kopya)`,
      items: list.items.map((item) => ({ ...item, id: String(Date.now() + Math.random()) })),
    };
    setPriceLists((prev) => [...prev, newList]);
  };

  const addPriceItem = () => {
    setPriceItems((prev) => [
      ...prev,
      { id: String(Date.now()), productId: 0, productRef: '', productName: '', basePrice: 0, customerPrice: 0, margin: 0, marginPercent: 0 },
    ]);
  };

  const handleProductSelect = (itemId: string, productId: string) => {
    const product = products.find((p) => p.id === parseInt(productId));
    if (product) {
      setPriceItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                productId: product.id || 0,
                productRef: product.ref || '',
                productName: product.label || '',
                basePrice: product.price || 0,
              }
            : item
        )
      );
    }
  };

  const handlePriceChange = (itemId: string, field: 'customerPrice' | 'marginPercent', value: number) => {
    setPriceItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          if (field === 'customerPrice') {
            const margin = item.basePrice - value;
            const marginPercent = item.basePrice > 0 ? (margin / item.basePrice) * 100 : 0;
            return { ...item, customerPrice: value, margin, marginPercent };
          } else {
            const customerPrice = item.basePrice * (1 - value / 100);
            const margin = item.basePrice - customerPrice;
            return { ...item, marginPercent: value, customerPrice, margin };
          }
        }
        return item;
      })
    );
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Lütfen liste adı girin');
      return;
    }

    const newList: PriceList = {
      id: editingList?.id || Date.now(),
      name: formData.name,
      description: formData.description,
      customerGroupId: parseInt(formData.customerGroupId),
      customerGroupName: customerGroups.find((g) => g.id === parseInt(formData.customerGroupId))?.label,
      isActive: true,
      items: priceItems.filter((item) => item.productId > 0),
    };

    if (editingList) {
      setPriceLists((prev) => prev.map((l) => (l.id === editingList.id ? newList : l)));
    } else {
      setPriceLists((prev) => [...prev, newList]);
    }

    setShowModal(false);
  };

  const filteredLists = priceLists.filter((list) =>
    list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    list.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="success">Aktif</Badge>
    ) : (
      <Badge variant="gray">Pasif</Badge>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
          <p className="text-gray-500">Fiyat listeleri yükleniyor...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fiyat Listeleri</h1>
            <p className="text-sm text-gray-500 mt-1">
              Müşteri gruplarına özel fiyatlar oluşturun ve yönetin
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4" />
            Yeni Fiyat Listesi
          </Button>
        </div>
      </div>

      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Search */}
      <Card className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Fiyat listesi ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Price Lists */}
      <div className="space-y-4">
        {filteredLists.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Fiyat listesi bulunamadı</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'Arama kriterlerinize uygun fiyat listesi yok.' : 'Henüz fiyat listesi oluşturulmamış.'}
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="w-4 h-4" />
                Yeni Fiyat Listesi Oluştur
              </Button>
            </div>
          </Card>
        ) : (
          filteredLists.map((list) => (
            <Card key={list.id}>
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleList(list.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedLists.has(String(list.id)) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{list.name}</h3>
                      {getStatusBadge(list.isActive)}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{list.description}</p>
                    {list.customerGroupName && (
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{list.customerGroupName}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {list.items.length} ürün
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(list)}
                      title="Kopyala"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(list)}
                      title="Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(list.id)}
                      title="Sil"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded Items */}
              {expandedLists.has(String(list.id)) && list.items.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <Table
                    data={list.items}
                    columns={[
                      {
                        key: 'productRef',
                        header: 'Referans',
                        render: (value) => <span className="font-mono text-sm">{value as string}</span>,
                      },
                      {
                        key: 'productName',
                        header: 'Ürün',
                      },
                      {
                        key: 'basePrice',
                        header: 'Liste Fiyatı',
                        align: 'right' as const,
                        render: (value) => formatCurrency(value as number),
                      },
                      {
                        key: 'customerPrice',
                        header: 'Özel Fiyat',
                        align: 'right' as const,
                        render: (value) => (
                          <span className="font-semibold text-primary">{formatCurrency(value as number)}</span>
                        ),
                      },
                      {
                        key: 'margin',
                        header: 'Marj',
                        align: 'right' as const,
                        render: (value, record) => {
                          const item = record as PriceListItem;
                          return (
                            <span className={item.margin > 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(value as number)} ({item.marginPercent.toFixed(1)}%)
                            </span>
                          );
                        },
                      },
                    ]}
                  />
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingList ? 'Fiyat Listesini Düzenle' : 'Yeni Fiyat Listesi'}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Liste Adı <span className="text-danger">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="örn: Toptancı Fiyat Listesi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Liste açıklaması..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Müşteri Grubu
              </label>
              <Select
                value={formData.customerGroupId}
                onChange={(value) => setFormData((prev) => ({ ...prev, customerGroupId: value }))}
                options={customerGroups.map((g) => ({ value: String(g.id), label: g.label }))}
              />
            </div>

            {/* Price Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Fiyat Kalemleri</label>
                <Button variant="secondary" size="sm" onClick={addPriceItem}>
                  <Plus className="w-4 h-4" />
                  Ürün Ekle
                </Button>
              </div>
              <div className="space-y-2">
                {priceItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Select
                        value={String(item.productId)}
                        onChange={(value) => handleProductSelect(item.id, value)}
                        options={products.map((p) => ({
                          value: String(p.id),
                          label: `${p.ref} - ${p.label}`,
                        }))}
                        placeholder="Ürün seçin"
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        value={item.customerPrice || ''}
                        onChange={(e) => handlePriceChange(item.id, 'customerPrice', parseFloat(e.target.value) || 0)}
                        placeholder="Fiyat"
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        value={item.marginPercent || ''}
                        onChange={(e) => handlePriceChange(item.id, 'marginPercent', parseFloat(e.target.value) || 0)}
                        placeholder="%"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPriceItems((prev) => prev.filter((i) => i.id !== item.id))}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                {priceItems.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Henüz ürün eklenmemiş. "Ürün Ekle" butonuna tıklayın.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              İptal
            </Button>
            <Button onClick={handleSave}>
              {editingList ? 'Kaydet' : 'Oluştur'}
            </Button>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}