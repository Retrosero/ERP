import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  User,
  FileText,
  Loader2,
  AlertCircle,
  Ban,
  Edit,
} from 'lucide-react';
import { Card, Button, Badge, Alert, Modal } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { holidayApi, HOLIDAY_STATUS, DolibarrApiError } from '@/lib/dolibarr-hrm';
import type { Holiday, LeaveType } from '@/lib/types/hrm';

export function IzinDetay() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [holiday, setHoliday] = useState<Holiday | null>(null);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [refuseNote, setRefuseNote] = useState('');

  const fetchHoliday = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await holidayApi.get(parseInt(id));
      setHoliday(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İzin talebi yüklenirken hata oluştu');
      console.error('Holiday fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      const types = await holidayApi.getTypes();
      setLeaveTypes(types);
    } catch (err) {
      console.error('Leave types fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchHoliday();
    fetchLeaveTypes();
  }, [fetchHoliday, fetchLeaveTypes]);

  const handleApprove = async () => {
    if (!holiday) return;
    if (!confirm('Bu izin talebini onaylamak istediğinizden emin misiniz?')) return;

    setIsProcessing(true);
    try {
      await holidayApi.approve(holiday.id);
      await fetchHoliday();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onay işlemi başarısız oldu');
      setIsProcessing(false);
    }
  };

  const handleRefuse = async () => {
    if (!holiday) return;
    if (!refuseNote.trim()) {
      setError('Reddetme nedeni girilmesi zorunludur');
      return;
    }

    setIsProcessing(true);
    try {
      await holidayApi.refuse(holiday.id, refuseNote);
      setShowRefuseModal(false);
      setRefuseNote('');
      await fetchHoliday();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reddetme işlemi başarısız oldu');
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!holiday) return;
    if (!confirm('Bu izin talebini iptal etmek istediğinizden emin misiniz?')) return;

    setIsProcessing(true);
    try {
      await holidayApi.cancel(holiday.id);
      await fetchHoliday();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İptal işlemi başarısız oldu');
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: number | undefined) => {
    const statusValue = status || 0;
    if (statusValue === HOLIDAY_STATUS.DRAFT.value) return <Badge variant="gray">Taslak</Badge>;
    if (statusValue === HOLIDAY_STATUS.VALIDATED.value) return <Badge variant="warning">Bekliyor</Badge>;
    if (statusValue === HOLIDAY_STATUS.APPROVED.value) return <Badge variant="success">Onaylandı</Badge>;
    if (statusValue === HOLIDAY_STATUS.REFUSED.value) return <Badge variant="danger">Reddedildi</Badge>;
    if (statusValue === HOLIDAY_STATUS.CANCELLED.value) return <Badge variant="gray">İptal Edildi</Badge>;
    return <Badge variant="gray">Bilinmiyor</Badge>;
  };

  const getLeaveTypeLabel = (typeId: number) => {
    const type = leaveTypes.find(t => t.id === typeId);
    return type?.label || typeId.toString();
  };

  const formatDate = (date: string | number) => {
    if (!date) return '-';
    if (typeof date === 'number') {
      return new Date(date * 1000).toLocaleDateString('tr-TR');
    }
    return new Date(date).toLocaleDateString('tr-TR');
  };

  const canApprove = holiday?.statuts === HOLIDAY_STATUS.VALIDATED.value;
  const canCancel = (holiday?.statuts === HOLIDAY_STATUS.VALIDATED.value || holiday?.statuts === HOLIDAY_STATUS.APPROVED.value);

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            <span className="text-slate-500">İzin talebi yükleniyor...</span>
          </div>
        </div>
      </>
    );
  }

  if (error || !holiday) {
    return (
      <>
        <div className="space-y-6">
          <Alert type="error" title="Hata">
            {error || 'İzin talebi bulunamadı'}
          </Alert>
          <Link to="/izin-talepleri">
            <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
              İzin Taleplerine Dön
            </Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/izin-talepleri" className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">İzin Taleplerine Dön</span>
          </Link>
          <div className="flex items-center gap-3">
            {canApprove && (
              <>
                <Button
                  variant="danger"
                  icon={<XCircle className="w-4 h-4" />}
                  onClick={() => setShowRefuseModal(true)}
                  disabled={isProcessing}
                >
                  Reddet
                </Button>
                <Button
                  variant="success"
                  icon={<CheckCircle className="w-4 h-4" />}
                  onClick={handleApprove}
                  loading={isProcessing}
                  disabled={isProcessing}
                >
                  Onayla
                </Button>
              </>
            )}
            {canCancel && (
              <Button
                variant="secondary"
                icon={<Ban className="w-4 h-4" />}
                onClick={handleCancel}
                loading={isProcessing}
                disabled={isProcessing}
              >
                İptal Et
              </Button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert type="error" title="Hata">
            {error}
          </Alert>
        )}

        {/* Holiday Detail Card */}
        <Card>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                <Calendar className="w-12 h-12" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {holiday.libelle_type || getLeaveTypeLabel(holiday.fk_type)}
                  </h1>
                  <p className="text-slate-500 mt-1">Talep No: #{holiday.id}</p>
                  <div className="flex items-center gap-2 mt-3">
                    {getStatusBadge(holiday.statuts)}
                  </div>
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                    <User className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Personel ID</p>
                    <p className="text-sm font-medium text-slate-900">#{holiday.fk_user}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Süre</p>
                    <p className="text-sm font-medium text-slate-900">{holiday.duration} gün</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Information */}
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              Tarih Bilgileri
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Başlangıç</span>
                <span className="font-medium text-slate-900">{formatDate(holiday.date_debut)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Bitiş</span>
                <span className="font-medium text-slate-900">{formatDate(holiday.date_fin)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Yarım Gün</span>
                <span className="font-medium text-slate-900">
                  {holiday.halfday === 1 ? 'Sabah' : holiday.halfday === 2 ? 'Öğleden Sonra' : 'Hayır'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Toplam Süre</span>
                <span className="font-medium text-slate-900">{holiday.duration} gün</span>
              </div>
            </div>
          </Card>

          {/* Approval Information */}
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-teal-600" />
              Onay Bilgileri
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Talep Tarihi</span>
                <span className="font-medium text-slate-900">{formatDate(holiday.date_created)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Onaylayan</span>
                <span className="font-medium text-slate-900">
                  {holiday.fk_user_appoved ? `#${holiday.fk_user_appoved}` : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Onay Tarihi</span>
                <span className="font-medium text-slate-900">{formatDate(holiday.date_approve)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Reddeden</span>
                <span className="font-medium text-slate-900">
                  {holiday.fk_user_cancel ? `#${holiday.fk_user_cancel}` : '-'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Description and Notes */}
        {(holiday.note_public || holiday.note_private) && (
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Açıklama ve Notlar
            </h3>
            {holiday.note_public && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-1">Genel Not</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{holiday.note_public}</p>
              </div>
            )}
            {holiday.note_private && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Özel Not</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{holiday.note_private}</p>
              </div>
            )}
          </Card>
        )}

        {/* System Information */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            Sistem Bilgileri
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">Oluşturulma</p>
              <p className="text-sm font-medium text-slate-900">{formatDate(holiday.date_created)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">Son Güncelleme</p>
              <p className="text-sm font-medium text-slate-900">{formatDate(holiday.date_modified)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">Referans</p>
              <p className="text-sm font-medium text-slate-900">{holiday.ref || '-'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Refuse Modal */}
      {showRefuseModal && (
        <Modal
          isOpen={showRefuseModal}
          onClose={() => setShowRefuseModal(false)}
          title="İzin Talebini Reddet"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reddetme Nedeni <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all resize-none"
                rows={4}
                placeholder="İzin talebini reddetme nedenini açıklayın..."
                value={refuseNote}
                onChange={(e) => setRefuseNote(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowRefuseModal(false)}>
                İptal
              </Button>
              <Button
                variant="danger"
                onClick={handleRefuse}
                loading={isProcessing}
                disabled={isProcessing || !refuseNote.trim()}
              >
                Reddet
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default IzinDetay;