/**
 * Etkinlik Takvimi
 * Takvim görünümü, randevular ve hatırlatıcılar
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Bell,
  BellOff,
  Users,
  X,
  Check,
  MoreVertical,
  Filter,
  Search,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { formatDate, formatCurrency, cn } from '@/lib/utils';

// Calendar types
type ViewMode = 'month' | 'week' | 'day';
type EventType = 'meeting' | 'deadline' | 'reminder' | 'task' | 'holiday';

// Mock events data
const mockEvents = [
  {
    id: 1,
    title: 'Müşteri Toplantısı',
    description: 'ABC Ltd. ile aylık değerlendirme toplantısı',
    type: 'meeting' as EventType,
    date: '2024-05-20',
    time: '10:00',
    duration: 60,
    location: 'Konferans Salonu A',
    participants: ['Ahmet Yılmaz', 'Ayşe Demir'],
    reminder: true,
    color: 'bg-blue-500',
  },
  {
    id: 2,
    title: 'Fatura Son Tarihi',
    description: 'XYZ Ltd. faturası ödeme son tarihi',
    type: 'deadline' as EventType,
    date: '2024-05-21',
    time: '17:00',
    duration: 0,
    location: '',
    participants: [],
    reminder: true,
    color: 'bg-red-500',
  },
  {
    id: 3,
    title: 'Proje Lansmanı',
    description: 'E-Ticaret platformu canlıya alma',
    type: 'task' as EventType,
    date: '2024-05-22',
    time: '09:00',
    duration: 480,
    location: 'Online',
    participants: ['Tüm Ekip'],
    reminder: true,
    color: 'bg-emerald-500',
  },
  {
    id: 4,
    title: 'Bayram Tatili',
    description: 'Ramazan Bayramı',
    type: 'holiday' as EventType,
    date: '2024-05-23',
    time: '',
    duration: 1440,
    location: '',
    participants: [],
    reminder: false,
    color: 'bg-purple-500',
  },
  {
    id: 5,
    title: 'Haftalık Rapor',
    description: 'Satış raporu hazırlama',
    type: 'reminder' as EventType,
    date: '2024-05-24',
    time: '14:00',
    duration: 30,
    location: '',
    participants: [],
    reminder: true,
    color: 'bg-amber-500',
  },
];

// Mock tasks for today
const todayTasks = [
  { id: 1, title: 'Satış raporu gönder', time: '09:00', completed: true },
  { id: 2, title: 'Müşteri sunumu hazırla', time: '11:00', completed: false },
  { id: 3, title: 'Toplantı notlarını yaz', time: '14:30', completed: false },
  { id: 4, title: 'Fatura kontrol et', time: '16:00', completed: false },
];

// Mock upcoming appointments
const upcomingAppointments = [
  { id: 1, client: 'ABC Ltd.', date: '20 Mayıs', time: '10:00', status: 'confirmed' },
  { id: 2, client: 'XYZ Corporation', date: '21 Mayıs', time: '14:30', status: 'pending' },
  { id: 3, client: 'DEF Holding', date: '22 Mayıs', time: '09:00', status: 'confirmed' },
];

const weekDays = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const months = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export default function EtkinlikTakvimi() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 4, 20));
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDay = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];

    // Previous month days
    const prevMonthDays = startingDay;
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, new Date(year, month, 0).getDate() - i), isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const getEventsForDate = (date: Date) => {
    return mockEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getEventTypeColor = (type: EventType) => {
    const colors = {
      meeting: 'bg-blue-500',
      deadline: 'bg-red-500',
      reminder: 'bg-amber-500',
      task: 'bg-emerald-500',
      holiday: 'bg-purple-500',
    };
    return colors[type] || 'bg-slate-500';
  };

  const getEventTypeLabel = (type: EventType) => {
    const labels = {
      meeting: 'Toplantı',
      deadline: 'Son Tarih',
      reminder: 'Hatırlatıcı',
      task: 'Görev',
      holiday: 'Tatil',
    };
    return labels[type] || type;
  };

  const formatEventTime = (event: typeof mockEvents[0]) => {
    if (!event.time) return '';
    return `${event.time}${event.duration > 60 ? ` (${Math.floor(event.duration / 60)}s)` : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Etkinlik Takvimi</h1>
          <p className="text-slate-500 mt-1">
            Randevular, toplantılar ve hatırlatıcılar
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewEvent(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 transition-all"
          >
            <Plus className="w-4 h-4" />
            Yeni Etkinlik
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-3">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-slate-900">
                {months[month]} {year}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
              >
                Bugün
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 rounded-lg p-1">
                {(['month', 'week', 'day'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                      viewMode === mode
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {mode === 'month' ? 'Ay' : mode === 'week' ? 'Hafta' : 'Gün'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-slate-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const events = getEventsForDate(day.date);
                const isSelected = selectedDate?.toDateString() === day.date.toDateString();

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(day.date)}
                    className={cn(
                      'min-h-24 p-2 rounded-xl border transition-all cursor-pointer',
                      day.isCurrentMonth ? 'bg-white border-slate-200 hover:border-teal-500' : 'bg-slate-50 border-slate-100',
                      isToday(day.date) && 'ring-2 ring-teal-500 ring-offset-2',
                      isSelected && 'border-teal-500 bg-teal-50'
                    )}
                  >
                    <div className={cn(
                      'text-sm font-medium mb-1',
                      day.isCurrentMonth ? 'text-slate-900' : 'text-slate-400',
                      isToday(day.date) && 'text-teal-600 font-bold'
                    )}>
                      {day.date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {events.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded text-white truncate',
                            getEventTypeColor(event.type)
                          )}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className="text-xs text-slate-500 px-1.5">
                          +{events.length - 2} daha
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="p-4 border-t border-slate-100 flex items-center gap-6">
            <span className="text-sm text-slate-500">Etkinlik Türü:</span>
            <div className="flex items-center gap-4">
              {(['meeting', 'deadline', 'reminder', 'task', 'holiday'] as const).map((type) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div className={cn('w-3 h-3 rounded-full', getEventTypeColor(type))} />
                  <span className="text-xs text-slate-600">{getEventTypeLabel(type)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Tasks */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Bugünün Görevleri</h3>
              <Badge variant="primary">{todayTasks.filter(t => !t.completed).length}</Badge>
            </div>
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                  )}>
                    {task.completed && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      'text-sm font-medium',
                      task.completed ? 'text-slate-400 line-through' : 'text-slate-700'
                    )}>
                      {task.title}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">{task.time}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Yaklaşan Randevular</h3>
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{apt.client}</p>
                    <p className="text-xs text-slate-400 mt-1">{apt.date} - {apt.time}</p>
                  </div>
                  <Badge
                    variant={apt.status === 'confirmed' ? 'success' : 'warning'}
                    className="text-xs"
                  >
                    {apt.status === 'confirmed' ? 'Onaylı' : 'Bekliyor'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Add */}
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Hızlı Ekle</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">Toplantı</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">Son Tarih</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">Hatırlatıcı</span>
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Event List for Selected Date */}
      {selectedDate && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {formatDate(selectedDate, 'long')} - Etkinlikler
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <div className="space-y-4">
            {getEventsForDate(selectedDate).length > 0 ? (
              getEventsForDate(selectedDate).map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className={cn('w-1 h-16 rounded-full', event.color)} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900">{event.title}</h4>
                      <Badge
                        variant="default"
                        className={cn(
                          'text-xs',
                          event.type === 'meeting' && 'bg-blue-100 text-blue-600',
                          event.type === 'deadline' && 'bg-red-100 text-red-600',
                          event.type === 'task' && 'bg-emerald-100 text-emerald-600',
                          event.type === 'reminder' && 'bg-amber-100 text-amber-600',
                          event.type === 'holiday' && 'bg-purple-100 text-purple-600'
                        )}
                      >
                        {getEventTypeLabel(event.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{event.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {event.time && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatEventTime(event)}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      )}
                      {event.participants.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {event.participants.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.reminder ? (
                      <button className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                        <Bell className="w-5 h-5" />
                      </button>
                    ) : (
                      <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                        <BellOff className="w-5 h-5" />
                      </button>
                    )}
                    <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Bu tarihte etkinlik bulunmuyor</p>
                <button
                  onClick={() => setShowNewEvent(true)}
                  className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 transition-all"
                >
                  Etkinlik Ekle
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* All Events */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Tüm Etkinlikler</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Etkinlik ara..."
                className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as EventType | 'all')}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            >
              <option value="all">Tümü</option>
              <option value="meeting">Toplantı</option>
              <option value="deadline">Son Tarih</option>
              <option value="reminder">Hatırlatıcı</option>
              <option value="task">Görev</option>
              <option value="holiday">Tatil</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Tarih</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Etkinlik</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Tür</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Saat</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Yer</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Hatırlatıcı</th>
              </tr>
            </thead>
            <tbody>
              {mockEvents
                .filter(event => filterType === 'all' || event.type === filterType)
                .filter(event => !searchQuery || event.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((event) => (
                  <tr key={event.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-600">
                            {new Date(event.date).getDate()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          {formatDate(new Date(event.date), 'short')}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm font-medium text-slate-900">{event.title}</p>
                      <p className="text-xs text-slate-500">{event.description}</p>
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        variant="default"
                        className={cn(
                          'text-xs',
                          event.type === 'meeting' && 'bg-blue-100 text-blue-600',
                          event.type === 'deadline' && 'bg-red-100 text-red-600',
                          event.type === 'task' && 'bg-emerald-100 text-emerald-600',
                          event.type === 'reminder' && 'bg-amber-100 text-amber-600',
                          event.type === 'holiday' && 'bg-purple-100 text-purple-600'
                        )}
                      >
                        {getEventTypeLabel(event.type)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600">
                      {event.time || '-'}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600">
                      {event.location || '-'}
                    </td>
                    <td className="py-4 px-4">
                      {event.reminder ? (
                        <Bell className="w-5 h-5 text-teal-500" />
                      ) : (
                        <BellOff className="w-5 h-5 text-slate-300" />
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}