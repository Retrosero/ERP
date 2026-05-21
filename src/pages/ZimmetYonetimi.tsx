import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, Plus, X, User, Calendar, CheckCircle, AlertTriangle,
  Search, Filter, Download, Settings, Eye, RotateCcw, Trash2,
  RefreshCw, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui';
import { userApi } from '@/lib/dolibarr-hrm';
import { agendaApi, productApi } from '@/lib/dolibarr';

// Types
interface EquipmentCategory {
  id: number;
  ref?: string;
  label: string;
  description?: string;
  active?: number;
}

interface Equipment {
  id: number;
  ref?: string;
  label: string;
  description?: string;
  barcode?: string;
  serial_number?: string;
  fk_category?: number;
  fk_user_assign?: number;
  category_name?: string;
  assigned_to_name?: string;
  status?: number;
  price_ht?: number;
}

interface EquipmentAssignment {
  id: number;
  fk_equipment: number;
  fk_user: number;
  date_assign?: string | number;
  date_return?: string | number;
  date_expected_return?: string | number;
  returned?: number;
  note_private?: string;
  equipment_name?: string;
  equipment_ref?: string;
  user_name?: string;
}

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email?: string;
}

interface ZimmetMeta {
  equipmentId: number;
  userId: number;
  status: 'assigned' | 'returned';
  assignedAt?: string;
  returnedAt?: string;
}

const ZIMMET_META_PREFIX = 'ZIMMET_META:';

const parseZimmetMeta = (note?: string): ZimmetMeta | null => {
  if (!note) return null;
  const row = note.split('\n').find((l) => l.startsWith(ZIMMET_META_PREFIX));
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.slice(ZIMMET_META_PREFIX.length)) as Partial<ZimmetMeta>;
    if (!parsed.equipmentId || !parsed.userId || !parsed.status) return null;
    return parsed as ZimmetMeta;
  } catch {
    return null;
  }
};

const toZimmetNote = (meta: ZimmetMeta, baseNote?: string): string => {
  const clean = (baseNote || '')
    .split('\n')
    .filter((l) => !l.startsWith(ZIMMET_META_PREFIX))
    .join('\n')
    .trim();
  const metaLine = `${ZIMMET_META_PREFIX}${JSON.stringify(meta)}`;
  return clean ? `${clean}\n${metaLine}` : metaLine;
};

const toUnixTs = (value?: string | number): number => {
  if (!value) return Math.floor(Date.now() / 1000);
  if (typeof value === 'number') return value < 10_000_000_000 ? value : Math.floor(value / 1000);
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return Math.floor(Date.now() / 1000);
  return Math.floor(ms / 1000);
};

// Format date
const formatDate = (date: string | Date | number | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Status config
const statusConfig: Record<number, { bg: string; text: string; label: string }> = {
  0: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Müsait' },
  1: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Zimmetli' },
  2: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Bakımda' },
  3: { bg: 'bg-gray-300', text: 'text-gray-700', label: 'Hurda' },
  4: { bg: 'bg-red-100', text: 'text-red-700', label: 'Kayıp' },
};

// Category icons
const categoryIcons: Record<string, string> = {
  'Bilgisayar': '💻',
  'Telefon': '📱',
  'Tablet': '📲',
  'Araç': '🚗',
  'Diğer': '📦',
};

export const ZimmetYonetimi: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'equipment' | 'assignments' | 'categories'>('equipment');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from Dolibarr API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch users
      const usersResponse = await userApi.list({ limit: 100 });
      setUsers(usersResponse);

      const [products, events] = await Promise.all([
        productApi.list({ limit: 1000 }),
        agendaApi.list({ limit: 1000, sortfield: 't.datep', sortorder: 'DESC' }),
      ]);
      const mappedEquipment: Equipment[] = products.map((p) => ({
        id: p.id,
        ref: p.ref,
        label: p.label,
        description: p.description,
        serial_number: p.barcode,
        fk_category: p.type === 1 ? 2 : 1,
        category_name: p.type === 1 ? 'Hizmet' : 'Ürün',
        status: Number(p.tosell || 0) === 1 ? 0 : 2,
        price_ht: p.price,
      }));
      const assignmentEvents = events
        .map((event) => {
          const meta = parseZimmetMeta(event.note_private);
          if (!meta) return null;
          return {
            id: event.id,
            fk_equipment: meta.equipmentId,
            fk_user: meta.userId,
            date_assign: meta.assignedAt || event.datep,
            date_return: meta.returnedAt,
            returned: meta.status === 'returned' ? 1 : 0,
            note_private: event.note_private,
          } as EquipmentAssignment;
        })
        .filter((x): x is EquipmentAssignment => x !== null);

      const assignmentByEquipment = new Map<number, EquipmentAssignment>();
      assignmentEvents.forEach((a) => {
        if (!assignmentByEquipment.has(a.fk_equipment)) {
          assignmentByEquipment.set(a.fk_equipment, a);
        }
      });

      const userMap = new Map(usersResponse.map((u) => [u.id, `${u.firstname} ${u.lastname}`.trim()]));
      const equipmentWithStatus = mappedEquipment.map((eq) => {
        const asg = assignmentByEquipment.get(eq.id);
        if (!asg || asg.returned) return { ...eq, status: 0, assigned_to_name: undefined };
        return {
          ...eq,
          status: 1,
          fk_user_assign: asg.fk_user,
          assigned_to_name: userMap.get(asg.fk_user) || `Kullanıcı #${asg.fk_user}`,
        };
      });

      const normalizedAssignments = assignmentEvents.map((a) => ({
        ...a,
        equipment_name: mappedEquipment.find((e) => e.id === a.fk_equipment)?.label || `#${a.fk_equipment}`,
        user_name: userMap.get(a.fk_user) || `Kullanıcı #${a.fk_user}`,
      }));

      setEquipment(equipmentWithStatus);
      setCategories([
        { id: 1, label: 'Ürün' },
        { id: 2, label: 'Hizmet' },
      ]);
      setAssignments(normalizedAssignments);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter equipment by category
  const filteredEquipment = selectedCategory
    ? equipment.filter(e => e.fk_category === selectedCategory)
    : equipment;

  // Summary
  const summary = {
    total: equipment.length,
    available: equipment.filter(e => e.status === 0).length,
    assigned: equipment.filter(e => e.status === 1).length,
    maintenance: equipment.filter(e => e.status === 2).length,
  };

  // Handle assign
  const handleAssign = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setShowAssignModal(true);
  };

  // Handle assign submit
  const handleAssignSubmit = async (userId: number) => {
    if (!selectedEquipment) return;
    try {
      const nowIso = new Date().toISOString();
      await agendaApi.create({
        label: `Zimmet - ${selectedEquipment.label}`,
        type_code: 'AC_OTH',
        userownerid: userId,
        fk_user_action: userId,
        datep: toUnixTs(nowIso),
        datef: toUnixTs(nowIso),
        note_private: toZimmetNote({
          equipmentId: selectedEquipment.id,
          userId,
          status: 'assigned',
          assignedAt: nowIso,
        }),
      });
      setShowAssignModal(false);
      setSelectedEquipment(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Zimmet atama sırasında hata oluştu');
    }
  };

  // Handle return
  const handleReturn = async (assignmentId: number) => {
    try {
      const event = await agendaApi.get(assignmentId);
      const meta = parseZimmetMeta(event.note_private);
      if (!meta) {
        setError('Zimmet kaydı metadata bilgisi bulunamadı.');
        return;
      }
      const returnedAt = new Date().toISOString();
      await agendaApi.update(assignmentId, {
        datef: toUnixTs(returnedAt),
        note_private: toZimmetNote({
          ...meta,
          status: 'returned',
          returnedAt,
        }, event.note_private),
      });
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İade işlemi sırasında hata oluştu');
    }
  };

  // Handle create equipment
  const handleCreateEquipment = async (data: any) => {
    try {
      await productApi.create({
        ref: data.ref || undefined,
        label: data.label,
        description: data.description,
        barcode: data.serial_number,
        price: data.price_ht,
        type: data.fk_category === 2 ? 1 : 0,
        tosell: 1,
      });
      setShowAddModal(false);
      fetchData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ekipman ekleme sırasında hata oluştu');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zimmet Yönetimi</h1>
          <p className="text-sm text-gray-500">Dolibarr ekipman ve zimmet kayıtları</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Yeni Ekipman
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Toplam Ekipman</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Müsait</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{summary.available}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Zimmetli</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{summary.assigned}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Bakımda</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{summary.maintenance}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !selectedCategory
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tümü ({equipment.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{categoryIcons[cat.label] || '📦'}</span>
            {cat.label}
            <span className="opacity-75">({equipment.filter(e => e.fk_category === cat.id).length})</span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500">Dolibarr'dan veriler yükleniyor...</p>
        </div>
      )}

      {/* Tabs */}
      {!loading && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('equipment')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'equipment'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Ekipman Listesi ({equipment.length})
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'assignments'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Zimmet Kayıtları ({assignments.length})
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'categories'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Kategoriler ({categories.length})
              </button>
            </div>
          </div>

          {/* Equipment Table */}
          {activeTab === 'equipment' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ekipman</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seri No</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atanan Kişi</th>
                    <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                    <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEquipment.map((eq) => (
                    <tr key={eq.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{eq.label}</p>
                          <p className="text-sm text-gray-500">{eq.description}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-mono text-gray-600">{eq.serial_number || eq.ref || '-'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {categoryIcons[eq.category_name || ''] || '📦'} {eq.category_name || 'Diğer'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {eq.assigned_to_name ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-xs font-medium">
                                {eq.assigned_to_name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <span className="text-sm text-gray-900">{eq.assigned_to_name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">â€”</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[eq.status || 0]?.bg || 'bg-gray-100'} ${statusConfig[eq.status || 0]?.text || 'text-gray-700'}`}>
                          {statusConfig[eq.status || 0]?.label || 'Bilinmiyor'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {eq.status === 0 && (
                            <button
                              onClick={() => handleAssign(eq)}
                              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Zimmet Et
                            </button>
                          )}
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Assignments Table */}
          {activeTab === 'assignments' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ekipman</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personel</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zimmet Tarihi</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beklenen İade</th>
                    <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                    <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assignments.map((asgn) => (
                    <tr key={asgn.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{asgn.equipment_name || asgn.equipment_ref || `#${asgn.fk_equipment}`}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-xs font-medium">
                              {(asgn.user_name || 'U').split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <span className="text-sm text-gray-900">{asgn.user_name || `#${asgn.fk_user}`}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{formatDate(asgn.date_assign)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{formatDate(asgn.date_expected_return)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          asgn.returned
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {asgn.returned ? 'İade Edildi' : 'Aktif'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {!asgn.returned && (
                            <button
                              onClick={() => handleReturn(asgn.id)}
                              className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              İade Et
                            </button>
                          )}
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {assignments.length === 0 && (
                <div className="px-5 py-12 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Zimmet kaydı bulunamadı.</p>
                </div>
              )}
            </div>
          )}

          {/* Categories */}
          {activeTab === 'categories' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const catEquipment = equipment.filter(e => e.fk_category === cat.id);
                  const availableCount = catEquipment.filter(e => e.status === 0).length;
                  return (
                    <div key={cat.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                            {categoryIcons[cat.label] || '📦'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{cat.label}</h3>
                            <p className="text-sm text-gray-500">{catEquipment.length} ekipman</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <span className="text-sm text-gray-500">Müsait: {availableCount}</span>
                        <button
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setActiveTab('equipment');
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Yönet →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredEquipment.length === 0 && activeTab === 'equipment' && (
            <div className="px-5 py-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Bu kategoride ekipman bulunamadı.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddModal && (
        <AddEquipmentModal
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreateEquipment}
        />
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedEquipment && (
        <AssignEquipmentModal
          equipment={selectedEquipment}
          users={users}
          onClose={() => setShowAssignModal(false)}
          onSubmit={handleAssignSubmit}
        />
      )}
    </div>
  );
};

// Add Equipment Modal Component
interface AddEquipmentModalProps {
  categories: EquipmentCategory[];
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({ categories, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    serial_number: '',
    fk_category: '',
    price_ht: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      label: formData.label,
      description: formData.description,
      serial_number: formData.serial_number,
      fk_category: formData.fk_category ? parseInt(formData.fk_category) : undefined,
      price_ht: formData.price_ht ? parseFloat(formData.price_ht) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Yeni Ekipman Ekle</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ekipman Adı *</label>
              <input
                type="text"
                required
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Örn: MacBook Pro 16"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seri Numarası</label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  placeholder="Seri numarası"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={formData.fk_category}
                  onChange={(e) => setFormData({ ...formData, fk_category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seçiniz</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ekipman detayları..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (TL)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price_ht}
                onChange={(e) => setFormData({ ...formData, price_ht: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Assign Equipment Modal Component
interface AssignEquipmentModalProps {
  equipment: Equipment;
  users: User[];
  onClose: () => void;
  onSubmit: (userId: number) => void;
}

const AssignEquipmentModal: React.FC<AssignEquipmentModalProps> = ({ equipment, users, onClose, onSubmit }) => {
  const [selectedUser, setSelectedUser] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      onSubmit(parseInt(selectedUser));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Zimmet Ata</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="font-semibold text-gray-900">{equipment.label}</p>
              <p className="text-sm text-gray-500">{equipment.description}</p>
              <p className="text-xs text-gray-400 mt-1">Seri: {equipment.serial_number || '-'}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Personel Seç *</label>
                <select
                  required
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seçiniz</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstname} {user.lastname}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Bilgilendirme</p>
                    <p className="mt-1">Zimmet ataması yapıldığında ekipman müsait durumdan çıkarılacaktır.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!selectedUser}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Zimmet Et
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

