import { cn, tierColor, tierLabel, tierIcon } from '@/lib/utils'
import type { ComplianceTier } from '@/types'

interface Props {
  tier: ComplianceTier | null | undefined
  size?: 'sm' | 'md' | 'lg'
}

export function ComplianceBadge({ tier, size = 'md' }: Props) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-semibold font-mono',
      tierColor(tier),
      size === 'sm'  && 'px-2 py-0.5 text-xs',
      size === 'md'  && 'px-3 py-1 text-xs',
      size === 'lg'  && 'px-4 py-1.5 text-sm',
    )}>
      {tierIcon(tier)} {tierLabel(tier)}
    </span>
  )
}
