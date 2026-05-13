import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useModuleData } from '../hooks/useModuleData'

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [{ id: '1', value: 'test' }], error: null }),
    }),
  },
}))

describe('useModuleData', () => {
  it('starts in loading state', () => {
    const { result } = renderHook(() =>
      useModuleData({ table: 'hrd_employees', miningRightId: 'mr-1', calendarYear: 2024 })
    )
    expect(result.current.loading).toBe(true)
  })

  it('returns empty data when miningRightId is null', async () => {
    const { result } = renderHook(() =>
      useModuleData({ table: 'hrd_employees', miningRightId: null, calendarYear: 2024 })
    )
    // Allow state to settle
    await act(async () => {})
    expect(result.current.data).toEqual([])
  })
})
