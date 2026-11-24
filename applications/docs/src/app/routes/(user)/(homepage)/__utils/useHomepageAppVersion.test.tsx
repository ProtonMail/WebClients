import { renderHook } from '@testing-library/react'

import useEarlyAccess from '@proton/components/hooks/useEarlyAccess'

import { useHomepageAppVersion } from './useHomepageAppVersion'

vi.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({ APP_VERSION: '5.0.1+abc123' }) }))
vi.mock('@proton/components/hooks/useEarlyAccess', () => ({ __esModule: true, default: vi.fn() }))

describe('useHomepageAppVersion', () => {
  test('shows the version without its build, and copies it whole', () => {
    vi.mocked(useEarlyAccess).mockReturnValue({ currentEnvironment: undefined } as ReturnType<typeof useEarlyAccess>)

    expect(renderHook(() => useHomepageAppVersion()).result.current).toEqual({
      version: '5.0.1',
      fullVersion: '5.0.1+abc123',
      earlyAccessMark: undefined,
    })
  })

  test("marks the early access environment as Proton's AppVersion does", () => {
    vi.mocked(useEarlyAccess).mockReturnValue({ currentEnvironment: 'beta' } as ReturnType<typeof useEarlyAccess>)

    expect(renderHook(() => useHomepageAppVersion()).result.current.earlyAccessMark).toBe('β')
  })
})
