// Lightweight external store that tracks in-flight API requests so a single
// global loading indicator can react to every database transaction in the app.
//
// `total`    - number of requests currently in flight (reads + writes).
// `mutating` - number of write requests (POST/PUT/PATCH/DELETE) in flight.
// `labelKey` - i18n key describing the active write (e.g. 'common.saving').
//
// The snapshot is replaced (never mutated in place) on every change so that
// React's useSyncExternalStore can detect updates via Object.is.

let state = { total: 0, mutating: 0, labelKey: '' };
const listeners = new Set();

function setState(next) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot() {
  return state;
}

export function startRequest(isMutating, labelKey) {
  setState({
    total: state.total + 1,
    mutating: state.mutating + (isMutating ? 1 : 0),
    labelKey: isMutating && labelKey ? labelKey : state.labelKey,
  });
}

export function endRequest(isMutating) {
  const mutating = Math.max(0, state.mutating - (isMutating ? 1 : 0));
  setState({
    total: Math.max(0, state.total - 1),
    mutating,
    labelKey: mutating === 0 ? '' : state.labelKey,
  });
}
