import type { DocInvitesHook } from '@proton/drive-store/lib/_invites/useDocInvites'
import { act, render, screen } from '@testing-library/react'
import { useEffect, useState } from 'react'

import { HomepageInvitationsLoader, useHomepageInvitations } from './HomepageInvitations'

type Invitation = ReturnType<DocInvitesHook>['invitations'][number]

const invitation = { invitation: { invitationId: 'invitation1' } } as Invitation
const acceptInvite = jest.fn()
const rejectInvite = jest.fn()
// The same array across renders, as both real hooks return until the invitations change
const invitations = [invitation]

let acceptInvitationFromHook: () => void
const useFakeDocInvites: DocInvitesHook = () => {
  const [recentlyAcceptedInvites, setRecentlyAcceptedInvites] = useState<Invitation[]>([])
  acceptInvitationFromHook = () => setRecentlyAcceptedInvites([invitation])
  return {
    invitations,
    recentlyAcceptedInvites,
    acceptInvite,
    rejectInvite,
    confirmModal: <dialog open>Decline invitation?</dialog>,
    inviteForNodeMeta: jest.fn(),
    isLoading: false,
  }
}

describe('HomepageInvitationsLoader', () => {
  test('passes what the hook returns to onChange and renders its confirmation modal', () => {
    const onChange = jest.fn()

    render(<HomepageInvitationsLoader useDocInvites={useFakeDocInvites} onChange={onChange} />)

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ pendingInvitations: [invitation], recentlyAcceptedInvitations: [] }),
    )
    expect(screen.getByRole('dialog')).toHaveTextContent('Decline invitation?')

    const { acceptInvitation, declineInvitation } = onChange.mock.lastCall[0]
    void acceptInvitation(invitation)
    void declineInvitation(invitation)
    expect(acceptInvite).toHaveBeenCalledWith(invitation)
    expect(rejectInvite).toHaveBeenCalledWith(invitation)
  })

  test('passes nothing new when the hook only returns new functions, and calls the latest ones', () => {
    const latestAcceptInvite = jest.fn()
    let rerenderHook = () => {}
    const useHookWithNewFunctions: DocInvitesHook = () => {
      const [renders, setRenders] = useState(0)
      rerenderHook = () => setRenders((count) => count + 1)
      return {
        ...useFakeDocInvites(),
        // Like the legacy hook, a new function on every render
        acceptInvite: renders === 0 ? () => acceptInvite() : latestAcceptInvite,
      }
    }
    const onChange = jest.fn()
    render(<HomepageInvitationsLoader useDocInvites={useHookWithNewFunctions} onChange={onChange} />)

    act(() => rerenderHook())

    expect(onChange).toHaveBeenCalledTimes(1)
    void onChange.mock.lastCall[0].acceptInvitation(invitation)
    expect(latestAcceptInvite).toHaveBeenCalledWith(invitation)
  })

  test('passes the invitations again when the hook updates them', () => {
    const onChange = jest.fn()
    render(<HomepageInvitationsLoader useDocInvites={useFakeDocInvites} onChange={onChange} />)

    act(() => acceptInvitationFromHook())

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ recentlyAcceptedInvitations: [invitation] }))
  })
})

describe('useHomepageInvitations: when the invitations load', () => {
  // Like both real hooks, each fake fetches the invitations when it mounts
  let sdkFetches = 0
  let legacyFetches = 0
  const useFakeSdkInvites: DocInvitesHook = () => {
    useEffect(() => {
      sdkFetches++
    }, [])
    return useFakeDocInvites()
  }
  const useFakeLegacyInvites: DocInvitesHook = () => {
    useEffect(() => {
      legacyFetches++
    }, [])
    return useFakeDocInvites()
  }

  let latest: ReturnType<typeof useHomepageInvitations>
  function Host({ useDocInvites, hookKey }: { useDocInvites: DocInvitesHook; hookKey: string; render?: number }) {
    latest = useHomepageInvitations(useDocInvites, hookKey)
    return latest.loader
  }

  beforeEach(() => {
    sdkFetches = 0
    legacyFetches = 0
  })

  test('loads them once when the homepage opens', () => {
    render(<Host useDocInvites={useFakeSdkInvites} hookKey="SDK" />)

    expect(sdkFetches).toBe(1)
    expect(latest.invitations?.pendingInvitations).toEqual([invitation])
  })

  test('does not load them again when the host re-renders', () => {
    const { rerender } = render(<Host useDocInvites={useFakeSdkInvites} hookKey="SDK" render={1} />)
    const { reloadInvitations } = latest

    rerender(<Host useDocInvites={useFakeSdkInvites} hookKey="SDK" render={2} />)

    expect(sdkFetches).toBe(1)
    expect(latest.reloadInvitations).toBe(reloadInvitations)
  })

  test('does not load them again when they change', () => {
    render(<Host useDocInvites={useFakeSdkInvites} hookKey="SDK" />)

    act(() => acceptInvitationFromHook())

    expect(sdkFetches).toBe(1)
    expect(latest.invitations?.recentlyAcceptedInvitations).toEqual([invitation])
  })

  test('loads them again on reloadInvitations, which resets the recently accepted ones', () => {
    render(<Host useDocInvites={useFakeSdkInvites} hookKey="SDK" />)
    act(() => acceptInvitationFromHook())

    act(() => latest.reloadInvitations())

    expect(sdkFetches).toBe(2)
    expect(latest.invitations?.pendingInvitations).toEqual([invitation])
    expect(latest.invitations?.recentlyAcceptedInvitations).toEqual([])

    act(() => latest.reloadInvitations())
    expect(sdkFetches).toBe(3)
  })

  test('loads them with the new hook when the hook changes', () => {
    const { rerender } = render(<Host useDocInvites={useFakeSdkInvites} hookKey="SDK" />)

    rerender(<Host useDocInvites={useFakeLegacyInvites} hookKey="legacy" />)

    expect(sdkFetches).toBe(1)
    expect(legacyFetches).toBe(1)
  })
})
