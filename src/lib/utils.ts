import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ComplianceTier } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'ZAR') {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number, decimals = 1) {
  return `${value.toFixed(decimals)}%`
}

export function tierColor(tier: ComplianceTier | null | undefined) {
  if (!tier) return 'text-ink-muted bg-slate-100'
  return {
    compliant:     'text-compliant bg-compliant-light',
    non_compliant: 'text-noncompliant bg-noncompliant-light',
    ring_fenced:   'text-ringfenced bg-ringfenced-light',
  }[tier]
}

export function tierLabel(tier: ComplianceTier | null | undefined) {
  if (!tier) return 'Pending'
  return {
    compliant:     'Compliant',
    non_compliant: 'Non-Compliant',
    ring_fenced:   'Ring-Fenced',
  }[tier]
}

export function tierIcon(tier: ComplianceTier | null | undefined) {
  if (!tier) return '○'
  return { compliant: '✓', non_compliant: '✗', ring_fenced: '⚠' }[tier]
}

export function daysUntil(dateStr: string | null | undefined) {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function raceLabel(race: string) {
  const map: Record<string, string> = {
    african: 'African', coloured: 'Coloured', indian: 'Indian', white: 'White', foreign: 'Foreign National',
  }
  return map[race] ?? race
}

export function downloadCsv(
  filename: string,
  columns: { key: string; header: string }[],
  data: Record<string, unknown>[],
) {
  function cellVal(val: unknown): string {
    if (val === null || val === undefined) return ''
    if (typeof val === 'boolean') return val ? 'Yes' : 'No'
    const s = String(val)
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const header = columns.map(c => `"${c.header}"`).join(',')
  const rows = data.map(row => columns.map(c => cellVal(row[c.key])).join(','))
  // BOM (\ufeff) ensures Excel opens with correct encoding
  const csv = '\ufeff' + [header, ...rows].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function occupationalLevelLabel(level: string) {
  const map: Record<string, string> = {
    top_management: 'Top Management',
    senior_management: 'Senior Management',
    professionally_qualified: 'Professionally Qualified',
    skilled_technical: 'Skilled & Technical',
    semi_skilled: 'Semi-Skilled',
    unskilled: 'Unskilled',
  }
  return map[level] ?? level
}
