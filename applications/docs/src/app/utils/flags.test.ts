import { renderHook } from '@testing-library/react'
import { useFlag } from '@proton/unleash/useFlag'
import { useBulkTrashEnabled } from './flags'

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
