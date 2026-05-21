import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, Minus, ShoppingBag, X, User, CreditCard,
  Banknote, Trash2, Send, Barcode, QrCode, CheckCircle, Loader2
} from 'lucide-react';
import { Card, Button, Input, Select, Table, Badge, Modal } from '@/components/ui';
import { cn } from '@/lib/utils';
import { productApi, thirdPartyApi } from '@/lib/dolibarr';
import type { Product, ThirdParty } from '@/lib/types/dolibarr';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function HizliSatis() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<ThirdParty | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<ThirdParty[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load products and customers from Dolibarr
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        const [productsRes, customersRes] = await Promise.all([
          productApi.list({ limit: 100 }),
          thirdPartyApi.list({ limit: 100 })
        ]);
        
        setProducts(productsRes);
        setCustomers(customersRes.filter(c => c.client === 1));
      } catch (err: any) {
        console.error('Failed to load data:', err);
        setError(err.message || 'Veriler yüklenemedi');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Filter products by search
  const filteredProducts = products.filter(p =>
    p.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.ref?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.includes(searchQuery)
  );

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => {
    const price = item.product.price_ttc || item.product.price || 0;
    return sum + (price * item.quantity);
  }, 0);
  const tax = subtotal * 0.20; // 20% KDV
  const total = subtotal + tax;

  // Add to cart
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Update quantity
  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return item;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  // Remove from cart
  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Complete sale
  const completeSale = () => {
    setCompleted(true);
    setTimeout(() => {
      setCart([]);
      setSelectedCustomer(null);
      setCompleted(false);
      setShowPaymentModal(false);
    }, 3000);
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-gray-500">Ürünler yükleniyor...</span>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <Button 
            variant="secondary" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Tekrar Dene
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Hızlı Satış</h1>
          <p className="page-subtitle">Sipariş oluşturmak için ürün seçin</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowCustomerModal(true)}>
            <User className="w-4 h-4" />
            {selectedCustomer ? selectedCustomer.name : 'Müşteri Seç'}
          </Button>
          <Link to="/siparisler">
            <Button variant="ghost">
              <ShoppingBag className="w-4 h-4" />
              Siparişler
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <Card>
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ürün adı veya referans numarası ile arayın..."
                  className="w-full h-12 pl-12 pr-4 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-400">
                <p>Ürün bulunamadı</p>
              </div>
            ) : (
              filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary hover:shadow-md transition-all cursor-pointer"
                  onClick={() => addToCart(product)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-gray-400 font-mono">{product.ref}</span>
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full',
                      (product.stock_reel || 0) > 10 ? 'bg-green-100 text-green-700' :
                      (product.stock_reel || 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    )}>
                      {product.stock_reel || 0} adet
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">{product.label}</h3>
                  <p className="text-lg font-bold text-primary">
                    {(product.price_ttc || product.price || 0).toLocaleString('tr-TR')} ₺
                  </p>
                  <button className="w-full mt-3 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Ekle
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Barcode Scanner */}
          <Card>
            <div className="p-4 flex items-center gap-4">
              <div className="flex-1 relative">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Barkod numarasını girin veya tarayın..."
                  className="w-full h-12 pl-12 pr-4 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="secondary">
                <QrCode className="w-4 h-4" />
                Tarayıcı
              </Button>
            </div>
          </Card>
        </div>

        {/* Cart */}
        <div className="space-y-4">
          <Card>
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Sepet
                </h2>
                <Badge variant="gray">{cart.length} ürün</Badge>
              </div>
            </div>

            {/* Cart Items */}
            <div className="p-4 max-h-80 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Sepetiniz boş</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => {
                    const price = item.product.price_ttc || item.product.price || 0;
                    return (
                      <div key={item.product.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.product.label}</p>
                          <p className="text-sm text-gray-500">
                            {price.toLocaleString('tr-TR')} ₺ x {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="w-7 h-7 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Totals */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Ara Toplam</span>
                  <span>{subtotal.toLocaleString('tr-TR')} ₺</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>KDV (%20)</span>
                  <span>{tax.toLocaleString('tr-TR')} ₺</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Toplam</span>
                  <span className="text-primary">{total.toLocaleString('tr-TR')} ₺</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-4 border-t border-gray-100">
              <Button
                variant="primary"
                className="w-full"
                size="lg"
                disabled={cart.length === 0}
                onClick={() => setShowPaymentModal(true)}
              >
                <CreditCard className="w-5 h-5" />
                Ödemeye Geç
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Customer Selection Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Müşteri Seç"
        size="md"
      >
        <div className="space-y-4">
          <Input
            placeholder="Müşteri ara..."
            className="w-full"
          />
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {customers.length === 0 ? (
              <p className="text-center text-gray-400 py-4">Müşteri bulunamadı</p>
            ) : (
              customers.map(customer => (
                <div
                  key={customer.id}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-all',
                    selectedCustomer?.id === customer.id
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerModal(false);
                  }}
                >
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-500">{customer.code_client || customer.customer_code}</p>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setShowCustomerModal(false)}>
              İptal
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Ödeme Seçenekleri"
        size="md"
      >
        {completed ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ödeme Tamamlandı!</h3>
            <p className="text-gray-500">Siparişiniz başarıyla oluşturuldu.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Customer Info */}
            {selectedCustomer && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Müşteri</p>
                <p className="font-medium">{selectedCustomer.name}</p>
              </div>
            )}

            {/* Total */}
            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-700">Ödenecek Tutar</span>
                <span className="text-2xl font-bold text-primary">
                  {total.toLocaleString('tr-TR')} ₺
                </span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all',
                  paymentMethod === 'cash'
                    ? 'border-primary bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <Banknote className={cn(
                  'w-8 h-8 mx-auto mb-2',
                  paymentMethod === 'cash' ? 'text-primary' : 'text-gray-400'
                )} />
                <p className="font-medium text-center">Nakit</p>
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all',
                  paymentMethod === 'card'
                    ? 'border-primary bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <CreditCard className={cn(
                  'w-8 h-8 mx-auto mb-2',
                  paymentMethod === 'card' ? 'text-primary' : 'text-gray-400'
                )} />
                <p className="font-medium text-center">Kredi Kartı</p>
              </button>
              <button
                onClick={() => setPaymentMethod('transfer')}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all',
                  paymentMethod === 'transfer'
                    ? 'border-primary bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <Send className={cn(
                  'w-8 h-8 mx-auto mb-2',
                  paymentMethod === 'transfer' ? 'text-primary' : 'text-gray-400'
                )} />
                <p className="font-medium text-center">Havale/EFT</p>
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowPaymentModal(false)}
              >
                İptal
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={completeSale}
              >
                <CheckCircle className="w-4 h-4" />
                Ödemeyi Tamamla
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}