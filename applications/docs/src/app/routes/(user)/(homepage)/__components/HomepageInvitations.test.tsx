import type { ExtendedInvitationDetails } from '@proton/docs-shared/InvitationTypes'
import { act, render, screen } from '@testing-library/react'
import { useEffect, useState } from 'react'

import { useDocInvites, type DocInvites } from '~/drive-sdk/useDocInvites'
import { HomepageInvitationsLoader, useHomepageInvitations } from './HomepageInvitations'

vi.mock('~/drive-sdk/useDocInvites', () => ({ useDocInvites: vi.fn() }))

const invitation = { invitation: { invitationId: 'invitation1' } } as ExtendedInvitationDetails
const acceptInvite = vi.fn()
const rejectInvite = vi.fn()
// The same array across renders, as the real hook returns until the invitations change
const invitations = [invitation]

// Like the real hook, it fetches the invitations when it mounts
let fetches = 0
let acceptInvitationFromHook: () => void
function useFakeDocInvites(): DocInvites {
  useEffect(() => {
    fetches++
  }, [])
  const [recentlyAcceptedInvites, setRecentlyAcceptedInvites] = useState<ExtendedInvitationDetails[]>([])
  acceptInvitationFromHook = () => setRecentlyAcceptedInvites([invitation])
  return {
    invitations,
    recentlyAcceptedInvites,
    acceptInvite,
    rejectInvite,
    confirmModal: <dialog open>Decline invitation?</dialog>,
    inviteForNodeMeta: vi.fn(),
    isLoading: false,
  }
}

beforeEach(() => {
  fetches = 0
  vi.mocked(useDocInvites).mockImplementation(useFakeDocInvites)
})

describe('HomepageInvitationsLoader', () => {
  test('passes what the hook returns to onChange and renders its confirmation modal', () => {
    const onChange = vi.fn()

    render(<HomepageInvitationsLoader onChange={onChange} />)

    expect(onChange).toHaveBeenLastCalledWith({
      pendingInvitations: [invitation],
      recentlyAcceptedInvitations: [],
      acceptInvitation: acceptInvite,
      declineInvitation: rejectInvite,
    })
    expect(screen.getByRole('dialog')).toHaveTextContent('Decline invitation?')
  })

  test('passes the invitations again when the hook updates them', () => {
    const onChange = vi.fn()
    render(<HomepageInvitationsLoader onChange={onChange} />)

    act(() => acceptInvitationFromHook())

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ recentlyAcceptedInvitations: [invitation] }))
  })
})

describe('useHomepageInvitations: when the invitations load', () => {
  let latest: ReturnType<typeof useHomepageInvitations>
  function Host(_: { render?: number }) {
    latest = useHomepageInvitations()
    return latest.loader
  }

  test('loads them once when the homepage opens', () => {
    render(<Host />)

    expect(fetches).toBe(1)
    expect(latest.invitations?.pendingInvitations).toEqual([invitation])
  })

  test('does not load them again when the host re-renders', () => {
    const { rerender } = render(<Host render={1} />)
    const { reloadInvitations } = latest

    rerender(<Host render={2} />)

    expect(fetches).toBe(1)
    expect(latest.reloadInvitations).toBe(reloadInvitations)
  })

  test('does not load them again when they change', () => {
    render(<Host />)

    act(() => acceptInvitationFromHook())

    expect(fetches).toBe(1)
    expect(latest.invitations?.recentlyAcceptedInvitations).toEqual([invitation])
  })

  test('loads them again on reloadInvitations, which resets the recently accepted ones', () => {
    render(<Host />)
    act(() => acceptInvitationFromHook())

    act(() => latest.reloadInvitations())

    expect(fetches).toBe(2)
    expect(latest.invitations?.pendingInvitations).toEqual([invitation])
    expect(latest.invitations?.recentlyAcceptedInvitations).toEqual([])

    act(() => latest.reloadInvitations())
    expect(fetches).toBe(3)
  })
})
