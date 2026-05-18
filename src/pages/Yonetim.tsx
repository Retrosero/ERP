import { useState } from 'react';
import {
  Plus, Users, Shield, Activity, Search, Filter,
  Edit, Trash2, Check, X, UserPlus, Key
} from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Card, Button, Input, Select, Table, Badge, Modal, StatCard } from '@/components/ui';

// Mock data
const mockUsers = [
  { id: 1, name: 'Ahmet Yılmaz', email: 'ahmet@firma.com', role: 'admin', is_active: true, last_login: '2024-01-18 14:30', created_at: '2023-06-15' },
  { id: 2, name: 'Mehmet Demir', email: 'mehmet@firma.com', role: 'accountant', is_active: true, last_login: '2024-01-18 09:15', created_at: '2023-08-20' },
  { id: 3, name: 'Ayşe Kaya', email: 'ayse@firma.com', role: 'sales', is_active: true, last_login: '2024-01-17 16:45', created_at: '2023-09-10' },
  { id: 4, name: 'Fatma Şahin', email: 'fatma@firma.com', role: 'warehouse', is_active: true, last_login: '2024-01-16 11:20', created_at: '2023-11-05' },
  { id: 5, name: 'Ali Yıldırım', email: 'ali@firma.com', role: 'field_sales', is_active: false, last_login: '2024-01-10 08:00', created_at: '2023-12-01' },
  { id: 6, name: 'Zeynep Aydın', email: 'zeynep@firma.com', role: 'viewer', is_active: true, last_login: '2024-01-18 10:00', created_at: '2024-01-02' },
];

const roles = [
  { id: 'admin', name: 'Yönetici', description: 'Tüm modüllere ve işlemlere erişim', color: 'bg-red-100 text-red-700' },
  { id: 'accountant', name: 'Muhasebeci', description: 'Faturalar, Cari, Nakit, Raporlar', color: 'bg-blue-100 text-blue-700' },
  { id: 'sales', name: 'Satış Temsilcisi', description: 'Müşteriler, Siparişler, Teklifler', color: 'bg-green-100 text-green-700' },
  { id: 'warehouse', name: 'Depo Sorumlusu', description: 'Stok ve Ürün yönetimi', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'field_sales', name: 'Saha Satış', description: 'Mobil sipariş girişi', color: 'bg-purple-100 text-purple-700' },
  { id: 'viewer', name: 'Sadece Okuma', description: 'Salt okunur erişim', color: 'bg-gray-100 text-gray-700' },
];

const permissions = {
  admin: ['*'],
  accountant: ['invoices:*', 'customers:read', 'orders:*', 'proposals:*', 'cash:*', 'reports:*', 'expenses:*'],
  sales: ['customers:*', 'orders:*', 'proposals:*', 'products:read'],
  warehouse: ['products:*', 'stock:*', 'warehouse:*'],
  field_sales: ['customers:read', 'orders:create'],
  viewer: ['*:read'],
};

const activityLogs = [
  { id: 1, user: 'Ahmet Yılmaz', action: 'Fatura oluşturdu', module: 'Faturalar', details: '#102 numaralı fatura', timestamp: '2024-01-18 14:25' },
  { id: 2, user: 'Mehmet Demir', action: 'Müşteri güncelledi', module: 'Müşteriler', details: 'ABC Ticaret A.Ş.', timestamp: '2024-01-18 14:10' },
  { id: 3, user: 'Ayşe Kaya', action: 'Sipariş onayladı', module: 'Siparişler', details: '#45 numaralı sipariş', timestamp: '2024-01-18 13:45' },
  { id: 4, user: 'Ahmet Yılmaz', action: 'Ödeme kaydı', module: 'Tahsilatlar', details: '₺5.200 tahsilat', timestamp: '2024-01-18 11:30' },
  { id: 5, user: 'Fatma Şahin', action: 'Stok girişi', module: 'Stok', details: 'Depo girişi - 50 adet', timestamp: '2024-01-18 10:15' },
];

export default function Yonetim() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'activity'>('users');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleConfig = (roleId: string) => roles.find(r => r.id === roleId) || roles[5];

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Kullanıcı ve Yetkilendirme</h1>
          <p className="page-subtitle">Kullanıcı hesapları ve rol izinlerini yönetin</p>
        </div>
        <Button variant="primary" onClick={() => setIsUserModalOpen(true)}>
          <UserPlus className="w-4 h-4" />
          Kullanıcı Ekle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Toplam Kullanıcı"
          value={String(mockUsers.length)}
          icon={Users}
        />
        <StatCard
          title="Aktif Kullanıcı"
          value={String(mockUsers.filter(u => u.is_active).length)}
          icon={Check}
          variant="success"
        />
        <StatCard
          title="Aktif Olmayan"
          value={String(mockUsers.filter(u => !u.is_active).length)}
          icon={X}
          variant="warning"
        />
        <StatCard
          title="Rol Sayısı"
          value={String(roles.length)}
          icon={Shield}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'users' ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Kullanıcılar
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'roles' ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Roller
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'activity' ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          Aktivite Logları
        </button>
      </div>

      {activeTab === 'users' && (
        <>
          {/* Search */}
          <Card className="mb-6">
            <div className="p-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Kullanıcı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </Card>

          {/* Users Table */}
          <Card>
            <Table
              columns={[
                {
                  key: 'name',
                  header: 'Kullanıcı',
                  render: (value, row) => {
                    const user = row as typeof mockUsers[0];
                    return (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{value as string}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    );
                  },
                },
                {
                  key: 'role',
                  header: 'Rol',
                  render: (value) => {
                    const role = roleConfig(value as string);
                    return (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${role.color}`}>
                        {role.name}
                      </span>
                    );
                  },
                },
                {
                  key: 'is_active',
                  header: 'Durum',
                  render: (value) => (
                    <Badge variant={value ? 'success' : 'gray'}>
                      {value ? 'Aktif' : 'Pasif'}
                    </Badge>
                  ),
                },
                {
                  key: 'last_login',
                  header: 'Son Giriş',
                  render: (value) => value ? new Date(value as string).toLocaleString('tr-TR') : 'Hiç giriş yapmadı',
                },
                {
                  key: 'actions',
                  header: '',
                  render: (_, row) => {
                    const user = row as typeof mockUsers[0];
                    return (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Şifre Değiştir">
                          <Key className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  },
                },
              ]}
              data={filteredUsers}
            />
          </Card>
        </>
      )}

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => (
            <Card key={role.id} className="hover:shadow-md transition-shadow">
              <Card.Body>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${role.color}`}>
                    {role.name}
                  </span>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-500 mb-2">İzinler:</p>
                  <div className="flex flex-wrap gap-1">
                    {permissions[role.id as keyof typeof permissions].slice(0, 5).map((perm, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {perm}
                      </span>
                    ))}
                    {permissions[role.id as keyof typeof permissions].length > 5 && (
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                        +{permissions[role.id as keyof typeof permissions].length - 5}
                      </span>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'activity' && (
        <Card>
          <Table
            columns={[
              {
                key: 'timestamp',
                header: 'Tarih/Saat',
                render: (value) => new Date(value as string).toLocaleString('tr-TR'),
              },
              {
                key: 'user',
                header: 'Kullanıcı',
              },
              {
                key: 'action',
                header: 'İşlem',
                render: (value) => <span className="font-medium">{value as string}</span>,
              },
              {
                key: 'module',
                header: 'Modül',
                render: (value) => <Badge variant="info">{value as string}</Badge>,
              },
              {
                key: 'details',
                header: 'Detay',
                render: (value) => <span className="text-gray-600">{value as string}</span>,
              },
            ]}
            data={activityLogs}
          />
        </Card>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Yeni Kullanıcı Ekle"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Ad Soyad</label>
            <Input placeholder="Ad Soyad" />
          </div>
          <div>
            <label className="label">E-posta</label>
            <Input type="email" placeholder="email@firma.com" />
          </div>
          <div>
            <label className="label">Rol</label>
            <Select
              options={roles.map(r => ({ value: r.id, label: r.name }))}
            />
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input type="checkbox" id="sendInvite" className="w-4 h-4 rounded" />
            <label htmlFor="sendInvite" className="text-sm">
              Davet e-postası gönder
            </label>
          </div>
        </div>
        <Modal.Footer className="mt-6">
          <Button variant="secondary" onClick={() => setIsUserModalOpen(false)}>İptal</Button>
          <Button variant="primary">Kullanıcı Ekle</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Kullanıcı Düzenle"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-semibold">
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                <p className="text-gray-500">{selectedUser.email}</p>
              </div>
            </div>
            <div>
              <label className="label">Rol</label>
              <Select
                value={selectedUser.role}
                options={roles.map(r => ({ value: r.id, label: r.name }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                defaultChecked={selectedUser.is_active}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="isActive" className="text-sm">Aktif kullanıcı</label>
            </div>
          </div>
        )}
        <Modal.Footer className="mt-6">
          <Button variant="secondary" onClick={() => setSelectedUser(null)}>İptal</Button>
          <Button variant="primary">Kaydet</Button>
        </Modal.Footer>
      </Modal>
    </MainLayout>
  );
}