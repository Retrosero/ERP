import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Loader2,
  AlertCircle,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  Edit,
  Trash2,
} from 'lucide-react';
import { Card, Button, Badge, Alert } from '@/components/ui';
import { recruitmentApi, RECRUITMENT_STATUS } from '@/lib/dolibarr-hrm';
import type { RecruitmentJobPosition, RecruitmentCandidate } from '@/lib/types/hrm';

export function IlanDetay() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [position, setPosition] = useState<RecruitmentJobPosition | null>(null);
  const [candidates, setCandidates] = useState<RecruitmentCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosition = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await recruitmentApi.getPosition(parseInt(id));
      setPosition(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İlan yüklenirken hata oluştu');
      console.error('Position fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchCandidates = useCallback(async () => {
    if (!id) return;
    try {
      const data = await recruitmentApi.listCandidates({ job_id: parseInt(id) });
      setCandidates(data);
    } catch (err) {
      console.error('Candidates fetch error:', err);
    }
  }, [id]);

  useEffect(() => {
    fetchPosition();
    fetchCandidates();
  }, [fetchPosition, fetchCandidates]);

  const getStatusBadge = (status: number | undefined) => {
    const statusValue = status || 0;
    if (statusValue === RECRUITMENT_STATUS.OPEN.value) return <Badge variant="success">Açık</Badge>;
    if (statusValue === RECRUITMENT_STATUS.CLOSED.value) return <Badge variant="gray">Kapalı</Badge>;
    if (statusValue === RECRUITMENT_STATUS.DRAFT.value) return <Badge variant="warning">Taslak</Badge>;
    if (statusValue === RECRUITMENT_STATUS.CANCELLED.value) return <Badge variant="danger">İptal</Badge>;
    return <Badge variant="gray">Bilinmiyor</Badge>;
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Belirtilmedi';
    if (min && max) return `${min.toLocaleString('tr-TR')} - ${max.toLocaleString('tr-TR')} TL`;
    if (min) return `${min.toLocaleString('tr-TR')} TL'den başlayan`;
    return `${max?.toLocaleString('tr-TR')} TL'ye kadar`;
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('tr-TR');
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            <span className="text-slate-500">İlan yükleniyor...</span>
          </div>
        </div>
      </>
    );
  }

  if (error || !position) {
    return (
      <>
        <div className="space-y-6">
          <Alert type="error" title="Hata">
            {error || 'İlan bulunamadı'}
          </Alert>
          <Link to="/ise-alim">
            <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
              İş İlanlarına Dön
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
          <Link to="/ise-alim" className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">İş İlanlarına Dön</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to={`/ise-alim/ilan/${position.id}/duzenle`}>
              <Button variant="secondary" icon={<Edit className="w-4 h-4" />}>
                Düzenle
              </Button>
            </Link>
          </div>
        </div>

        {/* Position Detail Card */}
        <Card>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                <Briefcase className="w-12 h-12" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {position.label || 'İsimsiz Pozisyon'}
                  </h1>
                  <p className="text-slate-500 mt-1">İlan No: #{position.id}</p>
                  <div className="flex items-center gap-2 mt-3">
                    {getStatusBadge(position.status)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {position.location && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Konum</p>
                      <p className="text-sm font-medium text-slate-900">{position.location}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Ücret Aralığı</p>
                    <p className="text-sm font-medium text-slate-900">{formatSalary(position.salary_min, position.salary_max)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Description */}
        {position.description && (
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Açıklama</h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{position.description}</p>
          </Card>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">İlan Bilgileri</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Sözleşme Türü</span>
                <span className="font-medium text-slate-900">{position.contract_type || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Başlangıç Tarihi</span>
                <span className="font-medium text-slate-900">{formatDate(position.date_start)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Bitiş Tarihi</span>
                <span className="font-medium text-slate-900">{formatDate(position.date_end)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Kaç Kişilik</span>
                <span className="font-medium text-slate-900">{position.nb_candidates || 1}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Anahtar Kelimeler</h3>
            <div className="flex flex-wrap gap-2">
              {position.keywords ? (
                position.keywords.split(',').map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-lg bg-slate-100 text-sm text-slate-700"
                  >
                    {keyword.trim()}
                  </span>
                ))
              ) : (
                <span className="text-slate-500">Anahtar kelime yok</span>
              )}
            </div>
          </Card>
        </div>

        {/* Candidates */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Adaylar ({candidates.length})
          </h3>
          {candidates.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Henüz aday yok</p>
              <Link to={`/ise-alim/ilan/${position.id}/aday/yeni`}>
                <Button variant="secondary" size="sm" className="mt-3">
                  Yeni Aday Ekle
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Aday
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      E-posta
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Durum
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="font-medium text-slate-900">
                          {candidate.lastname} {candidate.firstname}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-600">{candidate.email || '-'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="info">{candidate.status || 'Yeni'}</Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link to={`/ise-alim/aday/${candidate.id}`}>
                          <Button variant="ghost" size="sm">
                            Detay
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

export default IlanDetay;