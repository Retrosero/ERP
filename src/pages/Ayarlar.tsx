import { useState } from 'react';
import { Settings, Link2, Users, Bell, Shield, Database, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, Button, Input, Select, Alert } from '@/components/ui';
import { useApi } from '@/contexts/ApiContext';

// Settings sections
const settingsSections = [
  { id: 'dolibarr', label: 'Dolibarr Bağlantısı', icon: Link2 },
  { id: 'efatura', label: 'e-Fatura Ayarları', icon: Settings },
  { id: 'users', label: 'Kullanıcılar', icon: Users },
  { id: 'notifications', label: 'Bildirimler', icon: Bell },
  { id: 'security', label: 'Güvenlik', icon: Shield },
  { id: 'database', label: 'Veritabanı', icon: Database },
];

// e-Fatura provider types
const efaturaProviders = [
  { value: 'nes', label: 'NES (Logo, Mikro, ETA Uyumlu)' },
  { value: 'document', label: 'Document (Türkiye Belge)' },
  { value: 'arkapi', label: 'ARKAPI' },
  { value: 'custom', label: 'Özel API' },
];

export function Ayarlar() {
  const { config, updateConfig, testConnection, isLoading } = useApi();
  const [activeSection, setActiveSection] = useState('dolibarr');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form states
  const [dolibarrSettings, setDolibarrSettings] = useState({
    baseUrl: config.baseUrl || 'https://erp.example.com',
    apiKey: config.apiKey || '',
    apiPrefix: config.apiPrefix || '/api/index.php',
    timeout: String(config.timeout || 30000),
  });

  // e-Fatura specific settings
  const [efaturaSettings, setEfaturaSettings] = useState({
    provider: 'nes',
    apiUrl: 'https://api.nes.com.tr/v1',
    apiKey: '',
    vkn: '', // Vergi Kimlik Numarası
    alias: '', // e-Fatura alias adresi
    enableAutoSign: true,
  });

  const handleTestConnection = async () => {
    updateConfig({
      baseUrl: dolibarrSettings.baseUrl,
      apiKey: dolibarrSettings.apiKey,
      apiPrefix: dolibarrSettings.apiPrefix,
      timeout: parseInt(dolibarrSettings.timeout) || 30000,
    });
    const success = await testConnection();
    return success;
  };

  const handleSaveDolibarr = async () => {
    setSaving(true);
    updateConfig({
      baseUrl: dolibarrSettings.baseUrl,
      apiKey: dolibarrSettings.apiKey,
      apiPrefix: dolibarrSettings.apiPrefix,
      timeout: parseInt(dolibarrSettings.timeout) || 30000,
    });
    // Also save API key to sessionStorage for security
    sessionStorage.setItem('dolibarr_api_key', dolibarrSettings.apiKey);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 500);
  };

  const handleSaveEfatura = async () => {
    setSaving(true);
    // Save e-Fatura settings to localStorage
    localStorage.setItem('efatura_settings', JSON.stringify(efaturaSettings));
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
          <p className="text-sm text-gray-500 mt-1">
            Uygulama ve Dolibarr/e-Fatura bağlantı ayarları
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <Card padding="sm">
            <nav className="space-y-1">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeSection === 'dolibarr' && (
            <Card>
              <CardHeader>
                <CardTitle>Dolibarr Bağlantısı</CardTitle>
              </CardHeader>
              <div className="space-y-6">
                {saved && (
                  <Alert type="success" title="Ayarlar kaydedildi">
                    Dolibarr bağlantı ayarları başarıyla güncellendi.
                  </Alert>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Bilgi:</strong> Dolibarr API anahtarınız tarayıcınızda yerel olarak saklanır ve güvenlik amacıyla şifrelenmez.
                    Paylaşılan bilgisayarlarda dikkatli olunuz.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Dolibarr URL"
                    value={dolibarrSettings.baseUrl}
                    onChange={(e) => setDolibarrSettings({ ...dolibarrSettings, baseUrl: e.target.value })}
                    placeholder="https://erp.firmaadi.com"
                    hint="Dolibarr kurulumunun URL adresi"
                  />
                  <Input
                    label="API Key"
                    type="password"
                    value={dolibarrSettings.apiKey}
                    onChange={(e) => setDolibarrSettings({ ...dolibarrSettings, apiKey: e.target.value })}
                    placeholder="Dolibarr API anahtarınız"
                    hint="Dolibarr admin panelinden aldığınız API anahtarı"
                  />
                  <Input
                    label="API Prefix"
                    value={dolibarrSettings.apiPrefix}
                    onChange={(e) => setDolibarrSettings({ ...dolibarrSettings, apiPrefix: e.target.value })}
                    placeholder="/api/index.php"
                  />
                  <Input
                    label="Timeout (ms)"
                    type="number"
                    value={dolibarrSettings.timeout}
                    onChange={(e) => setDolibarrSettings({ ...dolibarrSettings, timeout: e.target.value })}
                    placeholder="30000"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Bağlantı Durumu</p>
                    <div className="flex items-center gap-2 mt-1">
                      {config.isConnected ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <p className="text-sm text-green-600">Bağlantı başarılı</p>
                        </>
                      ) : config.lastTested ? (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          <p className="text-sm text-red-600">Bağlantı başarısız</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">Henüz test edilmedi</p>
                      )}
                    </div>
                    {config.lastTested && (
                      <p className="text-xs text-gray-400 mt-1">
                        Son test: {new Date(config.lastTested).toLocaleString('tr-TR')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={handleTestConnection} loading={isLoading}>
                      Bağlantıyı Test Et
                    </Button>
                    <Button onClick={handleSaveDolibarr} loading={saving}>
                      Kaydet
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'efatura' && (
            <Card>
              <CardHeader>
                <CardTitle>e-Fatura Ayarları</CardTitle>
              </CardHeader>
              <div className="space-y-6">
                {saved && (
                  <Alert type="success" title="e-Fatura ayarları kaydedildi">
                    e-Fatura bağlantı ayarları başarıyla güncellendi.
                  </Alert>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Dikkat:</strong> e-Fatura işlemleri için gerekli entegrasyonu yapılandırınız.
                    NES API kullanıyorsanız, NES tarafından sağlanan API anahtarını ve Vergi Kimlik Numaranızı giriniz.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="e-Fatura Sağlayıcı"
                    value={efaturaSettings.provider}
                    onChange={(value) => setEfaturaSettings({ ...efaturaSettings, provider: value })}
                    options={efaturaProviders}
                  />
                  <Input
                    label="API URL"
                    value={efaturaSettings.apiUrl}
                    onChange={(e) => setEfaturaSettings({ ...efaturaSettings, apiUrl: e.target.value })}
                    placeholder="https://api.nes.com.tr/v1"
                    hint="e-Fatura sağlayıcınızın API adresi"
                  />
                  <Input
                    label="API Key"
                    type="password"
                    value={efaturaSettings.apiKey}
                    onChange={(e) => setEfaturaSettings({ ...efaturaSettings, apiKey: e.target.value })}
                    placeholder="e-Fatura API anahtarınız"
                    hint="Sağlayıcınızdan aldığınız API anahtarı"
                  />
                  <Input
                    label="Vergi Kimlik Numarası (VKN)"
                    value={efaturaSettings.vkn}
                    onChange={(e) => setEfaturaSettings({ ...efaturaSettings, vkn: e.target.value })}
                    placeholder="1234567890"
                    hint="Firma vergi kimlik numaranız"
                  />
                  <Input
                    label="e-Fatura Alias"
                    value={efaturaSettings.alias}
                    onChange={(e) => setEfaturaSettings({ ...efaturaSettings, alias: e.target.value })}
                    placeholder="test@efatura.gib.gov.tr"
                    hint="e-Fatura adresiniz (GİB alias)"
                  />
                </div>

                <div className="flex items-center justify-between py-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="autoSign"
                      checked={efaturaSettings.enableAutoSign}
                      onChange={(e) => setEfaturaSettings({ ...efaturaSettings, enableAutoSign: e.target.checked })}
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                    <label htmlFor="autoSign" className="text-sm text-gray-700">
                      Otomatik imzalama kullan
                    </label>
                  </div>
                  <Button onClick={handleSaveEfatura} loading={saving}>
                    Kaydet
                  </Button>
                </div>

                {/* API Test Button */}
                <div className="pt-4 border-t border-gray-100">
                  <Button variant="secondary" onClick={() => alert('e-Fatura bağlantı testi yakında eklenecek')}>
                    e-Fatura Bağlantısını Test Et
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'users' && (
            <Card>
              <CardHeader>
                <CardTitle>Kullanıcı Yönetimi</CardTitle>
              </CardHeader>
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Kullanıcı yönetimi yakında eklenecek</p>
                <p className="text-sm text-gray-400 mt-2">
                  Şu an Dolibarr'ın kullanıcı sistemi kullanılmaktadır.
                </p>
              </div>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Bildirim Ayarları</CardTitle>
              </CardHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Kritik Stok Uyarıları</p>
                    <p className="text-sm text-gray-500">Stok seviyesi kritik düzeye düştüğünde bildirim al</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Yeni Sipariş Bildirimleri</p>
                    <p className="text-sm text-gray-500">Yeni sipariş oluşturulduğunda bildirim al</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Fatura Ödeme Hatırlatıcıları</p>
                    <p className="text-sm text-gray-500">Vadesi yaklaşan faturalar için hatırlatıcı al</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">e-Fatura Uyarıları</p>
                    <p className="text-sm text-gray-500">e-Fatura gelen/giden durumu hakkında bildirim al</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Güvenlik Ayarları</CardTitle>
              </CardHeader>
              <div className="space-y-6">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Oturum Zaman Aşımı</p>
                    <p className="text-sm text-gray-500">Belirli bir süre işlem yapılmadığında oturumu kapat</p>
                  </div>
                  <Select
                    options={[
                      { value: '30', label: '30 dakika' },
                      { value: '60', label: '1 saat' },
                      { value: '120', label: '2 saat' },
                      { value: '480', label: '8 saat' },
                    ]}
                    defaultValue="60"
                    className="w-40"
                    onChange={() => {}}
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">İki Faktörlü Doğrulama</p>
                    <p className="text-sm text-gray-500">Hesabınıza girişte ek doğrulama kullan</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">API Anahtar Şifreleme</p>
                    <p className="text-sm text-gray-500">API anahtarlarınızı tarayıcıda şifreli sakla</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'database' && (
            <Card>
              <CardHeader>
                <CardTitle>Veritabanı Ayarları</CardTitle>
              </CardHeader>
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Veritabanı bağlantısı ayarları</p>
                <p className="text-sm text-gray-400 mt-2">
                  Bu ayarlar .env dosyasından yönetilmektedir.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default Ayarlar;