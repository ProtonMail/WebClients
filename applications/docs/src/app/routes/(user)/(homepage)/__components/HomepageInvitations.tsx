import { memo, useCallback, useLayoutEffect, useState } from 'react'

import type { HomepageDependencies } from '~/homepage'
import { useDocInvites } from '~/drive-sdk/useDocInvites'

export type HomepageInvitations = Pick<
  HomepageDependencies,
  'pendingInvitations' | 'recentlyAcceptedInvitations' | 'acceptInvitation' | 'declineInvitation'
>

export type HomepageInvitationsLoaderProps = {
  /** Keep it the same function across renders, such as a state setter: what it gets is set as state in the host. */
  onChange: (invitations: HomepageInvitations) => void
}

/**
 * Runs `useDocInvites` and passes what the homepage reads from it to `onChange`, so the homepage gets values, not the
 * hook. It renders the modal that confirms declining an invitation.
 */
export const HomepageInvitationsLoader = memo(function HomepageInvitationsLoader({
  onChange,
}: HomepageInvitationsLoaderProps) {
  const { invitations, recentlyAcceptedInvites, acceptInvite, rejectInvite, confirmModal } = useDocInvites()

  useLayoutEffect(() => {
    onChange({
      pendingInvitations: invitations,
      recentlyAcceptedInvitations: recentlyAcceptedInvites,
      acceptInvitation: acceptInvite,
      declineInvitation: rejectInvite,
    })
  }, [onChange, invitations, recentlyAcceptedInvites, acceptInvite, rejectInvite])

  return confirmModal
})

/**
 * Loads the invitations for the homepage, and keeps them while the homepage re-renders or shows its invitations table
 * again. `useDocInvites` fetches when it mounts and on server events, and has no refetch function: `reloadInvitations`
 * remounts the loader, which fetches again and resets the recently accepted invitations. Render `loader` once.
 */
export function useHomepageInvitations() {
  // Set by the loader before the first paint
  const [invitations, setInvitations] = useState<HomepageInvitations>()
  const [reloadCount, setReloadCount] = useState(0)
  const reloadInvitations = useCallback(() => setReloadCount((count) => count + 1), [])

  const loader = <HomepageInvitationsLoader key={reloadCount} onChange={setInvitations} />

  return { invitations, reloadInvitations, loader }
}
