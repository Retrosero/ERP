import { useState } from 'react';
import {
  Plus, Building2, Settings, ChevronRight, Check,
  FileText, Receipt, Users, BarChart3
} from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Card, Button, Input, Select, Modal, StatCard } from '@/components/ui';

// Mock data
const mockCompanies = [
  {
    id: 1,
    name: 'Ana Şirket A.Ş.',
    tax_number: '1234567890',
    address: 'İstanbul, Türkiye',
    phone: '0212 555 1234',
    email: 'info@anasirket.com',
    logo: null,
    color: '#2563eb',
    is_active: true,
    is_default: true,
    user_count: 5,
    customer_count: 120,
    invoice_count: 450,
  },
  {
    id: 2,
    name: 'İkinci Şirket Ltd.',
    tax_number: '0987654321',
    address: 'Ankara, Türkiye',
    phone: '0312 555 5678',
    email: 'info@ikincisirket.com',
    logo: null,
    color: '#10b981',
    is_active: true,
    is_default: false,
    user_count: 3,
    customer_count: 45,
    invoice_count: 180,
  },
  {
    id: 3,
    name: 'Üçüncü Şirket Ticaret',
    tax_number: '5678901234',
    address: 'İzmir, Türkiye',
    phone: '0232 555 9012',
    email: 'info@ucuncusirket.com',
    logo: null,
    color: '#f59e0b',
    is_active: false,
    is_default: false,
    user_count: 2,
    customer_count: 30,
    invoice_count: 90,
  },
];

const features = [
  { id: 'invoices', label: 'Faturalar', icon: FileText },
  { id: 'customers', label: 'Müşteriler', icon: Users },
  { id: 'products', label: 'Ürünler', icon: BarChart3 },
  { id: 'reports', label: 'Raporlar', icon: BarChart3 },
];

export default function Sirketler() {
  const [companies, setCompanies] = useState(mockCompanies);
  const [activeCompany, setActiveCompany] = useState(mockCompanies[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<typeof mockCompanies[0] | null>(null);

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Şirket Yönetimi</h1>
          <p className="page-subtitle">Birden fazla şirketi tek panelden yönetin</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Yeni Şirket Ekle
        </Button>
      </div>

      {/* Company Switcher */}
      <Card className="mb-6">
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-3">Aktif Şirket</p>
          <div className="flex flex-wrap gap-3">
            {companies.map(company => (
              <button
                key={company.id}
                onClick={() => setActiveCompany(company)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                  activeCompany.id === company.id
                    ? 'border-primary bg-blue-50'
                    : company.is_active
                    ? 'border-gray-200 hover:border-gray-300'
                    : 'border-gray-200 opacity-50'
                }`}
                disabled={!company.is_active}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: company.color }}
                >
                  {company.name.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="font-semibold">{company.name}</p>
                  <p className="text-xs text-gray-500">{company.is_active ? 'Aktif' : 'Pasif'}</p>
                </div>
                {activeCompany.id === company.id && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Active Company Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Toplam Kullanıcı"
          value={String(activeCompany.user_count)}
          icon={Users}
        />
        <StatCard
          title="Toplam Müşteri"
          value={String(activeCompany.customer_count)}
          icon={Users}
        />
        <StatCard
          title="Toplam Fatura"
          value={String(activeCompany.invoice_count)}
          icon={Receipt}
        />
        <StatCard
          title="Son Fatura"
          value="₺12.500"
          icon={Receipt}
          variant="success"
        />
      </div>

      {/* All Companies */}
      <Card>
        <Card.Header className="flex items-center justify-between">
          <h3 className="font-semibold">Tüm Şirketler</h3>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="divide-y divide-gray-100">
            {companies.map(company => (
              <div
                key={company.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: company.color }}
                  >
                    {company.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{company.name}</p>
                      {company.is_default && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          Varsayılan
                        </span>
                      )}
                      {!company.is_active && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          Pasif
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{company.tax_number} • {company.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Vergi Dairesi</p>
                    <p className="font-medium">Merkez</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCompany(company)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Company Features */}
      <Card className="mt-6">
        <Card.Header>
          <h3 className="font-semibold">Şirket Modülleri</h3>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map(feature => (
              <div
                key={feature.id}
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
              >
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                  <feature.icon className="w-5 h-5 text-gray-600" />
                </div>
                <span className="font-medium">{feature.label}</span>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Add Company Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Şirket Ekle"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Şirket Adı</label>
            <Input placeholder="Şirket adı..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Vergi Numarası</label>
              <Input placeholder="1234567890" />
            </div>
            <div>
              <label className="label">Vergi Dairesi</label>
              <Input placeholder="Vergi dairesi..." />
            </div>
          </div>
          <div>
            <label className="label">Adres</label>
            <Input placeholder="Şirket adresi..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Telefon</label>
              <Input placeholder="0212 555 1234" />
            </div>
            <div>
              <label className="label">E-posta</label>
              <Input type="email" placeholder="info@firma.com" />
            </div>
          </div>
          <div>
            <label className="label">Logo</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Logo yüklemek için tıklayın</p>
              <p className="text-xs text-gray-400">PNG, JPG (maks. 2MB)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="setDefault" className="w-4 h-4 rounded" />
            <label htmlFor="setDefault" className="text-sm">Varsayılan şirket olarak ayarla</label>
          </div>
        </div>
        <Modal.Footer className="mt-6">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>İptal</Button>
          <Button variant="primary">Şirket Ekle</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Company Modal */}
      <Modal
        isOpen={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
        title="Şirket Düzenle"
        size="lg"
      >
        {selectedCompany && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
                style={{ backgroundColor: selectedCompany.color }}
              >
                {selectedCompany.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedCompany.name}</h3>
                <p className="text-gray-500">{selectedCompany.tax_number}</p>
              </div>
            </div>
            <div>
              <label className="label">Şirket Adı</label>
              <Input defaultValue={selectedCompany.name} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Telefon</label>
                <Input defaultValue={selectedCompany.phone} />
              </div>
              <div>
                <label className="label">E-posta</label>
                <Input defaultValue={selectedCompany.email} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="companyActive"
                  defaultChecked={selectedCompany.is_active}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="companyActive" className="text-sm">Aktif şirket</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="companyDefault"
                  defaultChecked={selectedCompany.is_default}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="companyDefault" className="text-sm">Varsayılan şirket</label>
              </div>
            </div>
          </div>
        )}
        <Modal.Footer className="mt-6">
          <Button variant="secondary" onClick={() => setSelectedCompany(null)}>İptal</Button>
          <Button variant="primary">Kaydet</Button>
        </Modal.Footer>
      </Modal>
    </MainLayout>
  );
}