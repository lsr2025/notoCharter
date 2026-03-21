import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary', size = 'md', loading, children, className, disabled, ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled ?? loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary'   && 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm',
        variant === 'secondary' && 'bg-white text-ink border border-slate-200 hover:bg-slate-50',
        variant === 'danger'    && 'bg-noncompliant text-white hover:bg-red-700',
        variant === 'ghost'     && 'text-ink-muted hover:text-ink hover:bg-slate-100',
        size === 'sm'  && 'px-3 py-1.5 text-xs',
        size === 'md'  && 'px-4 py-2 text-sm',
        size === 'lg'  && 'px-6 py-3 text-base',
        className,
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      )}
      {children}
    </button>
  )
}
