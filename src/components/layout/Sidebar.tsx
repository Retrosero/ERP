import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileText,
  Receipt,
  ArrowLeftRight,
  Settings,
  Warehouse,
  ChevronLeft,
  ChevronRight,
  Plus,
  TrendingUp,
  Wallet,
  FileCheck,
  ReceiptIcon,
  BarChart3,
  Shield,
  Building2,
  Send,
  Printer,
  Building,
  Tags,
  Percent,
  Repeat,
  Bell,
  Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'musteriler', label: 'Müşteriler', icon: Users, path: '/musteriler' },
  { id: 'urunler', label: 'Ürünler', icon: Package, path: '/urunler' },
  { id: 'siparisler', label: 'Satış Siparişleri', icon: ShoppingCart, path: '/siparisler' },
  { id: 'teklifler', label: 'Teklifler', icon: FileText, path: '/teklifler' },
  { id: 'faturalar', label: 'Faturalar', icon: Receipt, path: '/faturalar' },
  { id: 'tahsilatlar', label: 'Tahsilat ve Tediye', icon: ArrowLeftRight, path: '/tahsilatlar' },
  { id: 'stok', label: 'Stok Hareketleri', icon: Warehouse, path: '/stok' },
  { id: 'nakit-yonetimi', label: 'Nakit Yönetimi', icon: Wallet, path: '/nakit-yonetimi' },
  { id: 'cek-senet', label: 'Çek ve Senet', icon: FileCheck, path: '/cek-senet' },
  { id: 'giderler', label: 'Giderler', icon: ReceiptIcon, path: '/giderler' },
  { id: 'rapor-merkezi', label: 'Rapor Merkezi', icon: BarChart3, path: '/rapor-merkezi' },
  { id: 'yonetim', label: 'Kullanıcı Yönetimi', icon: Shield, path: '/yonetim' },
  { id: 'sirketler', label: 'Şirketler', icon: Building2, path: '/sirketler' },
  { id: 'e-fatura', label: 'e-Fatura', icon: Send, path: '/e-fatura' },
  { id: 'barkod-baski', label: 'Barkod Baskı', icon: Printer, path: '/barkod-baski' },
  { id: 'depolar', label: 'Depolar', icon: Building, path: '/depolar' },
  { id: 'fiyat-listeleri', label: 'Fiyat Listeleri', icon: Tags, path: '/fiyat-listeleri' },
  { id: 'kar-marji-analizi', label: 'Kar Marjı Analizi', icon: Percent, path: '/kar-marji-analizi' },
  { id: 'tekrar-eden-siparisler', label: 'Tekrar Eden Siparişler', icon: Repeat, path: '/tekrar-eden-siparisler' },
  { id: 'bildirimler', label: 'Bildirimler', icon: Bell, path: '/bildirimler' },
  { id: 'termal-baski', label: 'Termal Baskı', icon: Printer, path: '/termal-baski' },
  { id: 'kargo-takip', label: 'Kargo Takip', icon: Truck, path: '/kargo-takip' },
];

const settingsItems = [{ id: 'ayarlar', label: 'Ayarlar', icon: Settings, path: '/ayarlar' }];

const quickActions = [
  { label: 'Yeni Sipariş', icon: Plus, path: '/siparisler/yeni', color: 'text-blue-600' },
  { label: 'Yeni Teklif', icon: FileText, path: '/teklifler/yeni', color: 'text-green-600' },
  { label: 'Hızlı Satış', icon: TrendingUp, path: '/hizli-satis', color: 'text-purple-600' },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ collapsed = false, onCollapsedChange, mobileOpen = false, onMobileClose }: SidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onMobileClose} />}

      <aside
        className={cn(
          'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-50 transition-all duration-300 flex flex-col',
          collapsed ? 'w-16' : 'w-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            {!collapsed && (
              <div>
                <span className="font-bold text-gray-900 text-sm">Dolibarr</span>
                <span className="text-primary font-bold text-sm ml-1">Panel</span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    active ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? item.label : undefined}
                  onClick={onMobileClose}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>

          {!collapsed && (
            <div className="pt-4 mt-4 border-t border-gray-100">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Hızlı İşlemler</p>
              <div className="space-y-1">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.path}
                      to={action.path}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
                      onClick={onMobileClose}
                    >
                      <Icon className={cn('w-5 h-5 flex-shrink-0', action.color)} />
                      <span>{action.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-4 mt-4 border-t border-gray-100">
            {settingsItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    active ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? item.label : undefined}
                  onClick={onMobileClose}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="hidden lg:flex border-t border-gray-100 p-2">
          <button
            onClick={() => onCollapsedChange?.(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;