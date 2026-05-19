import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
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
  Menu,
  Search,
  Bell as BellIcon,
  User,
  ChevronDown,
  LogOut,
  HelpCircle,
  X
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';

// Navigation items - grouped by category
const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'musteriler', label: 'Müşteriler', icon: Users, path: '/musteriler' },
  { id: 'urunler', label: 'Ürünler', icon: Package, path: '/urunler' },
  { id: 'siparisler', label: 'Siparişler', icon: ShoppingCart, path: '/siparisler' },
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

const currentUser = {
  name: 'Ahmet Yılmaz',
  email: 'ahmet@firma.com',
  role: 'Yönetici',
  avatar: null,
};

const notifications = [
  { id: '1', title: 'Yeni Sipariş', message: 'ABC Ticaret yeni bir sipariş oluşturdu', time: '5 dk önce', read: false },
  { id: '2', title: 'Stok Uyarısı', message: 'Ürün-X kritik stok seviyesinde', time: '1 saat önce', read: false },
  { id: '3', title: 'Fatura Ödendi', message: 'XYZ Ltd. faturası ödendi', time: '2 saat önce', read: true },
];

interface MainLayoutProps {
  children?: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 h-16 bg-white/95 backdrop-blur-lg border-b border-slate-200/60">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left side - Logo and Nav Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm shadow-teal-500/20">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-base leading-tight">Dolibarr</span>
                <span className="text-teal-600 font-semibold text-sm">Panel</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 ml-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                      'cursor-pointer',
                      active
                        ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-sm shadow-teal-500/20'
                        : 'text-slate-600 hover:bg-slate-100',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden sm:block">
              {searchOpen ? (
                <div className="flex items-center gap-2 animate-fade-in">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ara..."
                      className="w-56 md:w-80 h-10 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                    className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden md:inline">Ara...</span>
                  <span className="hidden md:flex items-center gap-1 ml-4 text-xs text-slate-400">
                    <kbd className="px-1.5 py-0.5 rounded-lg bg-slate-200 border border-slate-300 font-medium">Ctrl</kbd>
                    <kbd className="px-1.5 py-0.5 rounded-lg bg-slate-200 border border-slate-300 font-medium">K</kbd>
                  </span>
                </button>
              )}
            </div>

            {/* Collapse button - Desktop */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
            >
              {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden animate-scale-in">
                  <div className="p-4 border-b border-slate-100/60">
                    <h3 className="font-semibold text-slate-900">Bildirimler</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          'p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer',
                          !notification.read && 'bg-teal-50/30'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0',
                            notification.read ? 'bg-slate-300' : 'bg-teal-500'
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-900">{notification.title}</p>
                            <p className="text-sm text-slate-500 mt-0.5 truncate">{notification.message}</p>
                            <p className="text-xs text-slate-400 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-slate-100/60 bg-slate-50/50">
                    <button className="w-full py-2.5 text-sm text-teal-600 hover:bg-teal-50 rounded-xl font-medium transition-colors cursor-pointer">
                      Tüm bildirimleri gör
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm shadow-teal-500/20">
                  {getInitials(currentUser.name)}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
                  <p className="text-xs text-slate-500">{currentUser.role}</p>
                </div>
                <ChevronDown className="hidden md:block w-4 h-4 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden animate-scale-in">
                  <div className="p-4 border-b border-slate-100/60">
                    <p className="font-semibold text-slate-900">{currentUser.name}</p>
                    <p className="text-sm text-slate-500">{currentUser.email}</p>
                  </div>
                  <div className="py-2">
                    <Link
                      to="/ayarlar/profil"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      Profilim
                    </Link>
                    <Link
                      to="/ayarlar"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Ayarlar
                    </Link>
                    <Link
                      to="/yardim"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <HelpCircle className="w-4 h-4" />
                      Yardım
                    </Link>
                  </div>
                  <div className="py-2 border-t border-slate-100/60">
                    <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                      <LogOut className="w-4 h-4" />
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Navigation Menu */}
      <div className={cn(
        'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-slate-200/60 z-50 transition-all duration-300 ease-out overflow-y-auto',
        'lg:hidden w-72',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <nav className="p-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150',
                    'cursor-pointer',
                    active
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-sm shadow-teal-500/20'
                      : 'text-slate-600 hover:bg-slate-100',
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content Area - Full Width */}
      <main className="min-h-[calc(100vh-4rem)]">
        <div className="p-4 sm:p-6 lg:p-8">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}

export default MainLayout;