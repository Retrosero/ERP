import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Receipt,
  Clock,
  Loader2,
  AlertCircle,
  User,
  Calendar,
  FileText,
  Ban,
} from 'lucide-react';
import { Card, Button, Badge, Alert, Modal } from '@/components/ui';
import { expenseReportApi, EXPENSE_STATUS } from '@/lib/dolibarr-hrm';
import type { ExpenseReport } from '@/lib/types/hrm';

export function HarcamaDetay() {
  const { id } = useParams<{ id: string }>();
  const isCreateMode = !id;
  const navigate = useNavigate();
  const [expense, setExpense] = useState<ExpenseReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [refuseNote, setRefuseNote] = useState('');
  const [createForm, setCreateForm] = useState({
    fk_user_author: '',
    amount: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const fetchExpense = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await expenseReportApi.get(parseInt(id));
      setExpense(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Harcama raporu yüklenirken hata oluştu');
      console.error('Expense report fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExpense();
  }, [fetchExpense]);

  const handleCreateExpense = async () => {
    if (!createForm.fk_user_author || !createForm.amount || !createForm.description.trim()) {
      setError('Personel, tutar ve açıklama alanları zorunludur.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const payload = {
        fk_user_author: Number(createForm.fk_user_author),
        date_debut: createForm.date,
        date_fin: createForm.date,
        note_public: createForm.description,
        lines: [
          {
            date: createForm.date,
            libelle: createForm.description,
            qty: 1,
            value_unit: Number(createForm.amount),
            value_unit_ht: Number(createForm.amount),
            tva_tx: 0,
          },
        ],
      };
      const created = await expenseReportApi.create(payload);
      navigate(`/harcama-raporlari/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Harcama kaydı oluşturulamadı');
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!expense) return;
    if (!confirm('Bu harcama raporunu onaylamak istediğinizden emin misiniz?')) return;

    setIsProcessing(true);
    try {
      await expenseReportApi.approve(expense.id);
      await fetchExpense();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onay işlemi başarısız oldu');
      setIsProcessing(false);
    }
  };

  const handleRefuse = async () => {
    if (!expense) return;
    if (!refuseNote.trim()) {
      setError('Reddetme nedeni girilmesi zorunludur');
      return;
    }

    setIsProcessing(true);
    try {
      await expenseReportApi.refuse(expense.id, refuseNote);
      setShowRefuseModal(false);
      setRefuseNote('');
      await fetchExpense();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reddetme işlemi başarısız oldu');
      setIsProcessing(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!expense) return;
    if (!confirm('Bu harcama raporunu ödendi olarak işaretlemek istediğinizden emin misiniz?')) return;

    setIsProcessing(true);
    try {
      await expenseReportApi.markPaid(expense.id);
      await fetchExpense();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödeme işlemi başarısız oldu');
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!expense) return;
    if (!confirm('Bu harcama raporunu iptal etmek istediğinizden emin misiniz?')) return;

    setIsProcessing(true);
    try {
      await expenseReportApi.delete(expense.id);
      navigate('/harcama-raporlari');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İptal işlemi başarısız oldu');
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: number | undefined) => {
    const statusValue = status || 0;
    if (statusValue === EXPENSE_STATUS.DRAFT.value) return <Badge variant="gray">Taslak</Badge>;
    if (statusValue === EXPENSE_STATUS.VALIDATED.value) return <Badge variant="warning">Bekliyor</Badge>;
    if (statusValue === EXPENSE_STATUS.APPROVED.value) return <Badge variant="success">Onaylandı</Badge>;
    if (statusValue === EXPENSE_STATUS.REFUSED.value) return <Badge variant="danger">Reddedildi</Badge>;
    if (statusValue === EXPENSE_STATUS.PAID.value) return <Badge variant="info">Ödendi</Badge>;
    if (statusValue === EXPENSE_STATUS.CANCELLED.value) return <Badge variant="gray">İptal</Badge>;
    return <Badge variant="gray">Bilinmiyor</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('tr-TR');
  };

  const canApprove = expense?.status === EXPENSE_STATUS.VALIDATED.value;
  const canMarkPaid = expense?.status === EXPENSE_STATUS.APPROVED.value;
  const canCancel = (expense?.status === EXPENSE_STATUS.VALIDATED.value || expense?.status === EXPENSE_STATUS.APPROVED.value);

  if (isLoading && !isCreateMode) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            <span className="text-slate-500">Harcama raporu yükleniyor...</span>
          </div>
        </div>
      </>
    );
  }

  if (!isCreateMode && (error || !expense)) {
    return (
      <>
        <div className="space-y-6">
          <Alert type="error" title="Hata">
            {error || 'Harcama raporu bulunamadı'}
          </Alert>
          <Link to="/harcama-raporlari">
            <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
              Harcama Raporlarına Dön
            </Button>
          </Link>
        </div>
      </>
    );
  }

  if (isCreateMode) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <Link to="/harcama-raporlari" className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Harcama Raporlarına Dön</span>
          </Link>
        </div>

        {error && (
          <Alert type="error" title="Hata">
            {error}
          </Alert>
        )}

        <Card>
          <h1 className="text-xl font-bold text-slate-900 mb-4">Yeni Harcama Kaydı</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Personel ID</label>
              <input
                type="number"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm"
                value={createForm.fk_user_author}
                onChange={(e) => setCreateForm((p) => ({ ...p, fk_user_author: e.target.value }))}
                placeholder="Örn: 1"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Tarih</label>
              <input
                type="date"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm"
                value={createForm.date}
                onChange={(e) => setCreateForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Tutar</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm"
                value={createForm.amount}
                onChange={(e) => setCreateForm((p) => ({ ...p, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">Açıklama</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm resize-none"
                rows={4}
                value={createForm.description}
                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Harcama açıklaması..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5">
            <Button variant="secondary" onClick={() => navigate('/harcama-raporlari')}>
              İptal
            </Button>
            <Button variant="primary" onClick={handleCreateExpense} loading={isProcessing} disabled={isProcessing}>
              Kaydet
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/harcama-raporlari" className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Harcama Raporlarına Dön</span>
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
            {canMarkPaid && (
              <Button
                variant="success"
                icon={<CheckCircle className="w-4 h-4" />}
                onClick={handleMarkPaid}
                loading={isProcessing}
                disabled={isProcessing}
              >
                Ödendi İşaretle
              </Button>
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

        {/* Expense Detail Card */}
        <Card>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                <Receipt className="w-12 h-12" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {expense.ref || `EXP-${expense.id}`}
                  </h1>
                  <p className="text-slate-500 mt-1">Rapor No: #{expense.id}</p>
                  <div className="flex items-center gap-2 mt-3">
                    {getStatusBadge(expense.status)}
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
                    <p className="text-sm font-medium text-slate-900">#{expense.fk_user_author}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Toplam Tutar</p>
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(expense.total_ttc || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Financial Details */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-600" />
            Mali Bilgiler
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">KDV Hariç</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(expense.total_ht || 0)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">KDV</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(expense.total_tva || 0)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">Toplam KDV Dahil</p>
              <p className="text-lg font-bold text-teal-600">{formatCurrency(expense.total_ttc || 0)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">Ödeme Durumu</p>
              <p className="text-lg font-bold text-slate-900">{expense.paid ? 'Ödendi' : 'Ödenmedi'}</p>
            </div>
          </div>
        </Card>

        {/* Expense Lines */}
        {expense.lines && expense.lines.length > 0 && (
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Harcama Kalemleri ({expense.lines.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Tarih
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Açıklama
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Miktar
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Birim Fiyat
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 px-4">
                      Toplam
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expense.lines.map((line, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="py-3 px-4 text-sm text-slate-700">
                        {formatDate(typeof line.date === 'number' ? new Date(line.date * 1000).toISOString() : line.date)}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700">
                        {line.libelle || line.expense_type || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700 text-right">
                        {line.qty || 1}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700 text-right">
                        {formatCurrency(line.value_unit || 0)}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-slate-900 text-right">
                        {formatCurrency(line.total_ht || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Description and Notes */}
        {(expense.note_public || expense.note_private) && (
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Açıklama ve Notlar
            </h3>
            {expense.note_public && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-1">Genel Not</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{expense.note_public}</p>
              </div>
            )}
            {expense.note_private && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Özel Not</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{expense.note_private}</p>
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
              <p className="text-sm font-medium text-slate-900">{formatDate(expense.date_creation)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">Son Güncelleme</p>
              <p className="text-sm font-medium text-slate-900">{formatDate(expense.date_modification)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">Referans</p>
              <p className="text-sm font-medium text-slate-900">{expense.ref || '-'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Refuse Modal */}
      {showRefuseModal && (
        <Modal
          isOpen={showRefuseModal}
          onClose={() => setShowRefuseModal(false)}
          title="Harcama Raporunu Reddet"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reddetme Nedeni <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all resize-none"
                rows={4}
                placeholder="Harcama raporunu reddetme nedenini açıklayın..."
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

export default HarcamaDetay;
