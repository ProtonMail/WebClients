import { useNotifications } from '@proton/app-context/useNotifications'
import { useConfirmActionModal } from '@proton/components/components/confirmActionModal/ConfirmActionModal'
import { getDrive, ValidationError, type ProtonDriveClient, type ProtonInvitationWithNode } from '@proton/drive/sdk'
import type { ExtendedInvitationDetails } from '@proton/docs-shared/InvitationTypes'
import { traceErrorSDK } from '@proton/docs-core/DriveSDK/traceErrorSDK'
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { DocInvitesHook } from '@proton/drive-store/lib/_invites/useDocInvites'
import { c } from 'ttag'
import { useDocInvitationsStore } from './use-doc-invitations-store'
import { getCoreEventSubscriber } from './core-event-subscriber'
import { sharedLogger } from './logger'

/**
 * This hook can be used only ONCE because it will re-fetch all invitations every time it's initialized.
 * That can't be changed until we completely get rid of non-SDK solution.
 * If you need to perform actions on invitations, pass accept/reject invite functions etc. via props.
 */
export const useDocInvites: DocInvitesHook = () => {
  const drive = getDrive()
  const { createNotification } = useNotifications()

  const [isLoading, setIsLoading] = useState(true) // Consistent with legacy
  const [confirmModal, showConfirmModal] = useConfirmActionModal()

  const convertedInvitations = useDocInvitationsStore((state) => state.convertedInvitations)
  const [recentlyAcceptedInvites, setRecentlyAcceptedInvites] = useState<ExtendedInvitationDetails[]>([])

  const abortReload = useRef<AbortController>()
  const fetchAndStoreInvitations = useCallback(async () => {
    abortReload.current?.abort()
    const abort = new AbortController()
    abortReload.current = abort

    try {
      const invitations = await fetchInvitations(getDrive(), abort.signal)
      if (!abort.signal.aborted) {
        useDocInvitationsStore.getState().setInvitations(invitations)
      }
    } catch (error) {
      if (!abort.signal.aborted) {
        sharedLogger.error('Failed to load invitations', error as Error)
        traceErrorSDK(error, 'DocsInvitationsDriveSDK')
      }
    }

    if (!abort.signal.aborted) {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!drive) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    void fetchAndStoreInvitations()
    const removeListener = getCoreEventSubscriber().addListener(fetchAndStoreInvitations)
    return () => {
      removeListener()
      abortReload.current?.abort()
    }
    // We want dependency on drive so we can fetch when drive becomes available
  }, [drive, fetchAndStoreInvitations])

  const acceptInvite = useCallback(
    async (invitation: ExtendedInvitationDetails) => {
      const drive = getDrive()

      if (!drive) {
        const error = new Error('Drive SDK not initialized')
        traceErrorSDK(error, 'DocsInvitationsDriveSDK')
        throw error
      }

      const { updateInvitation } = useDocInvitationsStore.getState()

      updateInvitation(invitation.invitation.invitationId, { isLocked: true })

      try {
        await drive.acceptInvitation(invitation.invitation.invitationId)
        setRecentlyAcceptedInvites((previous) => [...previous, invitation])
        void fetchAndStoreInvitations()

        return {
          shareId: invitation.share.shareId,
          linkId: invitation.link.linkId,
          volumeId: invitation.share.volumeId,
        }
      } catch (error) {
        updateInvitation(invitation.invitation.invitationId, { isLocked: false })
        if (!(error instanceof ValidationError)) {
          traceErrorSDK(error, 'DocsInvitationsDriveSDK')
        }
        throw error
      }
    },
    [fetchAndStoreInvitations],
  )

  const rejectInvite = useCallback(
    (toReject: ExtendedInvitationDetails) => {
      const drive = getDrive()

      const invitationName = <strong key={toReject.invitation.invitationId}>{`${toReject.decryptedLinkName} `}</strong>
      // translator: the variable is the name of a file/folder/album that the user declines the invitations too
      const message = c('Info')
        .jt`You're about to decline the invitation to join the ${invitationName} item. If you proceed, you won't be able to access it unless the owner invites you again. Are you sure you want to continue?`

      showConfirmModal({
        title: c('Title').t`Decline invitation?`,
        message,
        submitText: c('Action').t`Decline invite`,
        cancelText: c('Action').t`Go back`,
        canUndo: true, // Consistency with legacy hook
        onSubmit: async () => {
          const { updateInvitation } = useDocInvitationsStore.getState()

          updateInvitation(toReject.invitation.invitationId, { isLocked: true })

          try {
            await drive.rejectInvitation(toReject.invitation.invitationId)
            void fetchAndStoreInvitations()
          } catch (error) {
            updateInvitation(toReject.invitation.invitationId, { isLocked: false })
            traceErrorSDK(error, 'DocsInvitationsDriveSDK')
            createNotification({
              type: 'error',
              text: c('Notification').t`Failed to reject invitation`,
            })
          }
        },
      })

      // Match legacy hook: it has useless async, we need to maintain compatibility
      return Promise.resolve()
    },
    [createNotification, showConfirmModal, fetchAndStoreInvitations],
  )

  /**
   * Finds an invite (that we've already loaded) with a specified linkId
   */
  const inviteForNodeMeta = useCallback((nodeMeta: { linkId: string }) => {
    return useDocInvitationsStore
      .getState()
      .convertedInvitations.find((invite) => invite.link.linkId === nodeMeta.linkId)
  }, [])

  return {
    isLoading,
    confirmModal,
    invitations: convertedInvitations,
    recentlyAcceptedInvites,
    acceptInvite,
    rejectInvite,
    inviteForNodeMeta,
  }
}

async function fetchInvitations(drive: ProtonDriveClient, abort: AbortSignal) {
  const result: ProtonInvitationWithNode[] = []

  for await (const invitation of drive.iterateInvitations(abort)) {
    const mediaType = invitation.node.mediaType
    if (mediaType && (isProtonDocsDocument(mediaType) || isProtonDocsSpreadsheet(mediaType))) {
      result.push(invitation)
    }
  }

  return result
}
