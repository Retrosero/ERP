import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Loader2,
  ChevronRight,
  Mail,
  Phone,
  Briefcase,
} from 'lucide-react';
import { Card, Button, Input, Select, Badge } from '@/components/ui';
import { recruitmentApi, CANDIDATE_STATUS } from '@/lib/dolibarr-hrm';
import type { RecruitmentCandidate } from '@/lib/types/hrm';

export function AdayListesi() {
  const [candidates, setCandidates] = useState<RecruitmentCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { limit: 100 };
      if (statusFilter) params.status = parseInt(statusFilter);
      const data = await recruitmentApi.listCandidates(params);
      setCandidates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Adaylar yüklenirken hata oluştu');
      console.error('Candidates fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const getStatusBadge = (status: number | undefined) => {
    const statusValue = status || 0;
    if (statusValue === CANDIDATE_STATUS.DRAFT.value) return <Badge variant="gray">Yeni</Badge>;
    if (statusValue === CANDIDATE_STATUS.INTERVIEW.value) return <Badge variant="warning">Mülakat</Badge>;
    if (statusValue === CANDIDATE_STATUS.ACCEPTED.value) return <Badge variant="success">Kabul Edildi</Badge>;
    if (statusValue === CANDIDATE_STATUS.REFUSED.value) return <Badge variant="danger">Reddedildi</Badge>;
    if (statusValue === CANDIDATE_STATUS.WITHDRAWN.value) return <Badge variant="gray">Çekildi</Badge>;
    return <Badge variant="gray">Bilinmiyor</Badge>;
  };

  const filteredCandidates = candidates.filter(candidate => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesName = `${candidate.lastname} ${candidate.firstname}`.toLowerCase().includes(search);
      const matchesEmail = candidate.email?.toLowerCase().includes(search) || false;
      const matchesPhone = candidate.phone?.includes(search) || false;
      if (!matchesName && !matchesEmail && !matchesPhone) return false;
    }
    return true;
  });

  const stats = {
    total: candidates.length,
    new: candidates.filter(c => c.status === CANDIDATE_STATUS.DRAFT.value).length,
    interview: candidates.filter(c => c.status === CANDIDATE_STATUS.INTERVIEW.value).length,
    accepted: candidates.filter(c => c.status === CANDIDATE_STATUS.ACCEPTED.value).length,
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            <span className="text-slate-500">Adaylar yükleniyor...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Adaylar</h1>
            <p className="text-slate-500 mt-1">İşe alım adaylarını görüntüleyin ve yönetin</p>
          </div>
          <Link to="/ise-alim/aday/yeni">
            <Button icon={<Plus className="w-4 h-4" />}>
              Yeni Aday
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500">Toplam Aday</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.new}</p>
                <p className="text-sm text-slate-500">Yeni</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.interview}</p>
                <p className="text-sm text-slate-500">Mülakat</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.accepted}</p>
                <p className="text-sm text-slate-500">Kabul Edildi</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Aday ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="!pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select
                options={[
                  { value: '', label: 'Tüm Durumlar' },
                  { value: CANDIDATE_STATUS.DRAFT.value.toString(), label: 'Yeni' },
                  { value: CANDIDATE_STATUS.INTERVIEW.value.toString(), label: 'Mülakat' },
                  { value: CANDIDATE_STATUS.ACCEPTED.value.toString(), label: 'Kabul Edildi' },
                  { value: CANDIDATE_STATUS.REFUSED.value.toString(), label: 'Reddedildi' },
                ]}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
              />
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="!p-4">
            <div className="flex items-center gap-3 text-red-600">
              <span>{error}</span>
            </div>
          </Card>
        )}

        {/* Candidates Table */}
        <Card>
          {filteredCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aday bulunamadı</h3>
              <p className="text-slate-500 mb-6">Henüz aday eklenmemiş. Yeni aday eklemek için butona tıklayın.</p>
              <Link to="/ise-alim/aday/yeni">
                <Button icon={<Plus className="w-4 h-4" />}>
                  Yeni Aday
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
                      İletişim
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Pozisyon
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
                  {filteredCandidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium">
                            {(candidate.firstname?.[0] || '') + (candidate.lastname?.[0] || '')}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {candidate.lastname} {candidate.firstname}
                            </p>
                            <p className="text-xs text-slate-500">#{candidate.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {candidate.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail className="w-3 h-3" />
                              <span>{candidate.email}</span>
                            </div>
                          )}
                          {candidate.phone && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="w-3 h-3" />
                              <span>{candidate.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-700">
                          {candidate.fk_job || '-'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(candidate.status)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link to={`/ise-alim/aday/${candidate.id}`}>
                          <Button variant="ghost" size="sm" icon={<ChevronRight className="w-4 h-4" />} iconPosition="right">
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

export default AdayListesi;