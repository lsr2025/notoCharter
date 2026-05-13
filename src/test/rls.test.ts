import { describe, it, expect } from 'vitest'

// Mirrors the SQL user_has_mining_right() function logic
function userHasMiningRight(
  userMiningRightIds: string[],
  userRole: string,
  targetMrId: string
): boolean {
  if (userRole === 'executive' || userRole === 'compliance_officer') return true
  return userMiningRightIds.includes(targetMrId)
}

describe('userHasMiningRight scoping logic', () => {
  it('grants access when mr_id is in user list', () => {
    expect(userHasMiningRight(['mr-1', 'mr-2'], 'hr_manager', 'mr-1')).toBe(true)
  })
  it('denies access when mr_id is not in user list', () => {
    expect(userHasMiningRight(['mr-1'], 'hr_manager', 'mr-2')).toBe(false)
  })
  it('grants executive access regardless of assignment', () => {
    expect(userHasMiningRight([], 'executive', 'any-mr')).toBe(true)
  })
  it('grants compliance_officer access regardless of assignment', () => {
    expect(userHasMiningRight([], 'compliance_officer', 'any-mr')).toBe(true)
  })
  it('denies access to empty mining_right_ids for non-global roles', () => {
    expect(userHasMiningRight([], 'hr_manager', 'mr-1')).toBe(false)
  })
})
