import { renderHook } from '@testing-library/react'

import metrics from '@proton/metrics/metricsInstance'

import { useOpenDocumentHeartbeat } from './useOpenDocumentHeartbeat'

vi.mock('@proton/metrics/metricsInstance', () => ({
  default: { docs_open_documents_heartbeat_total: { increment: vi.fn() } },
}))

describe('useOpenDocumentHeartbeat', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  test('counts the open document at once and every minute, until unmounted', () => {
    const increment = vi.mocked(metrics.docs_open_documents_heartbeat_total.increment)
    const { unmount } = renderHook(() => useOpenDocumentHeartbeat('public'))

    expect(increment).toHaveBeenCalledTimes(1)
    expect(increment).toHaveBeenCalledWith(expect.objectContaining({ docType: 'public' }))
    vi.advanceTimersByTime(60_000)
    expect(increment).toHaveBeenCalledTimes(2)

    unmount()
    vi.advanceTimersByTime(120_000)
    expect(increment).toHaveBeenCalledTimes(2)
  })
})
