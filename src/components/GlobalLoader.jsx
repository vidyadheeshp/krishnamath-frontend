import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

import { subscribe, getSnapshot } from '../api/loadingBus';

// Renders app-wide feedback for any in-flight database transaction:
//   * a thin indeterminate progress bar for every request (reads + writes)
//   * a centered blocking overlay while a write (create/update/delete) runs,
//     so the user sees the status and cannot double-submit.
export default function GlobalLoader() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const { t } = useTranslation();

  const isActive = state.total > 0;
  const isBlocking = state.mutating > 0;

  if (!isActive) {
    return null;
  }

  return (
    <>
      <div className="global-loader-bar" aria-hidden="true" />

      {isBlocking ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/30 backdrop-blur-[2px]"
          role="alert"
          aria-live="assertive"
          aria-busy="true"
        >
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-xl">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-brand" />
            <p className="text-sm font-medium text-ink">{t(state.labelKey || 'common.processing')}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
