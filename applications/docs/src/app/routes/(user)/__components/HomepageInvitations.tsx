import type { DocInvitesHook } from '@proton/drive-store/lib/_invites/useDocInvites'
import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react'

import type { HomepageViewProviderProps } from '~/homepage'

export type HomepageInvitations = Pick<
  HomepageViewProviderProps,
  'pendingInvitations' | 'recentlyAcceptedInvitations' | 'acceptInvitation' | 'declineInvitation'
>

export type HomepageInvitationsLoaderProps = {
  useDocInvites: DocInvitesHook
  /** Keep it the same function across renders, such as a state setter: what it gets is set as state in the host. */
  onChange: (invitations: HomepageInvitations) => void
}

/**
 * Runs the host's invitations hook and passes what the homepage reads from it to `onChange`, so the homepage gets values,
 * not the hook. Hooks can't be swapped in place: key it by the hook, so that changing the hook remounts only this
 * component. It renders the modal that confirms declining an invitation.
 */
export const HomepageInvitationsLoader = memo(function HomepageInvitationsLoader({
  useDocInvites,
  onChange,
}: HomepageInvitationsLoaderProps) {
  const { invitations, recentlyAcceptedInvites, acceptInvite, rejectInvite, confirmModal } = useDocInvites()

  // The legacy hook returns new functions on every render. Passing stable ones calls onChange, which re-renders the
  // whole homepage, only when the invitations change.
  const latest = useRef({ acceptInvite, rejectInvite })
  latest.current = { acceptInvite, rejectInvite }
  const acceptInvitation = useCallback<HomepageInvitations['acceptInvitation']>(
    (invitation) => latest.current.acceptInvite(invitation),
    [],
  )
  const declineInvitation = useCallback<HomepageInvitations['declineInvitation']>(
    (invitation) => latest.current.rejectInvite(invitation),
    [],
  )

  useLayoutEffect(() => {
    onChange({
      pendingInvitations: invitations,
      recentlyAcceptedInvitations: recentlyAcceptedInvites,
      acceptInvitation,
      declineInvitation,
    })
  }, [onChange, invitations, recentlyAcceptedInvites, acceptInvitation, declineInvitation])

  return confirmModal
})

/**
 * Loads the invitations for the homepage with `useDocInvites`, and keeps them while the homepage re-renders or shows
 * its invitations table again. Both invitations hooks fetch when they mount and on server events, and neither has a
 * refetch function: `reloadInvitations` remounts the loader, which fetches again and resets the recently accepted
 * invitations. Render `loader` once. Changing `hookKey`, which names `useDocInvites`, also remounts it.
 */
export function useHomepageInvitations(useDocInvites: DocInvitesHook, hookKey: string) {
  // Set by the loader before the first paint
  const [invitations, setInvitations] = useState<HomepageInvitations>()
  const [reloadCount, setReloadCount] = useState(0)
  const reloadInvitations = useCallback(() => setReloadCount((count) => count + 1), [])

  const loader = (
    <HomepageInvitationsLoader
      key={`${hookKey}-${reloadCount}`}
      useDocInvites={useDocInvites}
      onChange={setInvitations}
    />
  )

  return { invitations, reloadInvitations, loader }
}
