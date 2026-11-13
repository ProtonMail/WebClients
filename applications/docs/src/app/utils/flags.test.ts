import { renderHook } from '@testing-library/react'
import { isDevOrBlack } from '@proton/shared/lib/env'
import { useFlag } from '@proton/unleash/useFlag'
import { useBulkMoveEnabled, useBulkTrashEnabled, useRealtimeSdkEnabled } from './flags'

jest.mock('@proton/shared/lib/env', () => ({
  ...jest.requireActual('@proton/shared/lib/env'),
  isDevOrBlack: jest.fn(() => false),
}))

describe('useBulkTrashEnabled', () => {
  test.each([
    [{ DocsHomepageBulkTrash: true }, true],
    [{ DocsHomepageBulkTrash: false }, false],
  ])('%j -> %s', (flags: Record<string, boolean>, expected) => {
    jest.mocked(useFlag).mockImplementation((name) => flags[name])

    const { result } = renderHook(() => useBulkTrashEnabled())

    expect(result.current).toBe(expected)
  })
})

describe('useBulkMoveEnabled', () => {
  const withFlags = (bulkMove: boolean, bulkTrash: boolean) => ({
    DocsHomepageBulkMove: bulkMove,
    DocsHomepageBulkTrash: bulkTrash,
  })

  test.each([
    [withFlags(true, true), true],
    [withFlags(true, false), false],
    [withFlags(false, true), false],
    [withFlags(false, false), false],
  ])('%j -> %s', (flags: Record<string, boolean>, expected) => {
    jest.mocked(useFlag).mockImplementation((name) => flags[name])

    const { result } = renderHook(() => useBulkMoveEnabled())

    expect(result.current).toBe(expected)
  })
})

describe('useRealtimeSdkEnabled', () => {
  test.each([
    [{ DocsRealtimeSdkEnabled: true }, false, true],
    [{ DocsRealtimeSdkEnabled: false }, false, false],
    [{ DocsRealtimeSdkEnabled: true }, true, true],
    [{ DocsRealtimeSdkEnabled: false }, true, true],
  ])('%j, dev or black %s -> %s', (flags: Record<string, boolean>, devOrBlack, expected) => {
    jest.mocked(useFlag).mockImplementation((name) => flags[name])
    jest.mocked(isDevOrBlack).mockReturnValue(devOrBlack)

    const { result } = renderHook(() => useRealtimeSdkEnabled())

    expect(result.current).toBe(expected)
  })
})
