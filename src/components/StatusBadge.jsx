const styles = {
  active: 'bg-moss/15 text-moss',
  confirmed: 'bg-moss/15 text-moss',
  cancelled: 'bg-terracotta/15 text-terracotta',
  disabled: 'bg-stone-200 text-stone-700',
};

export default function StatusBadge({ value }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[value] || 'bg-sandal text-teak'}`}>
      {String(value || 'n/a').replace('-', ' ')}
    </span>
  );
}
