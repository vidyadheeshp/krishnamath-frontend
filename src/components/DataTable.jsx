import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import StatusBadge from './StatusBadge';

// Columns that are never searched or sorted (row controls).
const ACTION_KEYS = new Set(['actions', 'id']);
const SERIAL_KEY = 'slNo';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;
const dateFormatter = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const numberFormatter = new Intl.NumberFormat('en-IN');

// Everything a person might type to find a value: dates also match "15 Oct 2026", amounts also "1,200".
const textFor = (value) => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') return `${value} ${numberFormatter.format(value)}`;
  if (typeof value === 'string' && ISO_DATE.test(value)) {
    const date = new Date(value.slice(0, 10));
    return Number.isNaN(date.getTime()) ? value : `${value} ${dateFormatter.format(date)}`;
  }
  if (typeof value === 'boolean') return value ? 'yes active' : 'no inactive';
  if (Array.isArray(value)) return value.map(textFor).join(' ');
  if (typeof value === 'object') return '';
  return String(value);
};

const isBlank = (value) => value === null || value === undefined || value === '';

// Numbers numerically, everything else as natural text ("TS-2" before "TS-10"); blanks always last.
const compareValues = (left, right) => {
  if (isBlank(left) && isBlank(right)) return 0;
  if (isBlank(left)) return 1;
  if (isBlank(right)) return -1;
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
};

const isSortable = (column) => column.sortable !== false && !ACTION_KEYS.has(column.key) && column.key !== SERIAL_KEY;
const isSearchable = (column) => column.searchable !== false && !ACTION_KEYS.has(column.key) && column.key !== SERIAL_KEY;

/**
 * Shared table with search, column sorting and paging.
 *
 * Column options: `sortValue(row)` / `searchValue(row)` override what is compared / searched for columns whose
 * displayed text differs from `row[key]` (translated labels, derived values); `sortable: false` and
 * `searchable: false` opt a column out. A row may carry a `_search` string with extra searchable text.
 * Props: `searchable` (default true), `pageSize` (default 10, 0 = show everything), `defaultSort` ({ key, direction }).
 */
export default function DataTable({
  columns,
  rows,
  emptyText = 'No data available.',
  searchable = true,
  searchPlaceholder,
  pageSize = 10,
  defaultSort = null,
  rowClassName = () => '',
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(defaultSort);
  const [page, setPage] = useState(1);

  const searchableColumns = useMemo(() => columns.filter(isSearchable), [columns]);
  const sortableByKey = useMemo(() => Object.fromEntries(columns.map((column) => [column.key, column])), [columns]);

  const filtered = useMemo(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return rows;

    return rows.filter((row) => {
      const haystack = [
        ...searchableColumns.map((column) => textFor(column.searchValue ? column.searchValue(row) : row[column.key])),
        row._search ? String(row._search) : '',
      ]
        .join(' ')
        .toLowerCase();

      return tokens.every((token) => haystack.includes(token));
    });
  }, [rows, query, searchableColumns]);

  const sorted = useMemo(() => {
    const column = sort && sortableByKey[sort.key];
    if (!column) return filtered;

    const direction = sort.direction === 'desc' ? -1 : 1;
    const valueOf = (row) => (column.sortValue ? column.sortValue(row) : row[column.key]);

    // Blanks stay last in both directions, so only real values are flipped.
    return [...filtered].sort((left, right) => {
      const a = valueOf(left);
      const b = valueOf(right);
      if (isBlank(a) || isBlank(b)) return compareValues(a, b);
      return compareValues(a, b) * direction;
    });
  }, [filtered, sort, sortableByKey]);

  const paged = pageSize > 0;
  const totalPages = paged ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const currentPage = Math.min(page, totalPages);
  const start = paged ? (currentPage - 1) * pageSize : 0;
  const visible = paged ? sorted.slice(start, start + pageSize) : sorted;

  useEffect(() => {
    setPage(1);
  }, [query, sort]);

  const toggleSort = (key) =>
    setSort((current) => {
      if (!current || current.key !== key) return { key, direction: 'asc' };
      if (current.direction === 'asc') return { key, direction: 'desc' };
      return null; // third click clears the sort
    });

  const isFiltering = query.trim() !== '';

  return (
    <div className="space-y-3">
      {searchable ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder || t('common.searchPlaceholder')}
              aria-label={t('common.search')}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 [&::-webkit-search-cancel-button]:hidden"
            />
            {isFiltering ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label={t('common.clearSearch')}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          {isFiltering ? (
            <p className="text-sm text-slate-500" role="status">
              {t('common.matches', { count: sorted.length, total: rows.length })}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table data-datatable className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                {columns.map((column) => {
                  const sortable = isSortable(column);
                  const active = sort?.key === column.key ? sort.direction : null;
                  const Icon = active === 'asc' ? ChevronUp : active === 'desc' ? ChevronDown : ChevronsUpDown;

                  return (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={active ? (active === 'asc' ? 'ascending' : 'descending') : sortable ? 'none' : undefined}
                      className="whitespace-nowrap px-4 py-3"
                    >
                      {sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(column.key)}
                          className={`group inline-flex items-center gap-1 uppercase tracking-wide transition hover:text-ink ${active ? 'text-ink' : ''}`}
                          title={t('common.sortBy', { column: typeof column.header === 'string' ? column.header : '' })}
                        >
                          {column.header}
                          <Icon className={`h-3.5 w-3.5 ${active ? 'text-brand' : 'text-slate-300 group-hover:text-slate-500'}`} aria-hidden="true" />
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center text-slate-500" colSpan={columns.length}>
                    {isFiltering ? t('common.noResults') : emptyText}
                  </td>
                </tr>
              ) : (
                visible.map((row, rowIndex) => (
                  <tr key={row.id || start + rowIndex} className={`align-middle transition hover:bg-slate-50/70 ${rowClassName(row)}`}>
                    {columns.map((column) => {
                      const value = row[column.key];

                      return (
                        <td key={column.key} className="px-4 py-3.5 text-slate-700">
                          {column.key === SERIAL_KEY ? (
                            start + rowIndex + 1
                          ) : column.render ? (
                            column.render(value, row)
                          ) : column.key.toLowerCase().includes('status') ? (
                            <StatusBadge value={value} />
                          ) : (
                            value ?? '-'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {paged && sorted.length > pageSize ? (
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {t('common.showing')} {start + 1} {t('common.to')} {Math.min(start + pageSize, sorted.length)} {t('common.of')} {sorted.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                {t('common.prev')}
              </button>
              <span className="min-w-[90px] text-center font-medium text-ink">
                {t('common.page')} {currentPage} {t('common.of')} {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('common.next')}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
