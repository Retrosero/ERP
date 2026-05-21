import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, Button, Badge, Alert, Modal } from '@/components/ui';
import { recruitmentApi, CANDIDATE_STATUS } from '@/lib/dolibarr-hrm';
import type { RecruitmentCandidate, RecruitmentJobPosition } from '@/lib/types/hrm';

export function AdayDetay() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<RecruitmentCandidate | null>(null);
  const [jobPosition, setJobPosition] = useState<RecruitmentJobPosition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [refuseNote, setRefuseNote] = useState('');

  const fetchCandidate = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await recruitmentApi.getCandidate(parseInt(id));
      setCandidate(data);

      // Fetch job position if available
      if (data.fk_job) {
        const position = await recruitmentApi.getPosition(data.fk_job);
        setJobPosition(position);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aday yüklenirken hata oluştu');
      console.error('Candidate fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  const handleAccept = async () => {
    if (!candidate) return;
    if (!confirm('Bu adayı kabul etmek istediğinizden emin misiniz?')) return;

    setIsProcessing(true);
    try {
      await recruitmentApi.updateCandidate(candidate.id, { status: CANDIDATE_STATUS.ACCEPTED.value });
      await fetchCandidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız oldu');
      setIsProcessing(false);
    }
  };

  const handleRefuse = async () => {
    if (!candidate) return;

    setIsProcessing(true);
    try {
      await recruitmentApi.updateCandidate(candidate.id, {
        status: CANDIDATE_STATUS.REFUSED.value,
        description: refuseNote
      });
      setShowRefuseModal(false);
      setRefuseNote('');
      await fetchCandidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız oldu');
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: number | undefined) => {
    const statusValue = status || 0;
    if (statusValue === CANDIDATE_STATUS.DRAFT.value) return <Badge variant="gray">Yeni</Badge>;
    if (statusValue === CANDIDATE_STATUS.INTERVIEW.value) return <Badge variant="warning">Mülakat</Badge>;
    if (statusValue === CANDIDATE_STATUS.ACCEPTED.value) return <Badge variant="success">Kabul Edildi</Badge>;
    if (statusValue === CANDIDATE_STATUS.REFUSED.value) return <Badge variant="danger">Reddedildi</Badge>;
    if (statusValue === CANDIDATE_STATUS.WITHDRAWN.value) return <Badge variant="gray">Çekildi</Badge>;
    return <Badge variant="gray">Bilinmiyor</Badge>;
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('tr-TR');
  };

  const canProcess = candidate && (candidate.status === CANDIDATE_STATUS.DRAFT.value || candidate.status === CANDIDATE_STATUS.INTERVIEW.value);

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            <span className="text-slate-500">Aday yükleniyor...</span>
          </div>
        </div>
      </>
    );
  }

  if (error || !candidate) {
    return (
      <>
        <div className="space-y-6">
          <Alert type="error" title="Hata">
            {error || 'Aday bulunamadı'}
          </Alert>
          <Link to="/ise-alim/adaylar">
            <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
              Adaylara Dön
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
          <Link to="/ise-alim/adaylar" className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Adaylara Dön</span>
          </Link>
          {canProcess && (
            <div className="flex items-center gap-3">
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
                onClick={handleAccept}
                loading={isProcessing}
                disabled={isProcessing}
              >
                Kabul Et
              </Button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <Alert type="error" title="Hata">
            {error}
          </Alert>
        )}

        {/* Candidate Detail Card */}
        <Card>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                <Users className="w-12 h-12" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {candidate.lastname} {candidate.firstname}
                  </h1>
                  <p className="text-slate-500 mt-1">Aday No: #{candidate.id}</p>
                  <div className="flex items-center gap-2 mt-3">
                    {getStatusBadge(candidate.status)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {candidate.email && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">E-posta</p>
                      <p className="text-sm font-medium text-slate-900">{candidate.email}</p>
                    </div>
                  </div>
                )}
                {candidate.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Telefon</p>
                      <p className="text-sm font-medium text-slate-900">{candidate.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Job Position */}
        {jobPosition && (
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-teal-600" />
              Başvurulan Pozisyon
            </h3>
            <Link
              to={`/ise-alim/ilan/${jobPosition.id}`}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div>
                <p className="font-medium text-slate-900">{jobPosition.label}</p>
                {jobPosition.location && (
                  <p className="text-sm text-slate-500 mt-1">{jobPosition.location}</p>
                )}
              </div>
              <Badge variant="info">{jobPosition.status === 1 ? 'Açık' : 'Kapalı'}</Badge>
            </Link>
          </Card>
        )}

        {/* Personal Information */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Kişisel Bilgiler</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">Doğum Tarihi</span>
              <span className="font-medium text-slate-900">{formatDate(candidate.birth)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">Doğum Yeri</span>
              <span className="font-medium text-slate-900">{candidate.place_of_birth || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">Ülke</span>
              <span className="font-medium text-slate-900">{candidate.country || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">Şehir</span>
              <span className="font-medium text-slate-900">{candidate.state || '-'}</span>
            </div>
          </div>
        </Card>

        {/* Description and Notes */}
        {(candidate.description || candidate.motivations) && (
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Açıklama ve Notlar</h3>
            {candidate.description && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-1">Notlar</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{candidate.description}</p>
              </div>
            )}
            {candidate.motivations && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Motivasyon</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{candidate.motivations}</p>
              </div>
            )}
          </Card>
        )}

        {/* System Information */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Sistem Bilgileri</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">Oluşturulma</p>
              <p className="text-sm font-medium text-slate-900">{formatDate(candidate.date_creation)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">Son Güncelleme</p>
              <p className="text-sm font-medium text-slate-900">{formatDate(candidate.date_modification)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">Referans</p>
              <p className="text-sm font-medium text-slate-900">{candidate.ref || '-'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Refuse Modal */}
      {showRefuseModal && (
        <Modal
          isOpen={showRefuseModal}
          onClose={() => setShowRefuseModal(false)}
          title="Adayı Reddet"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reddetme Nedeni
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all resize-none"
                rows={4}
                placeholder="Adayı reddetme nedenini açıklayın..."
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
                disabled={isProcessing}
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

export default AdayDetay;