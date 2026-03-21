import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  dmrRef?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, dmrRef, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between px-8 py-6 border-b border-slate-200 bg-white', className)}>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display text-ink">{title}</h1>
          {dmrRef && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
              {dmrRef}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
