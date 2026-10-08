import { KeyRound, Pencil, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { ROLES } from '../constants/navigation';

const ROLE_OPTIONS = Object.values(ROLES);

const inputClass =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20';
const primaryButton =
  'rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60';
const secondaryButton =
  'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50';

const emptyForm = { name: '', email: '', role: ROLES.ADMIN, password: '', isActive: true };

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-label={title}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { t } = useTranslation();
  const currentUserId = useSelector((state) => state.auth.user?.id);
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | user
  const [form, setForm] = useState(emptyForm);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || t('users.loadFailed'));
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditing('new');
  };

  const openEdit = (user) => {
    setForm({ name: user.name, email: user.email, role: user.role, password: '', isActive: user.isActive });
    setEditing(user);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      if (editing === 'new') {
        await api.post('/users', form);
        toast.success(t('users.created'));
      } else {
        const { password, ...changes } = form;
        void password;
        await api.put(`/users/${editing.id}`, changes);
        toast.success(t('users.updated'));
      }
      setEditing(null);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || t('users.saveFailed'));
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();

    try {
      await api.post(`/users/${resetTarget.id}/reset-password`, { password: newPassword });
      toast.success(t('users.passwordUpdated'));
      setResetTarget(null);
      setNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || t('users.saveFailed'));
    }
  };

  const columns = [
    {
      key: 'name',
      header: t('common.name'),
      searchValue: (row) => `${row.name} ${row.email}`,
      render: (value, row) => (
        <div>
          <p className="font-medium text-ink">{value}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: t('users.role'),
      searchValue: (row) => t(`roles.${row.role}`, row.role),
      sortValue: (row) => t(`roles.${row.role}`, row.role),
      render: (value) => <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{t(`roles.${value}`, value)}</span>,
    },
    {
      key: 'status',
      header: t('common.status'),
      searchValue: (row) => (row.isActive ? 'active' : 'inactive'),
      sortValue: (row) => (row.isActive ? 'active' : 'inactive'),
      render: (_value, row) => <StatusBadge value={row.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'lastLoginAt',
      header: t('users.lastLogin'),
      searchValue: (row) => (row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : t('users.never')),
      render: (value) => (value ? new Date(value).toLocaleString() : t('users.never')),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (_value, row) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => openEdit(row)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            {t('common.edit')}
          </button>
          <button type="button" onClick={() => setResetTarget(row)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
            {t('users.resetPassword')}
          </button>
        </div>
      ),
    },
  ];

  const isSelf = editing && editing !== 'new' && editing.id === currentUserId;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('users.title')}
        description={t('users.description')}
        action={
          <button type="button" onClick={openCreate} className={`${primaryButton} inline-flex items-center gap-2`}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('users.addUser')}
          </button>
        }
      />

      <div className="grid gap-3 text-sm sm:grid-cols-3">
        {ROLE_OPTIONS.map((role) => (
          <div key={role} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-semibold text-ink">{t(`roles.${role}`)}</p>
            <p className="mt-1 text-slate-500">{t(`roles.${role}Desc`)}</p>
          </div>
        ))}
      </div>

      <DataTable columns={columns} rows={users} emptyText={t('common.noData')} searchPlaceholder={t('users.searchPlaceholder')} />

      {editing ? (
        <Modal title={editing === 'new' ? t('users.addUser') : t('users.editUser')} onClose={() => setEditing(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              {t('common.name')}
              <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t('login.email')}
              <input className={inputClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t('users.role')}
              <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} disabled={isSelf}>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {t(`roles.${role}`)}
                  </option>
                ))}
              </select>
            </label>
            {editing === 'new' ? (
              <label className="block text-sm font-medium text-slate-700">
                {t('login.password')}
                <input className={inputClass} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={10} />
                <span className="mt-1 block text-xs text-slate-500">{t('users.passwordHint')}</span>
              </label>
            ) : (
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} disabled={isSelf} className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" />
                {t('users.accountActive')}
              </label>
            )}
            {isSelf ? <p className="text-xs text-slate-500">{t('users.selfHint')}</p> : null}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className={secondaryButton}>
                {t('common.cancel')}
              </button>
              <button type="submit" className={primaryButton}>
                {t('common.save')}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {resetTarget ? (
        <Modal title={`${t('users.resetPassword')} — ${resetTarget.name}`} onClose={() => setResetTarget(null)}>
          <form onSubmit={handleReset} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              {t('users.newPassword')}
              <input className={inputClass} type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={10} />
              <span className="mt-1 block text-xs text-slate-500">{t('users.passwordHint')}</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setResetTarget(null)} className={secondaryButton}>
                {t('common.cancel')}
              </button>
              <button type="submit" className={primaryButton}>
                {t('common.save')}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
