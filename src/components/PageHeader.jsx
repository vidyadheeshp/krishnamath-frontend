export default function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-terracotta/70">Temple operations</p>
        <h1 className="mt-2 font-serif text-3xl text-ink lg:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-teak/80">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
