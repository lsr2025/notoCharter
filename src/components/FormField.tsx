import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-ink-3 uppercase tracking-wider font-mono">
        {label}
      </label>
      <input
        className={cn(
          'rounded-lg border px-3 py-2 text-sm text-ink bg-white outline-none transition',
          'focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
          error ? 'border-noncompliant' : 'border-slate-200',
          className,
        )}
        {...props}
      />
      {hint  && <p className="text-xs text-ink-muted">{hint}</p>}
      {error && <p className="text-xs text-noncompliant">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  children: React.ReactNode
}

export function Select({ label, error, children, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-ink-3 uppercase tracking-wider font-mono">
        {label}
      </label>
      <select
        className={cn(
          'rounded-lg border px-3 py-2 text-sm text-ink bg-white outline-none transition',
          'focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
          error ? 'border-noncompliant' : 'border-slate-200',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-noncompliant">{error}</p>}
    </div>
  )
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export function TextArea({ label, error, className, ...props }: TextAreaProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-ink-3 uppercase tracking-wider font-mono">
        {label}
      </label>
      <textarea
        rows={3}
        className={cn(
          'rounded-lg border px-3 py-2 text-sm text-ink bg-white outline-none transition resize-none',
          'focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
          error ? 'border-noncompliant' : 'border-slate-200',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-noncompliant">{error}</p>}
    </div>
  )
}
