import StatusBadge from './StatusBadge';

export default function DataTable({ columns, rows, emptyText = 'No data available.' }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-100 text-sm">
          <thead className="bg-sandal/50 text-left text-xs uppercase tracking-[0.2em] text-teak/70">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-semibold">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-teak/70" colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} className="align-middle">
                  {columns.map((column) => {
                    const value = row[column.key];

                    return (
                      <td key={column.key} className="px-4 py-4 text-teak/90">
                        {column.render
                          ? column.render(value, row)
                          : column.key.toLowerCase().includes('status')
                            ? <StatusBadge value={value} />
                            : value ?? '-'}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
