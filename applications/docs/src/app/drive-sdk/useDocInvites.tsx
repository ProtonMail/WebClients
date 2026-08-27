import useAuthentication from '@proton/components/hooks/useAuthentication'
import { useNotifications } from '@proton/app-context/useNotifications'
import { useConfirmActionModal } from '@proton/components/components/confirmActionModal/ConfirmActionModal'
import { getDrive, type ProtonDriveClient, type ProtonInvitationWithNode } from '@proton/drive'
import type { ExtendedInvitationDetails } from '@proton/drive-store/store'
import { traceErrorSDK } from '@proton/docs-core/lib/DriveSDK/traceErrorSDK'
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype'
import { useCallback, useEffect, useState } from 'react'
import type { DocInvitesHook } from '@proton/drive-store'
import { c } from 'ttag'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { getNewWindow } from '@proton/shared/lib/helpers/window'
import { useDocInvitationsStore } from './use-doc-invitations-store'
import { SentryRealtimeInitiatives, traceError } from '@proton/shared/lib/helpers/sentry'

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
  const openInvitedDocument = useOpenInvitedDocument()

  const convertedInvitations = useDocInvitationsStore((state) => state.convertedInvitations)
  const [recentlyAcceptedInvites, setRecentlyAcceptedInvites] = useState<ExtendedInvitationDetails[]>([])

  useEffect(() => {
    if (!drive) {
      return
    }

    const { setInvitations } = useDocInvitationsStore.getState()
    const abort = new AbortController()

    setIsLoading(true)
    void fetchInvitations(drive, abort.signal)
      .then((invitations) => {
        if (abort.signal.aborted) {
          return
        }
        setInvitations(invitations)
      })
      .catch((error) => {
        if (abort.signal.aborted) {
          return
        }
        traceErrorSDK(error, 'DocsInvitationsDriveSDK')
        createNotification({
          type: 'error',
          text: c('Notification').t`Failed to load invitations`,
        })
      })
      .finally(() => {
        setIsLoading(false)
      })

    return () => abort.abort()
    // We want dependency on drive so we can fetch when drive becomes available
  }, [drive, createNotification])

  const acceptInvite = useCallback(async (invitation: ExtendedInvitationDetails) => {
    const drive = getDrive()

    if (!drive) {
      const error = new Error('Drive SDK not initialized')
      traceError(error, {
        tags: {
          initiative: SentryRealtimeInitiatives.SDK_SWITCH,
          feature: 'DocsInvitationsDriveSDK',
        },
      })
      throw error
    }

    const { updateInvitation, removeInvitation } = useDocInvitationsStore.getState()

    updateInvitation(invitation.invitation.invitationId, { isLocked: true })

    try {
      await drive.acceptInvitation(invitation.invitation.invitationId)
      setRecentlyAcceptedInvites((previous) => [...previous, invitation])
      removeInvitation(invitation.invitation.invitationId)
      return {
        shareId: invitation.share.shareId,
        linkId: invitation.link.linkId,
        volumeId: invitation.share.volumeId,
      }
    } catch (error) {
      updateInvitation(invitation.invitation.invitationId, { isLocked: false })
      traceErrorSDK(error, 'DocsInvitationsDriveSDK')
      throw error
    }
  }, [])

  const rejectInvite = useCallback(
    (toReject: ExtendedInvitationDetails) => {
      const drive = getDrive()
      const { removeInvitation } = useDocInvitationsStore.getState()

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
          try {
            await drive.rejectInvitation(toReject.invitation.invitationId)
            removeInvitation(toReject.invitation.invitationId)
          } catch (error) {
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
    [createNotification, showConfirmModal],
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
    showConfirmModal,
    invitations: convertedInvitations,
    recentlyAcceptedInvites,
    acceptInvite,
    rejectInvite,
    openInvitedDocument,
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

function useOpenInvitedDocument() {
  const { getLocalID } = useAuthentication()

  return function openInvitedDocument(invitation: ExtendedInvitationDetails) {
    const window = getNewWindow().handle
    const type = isProtonDocsSpreadsheet(invitation.link.mimeType) ? 'sheet' : 'doc'
    const volumeId = invitation.share.volumeId
    const linkId = invitation.link.linkId

    const href = getAppHref(`/${type}`, APPS.PROTONDOCS, getLocalID())
    const url = new URL(href)
    url.searchParams.append('mode', 'open')
    url.searchParams.append('volumeId', volumeId)
    url.searchParams.append('linkId', linkId)

    window.location.assign(url)
  }
}
