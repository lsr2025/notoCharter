import { cn } from '@/lib/utils'

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  align?: 'left' | 'right' | 'center'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onExportCsv?: () => void
  emptyMessage?: string
  loading?: boolean
}

export function DataTable<T>({
  columns, data, keyField, onEdit, onDelete, onExportCsv, emptyMessage = 'No records found.', loading,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      {onExportCsv && (
        <div className="flex justify-end px-4 py-2 border-b border-slate-200 bg-slate-50/50">
          <button
            onClick={onExportCsv}
            className="text-xs font-medium text-brand-600 hover:text-brand-800 flex items-center gap-1"
          >
            ↓ Export CSV
          </button>
        </div>
      )}
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map(col => (
              <th
                key={String(col.key)}
                className={cn(
                  'px-4 py-3 text-xs font-semibold text-ink-muted font-mono uppercase tracking-wider whitespace-nowrap',
                  col.align === 'right'  && 'text-right',
                  col.align === 'center' && 'text-center',
                  (!col.align || col.align === 'left') && 'text-left',
                )}
              >
                {col.header}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="px-4 py-3 text-xs font-semibold text-ink-muted font-mono uppercase tracking-wider text-right">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-ink-muted">
                <div className="flex items-center justify-center gap-2">
                  <span className="animate-spin text-brand-500">⟳</span> Loading…
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-ink-muted text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={String(row[keyField])}
                className={cn(
                  'border-b border-slate-100 transition-colors hover:bg-slate-50',
                  idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50',
                )}
              >
                {columns.map(col => (
                  <td
                    key={String(col.key)}
                    className={cn(
                      'px-4 py-3 text-ink whitespace-nowrap',
                      col.align === 'right'  && 'text-right font-mono',
                      col.align === 'center' && 'text-center',
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[String(col.key)] ?? '')}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="text-xs text-noncompliant hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
