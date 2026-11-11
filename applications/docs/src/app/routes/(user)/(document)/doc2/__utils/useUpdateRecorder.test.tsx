import { renderHook } from '@testing-library/react'
import type { DecryptedDocumentUpdate, Session } from '@proton-docs/realtime-sdk'

import { createFakeSession } from './createFakeSession'
import { useUpdateRecorder } from './useUpdateRecorder'

function update(firstByte: number, timestamp: number) {
  return {
    content: new Uint8Array([firstByte]),
    authorAddress: 'author@example.com',
    timestamp,
  } as DecryptedDocumentUpdate
}

describe('useUpdateRecorder', () => {
  test("records the session's base state, the updates it receives, and a replaced base state from scratch", () => {
    const fake = createFakeSession()
    fake.mocks.getBaseState.mockReturnValue({ commitId: 'commit-1', updates: [update(1, 100)] })
    const { result } = renderHook(() => useUpdateRecorder(fake.session))

    fake.emit('update', update(2, 200))
    expect(result.current?.getUpdates().map(({ origin, content }) => [origin, content[0]])).toEqual([
      ['baseState', 1],
      ['received', 2],
    ])

    fake.emit('baseStateReplaced', { base: { commitId: 'commit-2', updates: [update(3, 300)] } })
    expect(result.current?.getUpdates().map(({ origin, content }) => [origin, content[0]])).toEqual([['baseState', 3]])
  })

  test('has no recorder without a session, a new one for a new session, and stops listening to the old one', () => {
    const first = createFakeSession()
    const second = createFakeSession()
    const { result, rerender, unmount } = renderHook(({ session }) => useUpdateRecorder(session), {
      initialProps: { session: undefined as Session | undefined },
    })
    expect(result.current).toBeUndefined()

    rerender({ session: first.session })
    const firstRecorder = result.current
    rerender({ session: second.session })

    expect(result.current).not.toBe(firstRecorder)
    expect(first.listenerCount()).toBe(0)
    unmount()
    expect(second.listenerCount()).toBe(0)
  })
})
