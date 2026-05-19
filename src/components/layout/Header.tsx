import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Bell,
  User,
  Menu,
  ChevronDown,
  LogOut,
  Settings,
  HelpCircle,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
  sidebarCollapsed?: boolean;
}

// Mock user data
const currentUser = {
  name: 'Ahmet Yılmaz',
  email: 'ahmet@firma.com',
  role: 'Yönetici',
  avatar: null,
};

// Mock notifications
const notifications = [
  { id: '1', title: 'Yeni Sipariş', message: 'ABC Ticaret yeni bir sipariş oluşturdu', time: '5 dk önce', read: false },
  { id: '2', title: 'Stok Uyarısı', message: 'Ürün-X kritik stok seviyesinde', time: '1 saat önce', read: false },
  { id: '3', title: 'Fatura Ödendi', message: 'XYZ Ltd. faturası ödendi', time: '2 saat önce', read: true },
];

export function Header({ onMenuClick, sidebarCollapsed }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Close dropdowns when clicking outside
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

  // Keyboard shortcut for search
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

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-40 transition-all duration-300',
        'left-0',
        sidebarCollapsed ? 'lg:left-16' : 'lg:left-60'
      )}
    >
      <div className="h-full px-3 sm:px-4 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search - hidden on small mobile */}
          <div className="relative hidden sm:block">
            {searchOpen ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ara..."
                    className="w-48 md:w-80 h-10 pl-10 pr-10 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 transition-colors"
              >
                <Search className="w-4 h-4" />
                <span className="hidden md:inline">Ara...</span>
                <span className="hidden md:flex items-center gap-1 ml-4 text-xs text-gray-400">
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-200 border border-gray-300">Ctrl</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-200 border border-gray-300">K</kbd>
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Bildirimler</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer',
                        !notification.read && 'bg-blue-50/50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-2 h-2 rounded-full mt-2',
                          notification.read ? 'bg-gray-300' : 'bg-primary'
                        )} />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-100">
                  <button className="w-full py-2 text-sm text-primary hover:bg-blue-50 rounded-lg transition-colors">
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
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                {getInitials(currentUser.name)}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.role}</p>
              </div>
              <ChevronDown className="hidden md:block w-4 h-4 text-gray-400" />
            </button>

            {/* User dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
                <div className="p-4 border-b border-gray-100">
                  <p className="font-medium text-gray-900">{currentUser.name}</p>
                  <p className="text-sm text-gray-500">{currentUser.email}</p>
                </div>
                <div className="py-2">
                  <Link
                    to="/ayarlar/profil"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    Profilim
                  </Link>
                  <Link
                    to="/ayarlar"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Ayarlar
                  </Link>
                  <Link
                    to="/yardim"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <HelpCircle className="w-4 h-4" />
                    Yardım
                  </Link>
                </div>
                <div className="py-2 border-t border-gray-100">
                  <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-danger hover:bg-red-50 transition-colors">
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
  );
}

export default Header;
