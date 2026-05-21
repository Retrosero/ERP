import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Building,
  User,
  Edit,
  Trash2,
  Loader2,
  Shield,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Card, Button, Badge, Alert } from '@/components/ui';
import { formatDate, cn } from '@/lib/utils';
import { userApi, DolibarrApiError } from '@/lib/dolibarr-hrm';
import type { User as UserType } from '@/lib/types/hrm';

export function PersonelDetay() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEmployee = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await userApi.get(parseInt(id));
      setEmployee(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Personel bilgileri yüklenirken hata oluştu');
      console.error('Employee fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  const handleDelete = async () => {
    if (!employee || !confirm('Bu personeli silmek istediğinizden emin misiniz?')) return;

    setIsDeleting(true);
    try {
      await userApi.delete(employee.id);
      navigate('/personel');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silme işlemi başarısız oldu');
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: number | undefined) => {
    if (status === 1) return <Badge variant="success">Aktif</Badge>;
    if (status === 0) return <Badge variant="danger">Pasif</Badge>;
    return <Badge variant="gray">Bilinmiyor</Badge>;
  };

  const getRoleBadge = (admin: number | undefined) => {
    if (admin === 1) return <Badge variant="warning">Yönetici</Badge>;
    return <Badge variant="info">Kullanıcı</Badge>;
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            <span className="text-slate-500">Personel bilgileri yükleniyor...</span>
          </div>
        </div>
      </>
    );
  }

  if (error || !employee) {
    return (
      <>
        <div className="space-y-6">
          <Alert type="error" title="Hata">
            {error || 'Personel bulunamadı'}
          </Alert>
          <Link to="/personel">
            <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
              Personel Listesine Dön
            </Button>
          </Link>
        </div>
      </>
    );
  }

  const fullName = `${employee.firstname || ''} ${employee.lastname || ''}`.trim();

  return (
    <>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/personel" className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Personel Listesine Dön</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to={`/personel/${employee.id}/duzenle`}>
              <Button variant="secondary" icon={<Edit className="w-4 h-4" />}>
                Düzenle
              </Button>
            </Link>
            <Button
              variant="danger"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleDelete}
              loading={isDeleting}
              disabled={isDeleting}
            >
              Sil
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert type="error" title="Hata">
            {error}
          </Alert>
        )}

        {/* Employee Profile Card */}
        <Card>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-teal-500/20">
                {employee.firstname?.charAt(0)?.toUpperCase() || '?'}
                {employee.lastname?.charAt(0)?.toUpperCase() || ''}
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {fullName || employee.name || 'İsimsiz Kullanıcı'}
                  </h1>
                  {employee.job && (
                    <p className="text-slate-500 mt-1">{employee.job}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    {getStatusBadge(employee.statut)}
                    {getRoleBadge(employee.admin)}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {employee.email && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">E-posta</p>
                      <p className="text-sm font-medium text-slate-900">{employee.email}</p>
                    </div>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Telefon</p>
                      <p className="text-sm font-medium text-slate-900">{employee.phone}</p>
                    </div>
                  </div>
                )}
                {employee.phone_mobile && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Cep Telefonu</p>
                      <p className="text-sm font-medium text-slate-900">{employee.phone_mobile}</p>
                    </div>
                  </div>
                )}
                {(employee.address || employee.town) && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Adres</p>
                      <p className="text-sm font-medium text-slate-900">
                        {[employee.address, employee.town].filter(Boolean).join(', ') || '-'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Work Information */}
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-teal-600" />
              Çalışma Bilgileri
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Kullanıcı Adı</span>
                <span className="font-medium text-slate-900">{employee.login || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Pozisyon</span>
                <span className="font-medium text-slate-900">{employee.job || '-'}</span>
              </div>
              {employee.dateemployment && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">İşe Başlama</span>
                  <span className="font-medium text-slate-900">
                    {typeof employee.dateemployment === 'string'
                      ? formatDate(employee.dateemployment)
                      : new Date(employee.dateemployment * 1000).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              )}
              {employee.dateemploymentend && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">İşten Çıkış</span>
                  <span className="font-medium text-slate-900">
                    {typeof employee.dateemploymentend === 'string'
                      ? formatDate(employee.dateemploymentend)
                      : new Date(employee.dateemploymentend * 1000).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              )}
              {employee.weeklyhours && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">Haftalık Çalışma</span>
                  <span className="font-medium text-slate-900">{employee.weeklyhours} saat</span>
                </div>
              )}
              {employee.salary !== undefined && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">Maaş</span>
                  <span className="font-medium text-slate-900">
                    {employee.salary ? `${employee.salary.toLocaleString('tr-TR')} ₺` : '-'}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Personal Information */}
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              Kişisel Bilgiler
            </h3>
            <div className="space-y-4">
              {employee.civility && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">Ünvan</span>
                  <span className="font-medium text-slate-900">{employee.civility}</span>
                </div>
              )}
              {employee.birth && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">Doğum Tarihi</span>
                  <span className="font-medium text-slate-900">
                    {formatDate(employee.birth)}
                  </span>
                </div>
              )}
              {employee.sex && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">Cinsiyet</span>
                  <span className="font-medium text-slate-900">
                    {employee.sex === 'M' ? 'Erkek' : employee.sex === 'F' ? 'Kadın' : '-'}
                  </span>
                </div>
              )}
              {employee.national_id && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">TC Kimlik No</span>
                  <span className="font-medium text-slate-900 font-mono">{employee.national_id}</span>
                </div>
              )}
              {employee.social_security_number && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">SSK No</span>
                  <span className="font-medium text-slate-900 font-mono">{employee.social_security_number}</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* System Information */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            Sistem Bilgileri
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">Oluşturulma</p>
              <p className="text-sm font-medium text-slate-900">
                {employee.datecreation ? formatDate(employee.datecreation) : '-'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">Son Güncelleme</p>
              <p className="text-sm font-medium text-slate-900">
                {employee.datemodification ? formatDate(employee.datemodification) : '-'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">Son Giriş</p>
              <p className="text-sm font-medium text-slate-900">
                {employee.last_login
                  ? typeof employee.last_login === 'string'
                    ? formatDate(employee.last_login)
                    : new Date(employee.last_login * 1000).toLocaleDateString('tr-TR')
                  : '-'}
              </p>
            </div>
          </div>
        </Card>

        {/* Notes */}
        {(employee.note_public || employee.note_private) && (
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Notlar</h3>
            {employee.note_public && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-1">Genel Not</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{employee.note_public}</p>
              </div>
            )}
            {employee.note_private && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Özel Not</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{employee.note_private}</p>
              </div>
            )}
          </Card>
        )}
      </div>
    </>
  );
}

export default PersonelDetay;