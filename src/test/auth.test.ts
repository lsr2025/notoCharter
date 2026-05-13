import { describe, it, expect } from 'vitest'

// Pure functions mirroring the logic in useAuth.ts mapUser()
function resolveRole(appMetadata: Record<string, unknown>): string {
  return (appMetadata?.role ?? 'executive') as string
}

function resolveMiningRightIds(appMetadata: Record<string, unknown>): string[] {
  return (appMetadata?.mining_right_ids as string[]) ?? []
}

describe('resolveRole from app_metadata', () => {
  it('returns role from app_metadata', () => {
    expect(resolveRole({ role: 'hr_manager' })).toBe('hr_manager')
  })
  it('defaults to executive when role is absent', () => {
    expect(resolveRole({})).toBe('executive')
  })
  it('returns compliance_officer correctly', () => {
    expect(resolveRole({ role: 'compliance_officer' })).toBe('compliance_officer')
  })
})

describe('resolveMiningRightIds from app_metadata', () => {
  it('returns ids array', () => {
    expect(resolveMiningRightIds({ mining_right_ids: ['id-1', 'id-2'] })).toEqual(['id-1', 'id-2'])
  })
  it('returns empty array when absent', () => {
    expect(resolveMiningRightIds({})).toEqual([])
  })
})
