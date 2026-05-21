/**
 * Hatırlatıcılar
 * Bildirimler, görev hatırlatıcıları ve uyarılar
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  BellOff,
  Clock,
  Check,
  Trash2,
  Filter,
  Search,
  Settings,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  Calendar,
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  ChevronRight,
  MoreVertical,
  Filter as FilterIcon,
  X,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { formatDate, formatCurrency, cn } from '@/lib/utils';

// Reminder types
type ReminderType = 'task' | 'meeting' | 'payment' | 'deadline' | 'info';
type ReminderPriority = 'high' | 'medium' | 'low';

// Mock reminders data
const mockReminders = [
  {
    id: 1,
    title: 'Fatura Ödeme',
    description: 'XYZ Ltd. faturası için ödeme yapılacak',
    type: 'payment' as ReminderType,
    priority: 'high' as ReminderPriority,
    date: '2024-05-20',
    time: '17:00',
    isRead: false,
    isCompleted: false,
    icon: DollarSign,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  {
    id: 2,
    title: 'Müşteri Toplantısı',
    description: 'ABC Ltd. ile saat 10:00\'da toplantı',
    type: 'meeting' as ReminderType,
    priority: 'high' as ReminderPriority,
    date: '2024-05-20',
    time: '10:00',
    isRead: false,
    isCompleted: false,
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    id: 3,
    title: 'Stok Yenileme',
    description: 'Ürün-A stok seviyesi kritik, yenilenmeli',
    type: 'task' as ReminderType,
    priority: 'medium' as ReminderPriority,
    date: '2024-05-21',
    time: '09:00',
    isRead: true,
    isCompleted: false,
    icon: Package,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  {
    id: 4,
    title: 'Teklif Son Tarihi',
    description: 'DEF Corp teklifi için son gün',
    type: 'deadline' as ReminderType,
    priority: 'high' as ReminderPriority,
    date: '2024-05-22',
    time: '23:59',
    isRead: true,
    isCompleted: false,
    icon: Clock,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    id: 5,
    title: 'Sipariş Onayı',
    description: '125 numaralı sipariş onay bekliyor',
    type: 'info' as ReminderType,
    priority: 'low' as ReminderPriority,
    date: '2024-05-23',
    time: '',
    isRead: true,
    isCompleted: false,
    icon: ShoppingCart,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
  },
  {
    id: 6,
    title: 'Satış Hedefi',
    description: 'Aylık satış hedefinin %85\'ine ulaşıldı',
    type: 'info' as ReminderType,
    priority: 'medium' as ReminderPriority,
    date: '2024-05-24',
    time: '',
    isRead: true,
    isCompleted: true,
    icon: TrendingUp,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
];

// Notification settings
const notificationSettings = [
  { id: 1, label: 'Fatura Hatırlatıcıları', enabled: true },
  { id: 2, label: 'Toplantı Hatırlatıcıları', enabled: true },
  { id: 3, label: 'Stok Uyarıları', enabled: true },
  { id: 4, label: 'Son Tarih Hatırlatıcıları', enabled: true },
  { id: 5, label: 'Sipariş Bildirimleri', enabled: false },
  { id: 6, label: 'Müşteri Güncellemeleri', enabled: true },
];

export default function Hatirlaticilar() {
  const [reminders, setReminders] = useState(mockReminders);
  const [filterType, setFilterType] = useState<'all' | ReminderType>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | ReminderPriority>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const unreadCount = reminders.filter(r => !r.isRead && !r.isCompleted).length;

  const filteredReminders = reminders.filter(reminder => {
    if (!showCompleted && reminder.isCompleted) return false;
    if (filterType !== 'all' && reminder.type !== filterType) return false;
    if (filterPriority !== 'all' && reminder.priority !== filterPriority) return false;
    if (searchQuery && !reminder.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const markAsRead = (id: number) => {
    setReminders(reminders.map(r =>
      r.id === id ? { ...r, isRead: true } : r
    ));
  };

  const markAsCompleted = (id: number) => {
    setReminders(reminders.map(r =>
      r.id === id ? { ...r, isCompleted: true, isRead: true } : r
    ));
  };

  const deleteReminder = (id: number) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const getPriorityColor = (priority: ReminderPriority) => {
    const colors = {
      high: 'bg-red-100 text-red-600',
      medium: 'bg-amber-100 text-amber-600',
      low: 'bg-slate-100 text-slate-600',
    };
    return colors[priority];
  };

  const getTypeIcon = (type: ReminderType) => {
    const icons = {
      payment: DollarSign,
      meeting: Users,
      task: CheckCircle2,
      deadline: Clock,
      info: Info,
    };
    return icons[type];
  };

  const getPriorityLabel = (priority: ReminderPriority) => {
    const labels = {
      high: 'Yüksek',
      medium: 'Orta',
      low: 'Düşük',
    };
    return labels[priority];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hatırlatıcılar</h1>
          <p className="text-slate-500 mt-1">
            {unreadCount} okunmamış hatırlatıcı
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
          >
            <Settings className="w-4 h-4" />
            Ayarlar
          </button>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              showCompleted
                ? 'bg-teal-500 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            )}
          >
            <Check className="w-4 h-4" />
            Tamamlananları Göster
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:shadow-lg transition-all"
          onClick={() => setFilterType('all')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Toplam</p>
              <p className="text-2xl font-bold text-slate-900">{reminders.length}</p>
            </div>
          </div>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-lg transition-all"
          onClick={() => setFilterType('deadline')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Son Tarih</p>
              <p className="text-2xl font-bold text-slate-900">
                {reminders.filter(r => r.type === 'deadline').length}
              </p>
            </div>
          </div>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-lg transition-all"
          onClick={() => setFilterType('payment')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Ödeme</p>
              <p className="text-2xl font-bold text-slate-900">
                {reminders.filter(r => r.type === 'payment').length}
              </p>
            </div>
          </div>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-lg transition-all"
          onClick={() => setFilterPriority('high')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Yüksek Öncelikli</p>
              <p className="text-2xl font-bold text-slate-900">
                {reminders.filter(r => r.priority === 'high' && !r.isCompleted).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters & List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filters */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Hatırlatıcı ara..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | ReminderType)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                >
                  <option value="all">Tüm Türler</option>
                  <option value="payment">Ödeme</option>
                  <option value="meeting">Toplantı</option>
                  <option value="task">Görev</option>
                  <option value="deadline">Son Tarih</option>
                  <option value="info">Bilgi</option>
                </select>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as 'all' | ReminderPriority)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                >
                  <option value="all">Tüm Öncelikler</option>
                  <option value="high">Yüksek</option>
                  <option value="medium">Orta</option>
                  <option value="low">Düşük</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Reminders List */}
          <div className="space-y-3">
            {filteredReminders.length > 0 ? (
              filteredReminders.map((reminder) => {
                const Icon = getTypeIcon(reminder.type);
                return (
                  <Card
                    key={reminder.id}
                    className={cn(
                      'transition-all hover:shadow-lg',
                      !reminder.isRead && !reminder.isCompleted && 'border-l-4 border-l-teal-500',
                      reminder.isCompleted && 'opacity-60'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', reminder.bgColor)}>
                        <Icon className={cn('w-6 h-6', reminder.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {!reminder.isRead && !reminder.isCompleted && (
                            <div className="w-2 h-2 rounded-full bg-teal-500" />
                          )}
                          <h4 className={cn(
                            'font-semibold text-slate-900',
                            reminder.isCompleted && 'line-through text-slate-400'
                          )}>
                            {reminder.title}
                          </h4>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{reminder.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          {reminder.date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(new Date(reminder.date), 'short')}
                            </div>
                          )}
                          {reminder.time && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {reminder.time}
                            </div>
                          )}
                          <Badge variant="default" className={cn('text-xs', getPriorityColor(reminder.priority))}>
                            {getPriorityLabel(reminder.priority)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!reminder.isRead && !reminder.isCompleted && (
                          <button
                            onClick={() => markAsRead(reminder.id)}
                            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Okundu işaretle"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        )}
                        {!reminder.isCompleted && (
                          <button
                            onClick={() => markAsCompleted(reminder.id)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Tamamlandı işaretle"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteReminder(reminder.id)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="text-center py-12">
                <BellOff className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Filtrelere uygun hatırlatıcı bulunamadı</p>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Hızlı İşlemler</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">Yeni Toplantı</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">Ödeme Hatırlat</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">Son Tarih Ekle</span>
              </button>
            </div>
          </Card>

          {/* Upcoming */}
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Yaklaşan</h3>
            <div className="space-y-3">
              {reminders
                .filter(r => !r.isCompleted)
                .slice(0, 4)
                .map((reminder) => {
                  const Icon = getTypeIcon(reminder.type);
                  return (
                    <div
                      key={reminder.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', reminder.bgColor)}>
                        <Icon className={cn('w-4 h-4', reminder.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{reminder.title}</p>
                        <p className="text-xs text-slate-400">
                          {reminder.date && formatDate(new Date(reminder.date), 'short')}
                          {reminder.time && ` - ${reminder.time}`}
                        </p>
                      </div>
                      <Badge
                        variant="default"
                        className={cn('text-xs', getPriorityColor(reminder.priority))}
                      >
                        {getPriorityLabel(reminder.priority)}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </Card>

          {/* Notification Settings */}
          {showSettings && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Bildirim Ayarları</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-slate-100 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="space-y-3">
                {notificationSettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                  >
                    <span className="text-sm text-slate-700">{setting.label}</span>
                    <button
                      className={cn(
                        'w-12 h-6 rounded-full relative transition-colors',
                        setting.enabled ? 'bg-teal-500' : 'bg-slate-300'
                      )}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm',
                          setting.enabled ? 'left-6.5' : 'left-0.5'
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* All Reminders Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Tüm Hatırlatıcılar</h3>
          <Badge variant="primary">{filteredReminders.length}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Durum</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Hatırlatıcı</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Tür</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Öncelik</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Tarih</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredReminders.map((reminder) => {
                const Icon = getTypeIcon(reminder.type);
                return (
                  <tr key={reminder.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4">
                      {reminder.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : reminder.isRead ? (
                        <Check className="w-5 h-5 text-slate-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-teal-500" />
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', reminder.bgColor)}>
                          <Icon className={cn('w-4 h-4', reminder.color)} />
                        </div>
                        <div>
                          <p className={cn(
                            'text-sm font-medium',
                            reminder.isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'
                          )}>
                            {reminder.title}
                          </p>
                          <p className="text-xs text-slate-500">{reminder.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="default" className={cn('text-xs', reminder.bgColor.replace('bg-', 'bg-opacity-10 text-').replace('-100', '-600'))}>
                        {reminder.type}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="default" className={cn('text-xs', getPriorityColor(reminder.priority))}>
                        {getPriorityLabel(reminder.priority)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600">
                      {reminder.date && formatDate(new Date(reminder.date), 'short')}
                      {reminder.time && ` ${reminder.time}`}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        {!reminder.isCompleted && (
                          <button
                            onClick={() => markAsCompleted(reminder.id)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Tamamlandı"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteReminder(reminder.id)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}