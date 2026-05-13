import { describe, it, expect } from 'vitest'
import { calculateOverallScore } from '../lib/scoring'

describe('calculateOverallScore', () => {
  it('returns compliant when ring-fenced pass and weighted score >= 100', () => {
    const result = calculateOverallScore({
      ownership_compliant: true, mcd_compliant: true, hlc_compliant: true,
      ee_score: 100, procurement_score: 100, hrd_score: 100,
    })
    expect(result.overall_tier).toBe('compliant')
  })

  it('returns non_compliant when ownership ring-fenced fails', () => {
    const result = calculateOverallScore({
      ownership_compliant: false, mcd_compliant: true, hlc_compliant: true,
      ee_score: 100, procurement_score: 100, hrd_score: 100,
    })
    expect(result.overall_tier).toBe('non_compliant')
  })

  it('returns ring_fenced when score is between 60 and 99 and ring-fenced pass', () => {
    // EE=60*0.3 + Proc=60*0.4 + HRD=60*0.3 = 60
    const result = calculateOverallScore({
      ownership_compliant: true, mcd_compliant: true, hlc_compliant: true,
      ee_score: 60, procurement_score: 60, hrd_score: 60,
    })
    expect(result.overall_tier).toBe('ring_fenced')
  })

  it('returns non_compliant when score is below 60', () => {
    const result = calculateOverallScore({
      ownership_compliant: true, mcd_compliant: true, hlc_compliant: true,
      ee_score: 0, procurement_score: 0, hrd_score: 0,
    })
    expect(result.overall_tier).toBe('non_compliant')
  })

  it('computes weighted score correctly (EE 30%, Proc 40%, HRD 30%)', () => {
    const result = calculateOverallScore({
      ownership_compliant: true, mcd_compliant: true, hlc_compliant: true,
      ee_score: 100, procurement_score: 80, hrd_score: 60,
    })
    // 100*0.3 + 80*0.4 + 60*0.3 = 30 + 32 + 18 = 80
    expect(result.overall_score).toBeCloseTo(80, 1)
  })
})
