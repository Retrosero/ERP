import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Clock, LogIn, LogOut, Plus, RefreshCw, User } from 'lucide-react';
import { Alert, Badge, Button, Card, Input, Select, Table } from '@/components/ui';
import { attendanceApi, userApi } from '@/lib/dolibarr-hrm';
import type { Attendance, User as HrmUser } from '@/lib/types/hrm';

interface AttendanceRow {
  id: string;
  fk_user: number;
  user_name: string;
  user_email: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: 'PENDING' | 'COMPLETED';
}

const toDateTime = (datePart?: string, timePart?: string): string | undefined => {
  if (!datePart || !timePart) return undefined;
  return `${datePart}T${timePart}`;
};

const toUserLabel = (u: HrmUser): string =>
  `${u.firstname || ''} ${u.lastname || ''}`.trim() || u.name || `#${u.id}`;

export function PersonelGirisCikis() {
  const [users, setUsers] = useState<HrmUser[]>([]);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [userList, attendanceList] = await Promise.all([
        userApi.list({ limit: 200 }),
        attendanceApi.list({ limit: 500 }),
      ]);
      setUsers(userList);
      if (!selectedUserId && userList.length > 0) {
        setSelectedUserId(String(userList[0].id));
      }

      const userMap = new Map<number, HrmUser>(userList.map((u) => [u.id, u]));
      const grouped = new Map<string, AttendanceRow>();

      attendanceList.forEach((entry: Attendance) => {
        const key = `${entry.fk_user}-${entry.punching_date || ''}`;
        const user = userMap.get(entry.fk_user);
        const existing = grouped.get(key) || {
          id: key,
          fk_user: entry.fk_user,
          user_name: user ? toUserLabel(user) : `#${entry.fk_user}`,
          user_email: user?.email || '',
          date: entry.punching_date || '',
          status: 'PENDING' as const,
        };

        if (entry.type === 0) existing.check_in = toDateTime(entry.punching_date, entry.punching_time);
        if (entry.type === 1) existing.check_out = toDateTime(entry.punching_date, entry.punching_time);
        existing.status = existing.check_out ? 'COMPLETED' : 'PENDING';

        grouped.set(key, existing);
      });

      setRows(
        Array.from(grouped.values()).sort((a, b) => {
          const aVal = a.check_in || '';
          const bVal = b.check_in || '';
          return bVal.localeCompare(aVal);
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıtlar yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRows = useMemo(
    () =>
      rows.filter((r) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return r.user_name.toLowerCase().includes(q) || r.user_email.toLowerCase().includes(q);
      }),
    [rows, searchQuery]
  );

  const activeRecordForSelected = useMemo(() => {
    if (!selectedUserId) return null;
    return rows.find((r) => r.fk_user === Number(selectedUserId) && !r.check_out);
  }, [rows, selectedUserId]);

  const handlePunch = async (type: 0 | 1) => {
    if (!selectedUserId) {
      setError('Lütfen personel seçin');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await attendanceApi.createRecord({
        fk_user: Number(selectedUserId),
        type,
        note: note || undefined,
      });
      setNote('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt eklenirken hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'user_name',
      header: 'Personel',
      render: (_: unknown, row: AttendanceRow) => (
        <div>
          <p className="font-medium text-slate-900">{row.user_name}</p>
          <p className="text-xs text-slate-500">{row.user_email || '-'}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Tarih',
      render: (value: unknown) => <span>{String(value || '-')}</span>,
    },
    {
      key: 'check_in',
      header: 'Giriş',
      render: (value: unknown) =>
        value ? new Date(String(value)).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-',
    },
    {
      key: 'check_out',
      header: 'Çıkış',
      render: (value: unknown) =>
        value ? new Date(String(value)).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-',
    },
    {
      key: 'status',
      header: 'Durum',
      render: (value: unknown) =>
        String(value) === 'COMPLETED' ? <Badge variant="success">Tamamlandı</Badge> : <Badge variant="warning">İçeride</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Personel Giriş-Çıkış</h1>
          <p className="text-sm text-slate-500">Dolibarr attendance kayıtları</p>
        </div>
        <Button variant="secondary" onClick={loadData} loading={isLoading} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Yenile
        </Button>
      </div>

      {error && (
        <Alert type="error" title="Hata">
          {error}
        </Alert>
      )}

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select
            label="Personel"
            options={users.map((u) => ({ value: String(u.id), label: toUserLabel(u) }))}
            value={selectedUserId}
            onChange={setSelectedUserId}
          />
          <Input
            label="Not"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Opsiyonel not"
          />
          <div className="flex items-end gap-2">
            <Button
              variant="primary"
              className="gap-2"
              onClick={() => handlePunch(0)}
              loading={isSubmitting}
              disabled={!!activeRecordForSelected}
            >
              <LogIn className="w-4 h-4" />
              Giriş Ekle
            </Button>
            <Button
              variant="danger"
              className="gap-2"
              onClick={() => handlePunch(1)}
              loading={isSubmitting}
              disabled={!activeRecordForSelected}
            >
              <LogOut className="w-4 h-4" />
              Çıkış Ekle
            </Button>
          </div>
          <div className="flex items-end">
            <div className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm">
              {activeRecordForSelected ? (
                <span className="inline-flex items-center gap-2 text-amber-700">
                  <Clock className="w-4 h-4" />
                  Seçili personel içeride
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-emerald-700">
                  <Check className="w-4 h-4" />
                  Seçili personel için açık kayıt yok
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card padding="sm">
        <Input
          placeholder="Personel adı veya e-posta ile ara"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Card>

      {isLoading ? (
        <Card>
          <div className="py-16 text-center text-slate-500">Kayıtlar yükleniyor...</div>
        </Card>
      ) : (
        <Card padding="none">
          <Table columns={columns} data={filteredRows} />
        </Card>
      )}
    </div>
  );
}

export default PersonelGirisCikis;
