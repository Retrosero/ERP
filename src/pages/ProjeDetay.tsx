/**
 * Proje Detay Sayfası
 * Proje bilgileri, görevler, zaman takibi ve ekip yönetimi
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Users,
  CheckSquare,
  Clock,
  Calendar,
  DollarSign,
  Plus,
  MoreVertical,
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronRight,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { Card, Button, Badge, Input, Modal } from '@/components/ui';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

// Mock tasks data
const mockTasks = [
  {
    id: 1,
    label: 'Gereksinim analizi tamamla',
    description: 'Müşteri gereksinimlerinin analizi ve dokümantasyonu',
    fk_task: 1,
    progress: 100,
    priority: 2,
    status: 1,
    date_start: '2024-01-15',
    date_end: '2024-01-20',
    planned_workload: 16,
    effective_workload: 18,
    assigned_to: 'Ahmet Yılmaz',
  },
  {
    id: 2,
    label: 'Tasarım mockupları hazırla',
    description: 'UI/UX tasarımlarının Figma üzerinde hazırlanması',
    fk_task: 2,
    progress: 80,
    priority: 2,
    status: 1,
    date_start: '2024-01-21',
    date_end: '2024-02-05',
    planned_workload: 32,
    effective_workload: 28,
    assigned_to: 'Ayşe Demir',
  },
  {
    id: 3,
    label: 'Backend API geliştir',
    description: 'REST API endpointlerinin geliştirilmesi',
    fk_task: 3,
    progress: 60,
    priority: 3,
    status: 1,
    date_start: '2024-02-01',
    date_end: '2024-03-15',
    planned_workload: 80,
    effective_workload: 45,
    assigned_to: 'Mehmet Kaya',
  },
  {
    id: 4,
    label: 'Frontend bileşenleri oluştur',
    description: 'React bileşenlerinin geliştirilmesi',
    fk_task: 4,
    progress: 40,
    priority: 3,
    status: 1,
    date_start: '2024-02-15',
    date_end: '2024-04-01',
    planned_workload: 64,
    effective_workload: 20,
    assigned_to: 'Fatma Şahin',
  },
  {
    id: 5,
    label: 'Entegrasyon testleri',
    description: 'Sistem entegrasyon testlerinin gerçekleştirilmesi',
    fk_task: 5,
    progress: 0,
    priority: 1,
    status: 0,
    date_start: '2024-04-01',
    date_end: '2024-05-15',
    planned_workload: 40,
    effective_workload: 0,
    assigned_to: 'Ali Yıldırım',
  },
];

// Mock project data
const mockProject = {
  id: 1,
  ref: 'PRJ-2024-001',
  title: 'E-Ticaret Platformu Geliştirme',
  description: 'Yeni nesil e-ticaret platformunun geliştirilmesi ve lansmanı',
  status: 1,
  progress: 65,
  date_start: '2024-01-15',
  date_end: '2024-06-30',
  budget: 250000,
  budget_used: 162500,
  tasks_total: 24,
  tasks_done: 15,
  team_members: [
    { id: 1, name: 'Ahmet Yılmaz', role: 'Proje Yöneticisi', avatar: null, workload: 100 },
    { id: 2, name: 'Ayşe Demir', role: 'UI/UX Tasarımcı', avatar: null, workload: 80 },
    { id: 3, name: 'Mehmet Kaya', role: 'Backend Developer', avatar: null, workload: 90 },
    { id: 4, name: 'Fatma Şahin', role: 'Frontend Developer', avatar: null, workload: 75 },
    { id: 5, name: 'Ali Yıldırım', role: 'QA Engineer', avatar: null, workload: 60 },
  ],
};

export default function ProjeDetay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tasks' | 'team' | 'time' | 'docs'>('tasks');
  const [project, setProject] = useState<typeof mockProject | null>(null);
  const [tasks, setTasks] = useState<typeof mockTasks>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // Fetch project data
  const fetchProject = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setProject(mockProject);
      setTasks(mockTasks);
    } catch (err) {
      console.error('Project fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Task status badge
  const getTaskStatusBadge = (task: typeof mockTasks[0]) => {
    if (task.progress === 100) {
      return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Tamamlandı</Badge>;
    }
    if (task.progress === 0) {
      return <Badge variant="gray">Başlamadı</Badge>;
    }
    return <Badge variant="info" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Devam Ediyor</Badge>;
  };

  // Priority badge
  const getPriorityBadge = (priority: number) => {
    const priorities = [
      { label: 'Düşük', className: 'bg-slate-100 text-slate-700' },
      { label: 'Normal', className: 'bg-blue-100 text-blue-700' },
      { label: 'Yüksek', className: 'bg-amber-100 text-amber-700' },
      { label: 'Kritik', className: 'bg-red-100 text-red-700' },
    ];
    const p = priorities[priority - 1] || priorities[1];
    return <Badge className={p.className}>{p.label}</Badge>;
  };

  // Get progress color
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-slate-300';
  };

  if (isLoading || !project) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/projeler')} className="mb-4 pl-0 hover:bg-transparent hover:text-indigo-600">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Projelere Dön
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{project.ref.split('-')[1]}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
                <Badge variant={project.status === 1 ? 'primary' : 'gray'}>
                  {project.status === 1 ? 'Açık' : 'Kapalı'}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-1">{project.ref}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">
              <Edit className="w-4 h-4 mr-2" />
              Düzenle
            </Button>
          </div>
        </div>
      </div>

      {/* Progress & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">İlerleme</p>
              <p className="text-3xl font-bold text-white mt-1">{project.progress}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-white/50" />
          </div>
          <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: `${project.progress}%` }} />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Tamamlanan Görev</p>
              <p className="text-3xl font-bold text-white mt-1">{project.tasks_done}/{project.tasks_total}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-white/50" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-violet-500 to-violet-600 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-100 text-sm font-medium">Bütçe Kullanımı</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(project.budget_used)}</p>
              <p className="text-xs text-violet-200 mt-1">/ {formatCurrency(project.budget)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-white/50" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Ekip Üyeleri</p>
              <p className="text-3xl font-bold text-white mt-1">{project.team_members.length}</p>
            </div>
            <Users className="w-8 h-8 text-white/50" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('tasks')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
            activeTab === 'tasks' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          <CheckSquare className="w-4 h-4" />
          Görevler
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
            activeTab === 'team' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          <Users className="w-4 h-4" />
          Ekip
        </button>
        <button
          onClick={() => setActiveTab('time')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
            activeTab === 'time' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          <Timer className="w-4 h-4" />
          Zaman Takibi
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
            activeTab === 'docs' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          <Calendar className="w-4 h-4" />
          Dokümanlar
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Görev Listesi</h3>
            <Button size="sm" onClick={() => setShowNewTaskModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Görev
            </Button>
          </div>

          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  task.progress === 100 ? 'bg-emerald-100' : 'bg-indigo-100'
                )}>
                  {task.progress === 100 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-indigo-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-slate-900">{task.label}</h4>
                    {getPriorityBadge(task.priority)}
                    {getTaskStatusBadge(task)}
                  </div>
                  <p className="text-sm text-slate-500 mb-3">{task.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {task.assigned_to}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(task.date_start)} - {formatDate(task.date_end)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.planned_workload} saat planlı
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', getProgressColor(task.progress))}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{task.progress}%</span>
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">Ekip Üyeleri</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.team_members.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{member.name}</h4>
                    <p className="text-sm text-slate-500">{member.role}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500">İş Yükü</span>
                    <span className="text-sm font-semibold text-slate-700">{member.workload}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', getProgressColor(member.workload))}
                      style={{ width: `${member.workload}%` }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'time' && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Zaman Kayıtları</h3>
          <div className="space-y-3">
            {[
              { user: 'Ahmet Yılmaz', task: 'Gereksinim analizi', date: '2024-01-18', hours: 8 },
              { user: 'Ayşe Demir', task: 'Tasarım mockupları', date: '2024-01-20', hours: 7 },
              { user: 'Mehmet Kaya', task: 'Backend API geliştirme', date: '2024-01-22', hours: 6 },
              { user: 'Fatma Şahin', task: 'Frontend bileşenleri', date: '2024-01-23', hours: 8 },
            ].map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                    {entry.user.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{entry.task}</p>
                    <p className="text-sm text-slate-500">{entry.user} • {formatDate(entry.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-indigo-600">{entry.hours} saat</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'docs' && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Dokümanlar</h3>
            <p className="text-sm text-slate-500 mb-4">Proje dokümanları ve dosyaları burada görüntülenecek</p>
            <Button variant="secondary">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Doküman Ekle
            </Button>
          </div>
        </Card>
      )}

      {/* New Task Modal */}
      <Modal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
        title="Yeni Görev Ekle"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Görev Adı</label>
            <Input placeholder="Görev adını girin..." />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Açıklama</label>
            <textarea className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all" rows={3} placeholder="Görev açıklaması..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Başlangıç</label>
              <Input type="date" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Bitiş</label>
              <Input type="date" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Atanan Kişi</label>
            <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all">
              <option>Seçin...</option>
              {project.team_members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setShowNewTaskModal(false)}>İptal</Button>
          <Button onClick={() => setShowNewTaskModal(false)}>Ekle</Button>
        </div>
      </Modal>
    </div>
  );
}