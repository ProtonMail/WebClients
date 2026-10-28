import { renderHook } from '@testing-library/react'
import { useFlag } from '@proton/unleash/useFlag'
import { useBulkMoveEnabled, useBulkTrashEnabled } from './flags'

describe('useBulkTrashEnabled', () => {
  test.each([
    [{ DocsHomepageBulkTrash: true, DocsTrashWithDriveSDK: true }, true],
    [{ DocsHomepageBulkTrash: true, DocsTrashWithDriveSDK: false }, false],
    [{ DocsHomepageBulkTrash: false, DocsTrashWithDriveSDK: true }, false],
  ])('%j -> %s', (flags: Record<string, boolean>, expected) => {
    jest.mocked(useFlag).mockImplementation((name) => flags[name])

    const { result } = renderHook(() => useBulkTrashEnabled())

    expect(result.current).toBe(expected)
  })
})

describe('useBulkMoveEnabled', () => {
  const withFlags = (bulkMove: boolean, bulkTrash: boolean, moveModalSdk: boolean, recentsSdk: boolean) => ({
    DocsHomepageBulkMove: bulkMove,
    DocsHomepageBulkTrash: bulkTrash,
    DocsTrashWithDriveSDK: true,
    DocsMoveModalDriveSDK: moveModalSdk,
    DocsLoadRecentsWithDriveSDK: recentsSdk,
  })

  test.each([
    [withFlags(true, true, true, true), true],
    [withFlags(true, true, true, false), false],
    [withFlags(true, true, false, true), false],
    [withFlags(true, true, false, false), false],
    [withFlags(true, false, true, true), false],
    [withFlags(true, false, true, false), false],
    [withFlags(true, false, false, true), false],
    [withFlags(true, false, false, false), false],
    [withFlags(false, true, true, true), false],
    [withFlags(false, true, true, false), false],
    [withFlags(false, true, false, true), false],
    [withFlags(false, true, false, false), false],
    [withFlags(false, false, true, true), false],
    [withFlags(false, false, true, false), false],
    [withFlags(false, false, false, true), false],
    [withFlags(false, false, false, false), false],
  ])('%j -> %s', (flags: Record<string, boolean>, expected) => {
    jest.mocked(useFlag).mockImplementation((name) => flags[name])

    const { result } = renderHook(() => useBulkMoveEnabled())

    expect(result.current).toBe(expected)
  })
})
