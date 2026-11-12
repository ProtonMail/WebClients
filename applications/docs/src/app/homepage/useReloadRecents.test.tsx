import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'

import { HomepageViewContext, type HomepageViewValue } from './homepageViewContext'
import { useReloadRecents } from './useReloadRecents'

function renderReloadRecents() {
  const calls: string[] = []
  let finishUpdate = () => {}
  const updateRecentDocuments = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        calls.push('updateRecentDocuments')
        finishUpdate = resolve
      }),
  )
  const reloadInvitations = jest.fn(() => {
    calls.push('reloadInvitations')
  })
  const createNotification = jest.fn(() => {
    calls.push('createNotification')
  })

  const value = {
    updateRecentDocuments,
    reloadInvitations,
    createNotification,
  } as unknown as HomepageViewValue
  const wrapper = ({ children }: { children: ReactNode }) => (
    <HomepageViewContext.Provider value={value}>{children}</HomepageViewContext.Provider>
  )

  const { result } = renderHook(() => useReloadRecents(), { wrapper })
  return { reloadRecents: result.current, calls, finishUpdate: () => finishUpdate(), reloadInvitations }
}

describe('useReloadRecents', () => {
  test('reloads the invitations and the recent documents together, then confirms', async () => {
    const { reloadRecents, calls, finishUpdate } = renderReloadRecents()

    let reloaded: Promise<void> = Promise.resolve()
    act(() => {
      reloaded = reloadRecents()
    })
    expect(calls).toEqual(['reloadInvitations', 'updateRecentDocuments'])

    await act(async () => {
      finishUpdate()
      await reloaded
    })
    expect(calls).toEqual(['reloadInvitations', 'updateRecentDocuments', 'createNotification'])
  })

  test('reloads the invitations once per press', async () => {
    const { reloadRecents, finishUpdate, reloadInvitations } = renderReloadRecents()

    await act(async () => {
      const reloaded = reloadRecents()
      finishUpdate()
      await reloaded
    })

    expect(reloadInvitations).toHaveBeenCalledTimes(1)
  })
})
