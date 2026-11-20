import { useEffect } from 'react'

import { useApi } from '@proton/app-context/useApi'
import type { NodeMeta } from '@proton/docs-shared/BasicTypes'
import OpenTracer from '@proton/docs-shared/Tracer/Module'
import { generateInvitationUid, getDrive } from '@proton/drive/sdk'
import { queryUserLinkAccess } from '@proton/shared/lib/api/drive/link'
import type { Api } from '@proton/shared/lib/interfaces/Api'
import type { LoggerInterface } from '@proton/shared/lib/logs'

import { useApplication } from '~/utils/application-context'

export type PrivateDocumentInviteGateProps = {
  nodeMeta: NodeMeta
  onAccessReady: () => void
}

type UserLinkAccessResponse = {
  ContextShare?: { ShareID: string; LinkID: string; VolumeID: string } | null
  Invitations?: { ShareID: string; VolumeID: string; InvitationID: string }[] | null
}

/** Acceptances in flight by invitation UID, so a gate mounted again for the same document waits on the same one. */
const acceptancesInProgress = new Map<string, Promise<void>>()

function acceptInvitationOnce(invitationUid: string) {
  let acceptance = acceptancesInProgress.get(invitationUid)
  if (!acceptance) {
    acceptance = getDrive()
      .acceptInvitation(invitationUid)
      .finally(() => acceptancesInProgress.delete(invitationUid))
    acceptancesInProgress.set(invitationUid, acceptance)
  }
  return acceptance
}

/** The invitation to accept for this document, or undefined when the user already has access or has none. */
async function findPendingInvitationUid(api: Api, { volumeId, linkId }: NodeMeta, signal: AbortSignal) {
  const access = await api<UserLinkAccessResponse>({
    ...queryUserLinkAccess({ volumeId, linkId }),
    signal,
    silence: true,
  })
  const invitation = access.Invitations?.[0]
  void OpenTracer.trace('boot_doc_viewer_loader_effect_access_ready_check', {
    hasContextShare: !!access.ContextShare,
    hasInvite: !!invitation,
  })

  if (access.ContextShare || !invitation) {
    return undefined
  }
  return generateInvitationUid(invitation.ShareID, invitation.InvitationID)
}

async function acceptPendingInvitation(api: Api, nodeMeta: NodeMeta, signal: AbortSignal, logger: LoggerInterface) {
  const invitationUid = await findPendingInvitationUid(api, nodeMeta, signal)
  if (!invitationUid || signal.aborted) {
    return
  }

  logger.info('Accepting document invite...')
  void OpenTracer.trace('boot_doc_viewer_loader_effect_accepting_invite')
  await acceptInvitationOnce(invitationUid)
  void OpenTracer.trace('boot_doc_viewer_loader_effect_accepting_invite_success')
}

/**
 * Accepts a pending invite for a private document before the doc loader initializes. It asks the API about this
 * document only, so opening a document never waits on the user's other pending invitations.
 */
export function PrivateDocumentInviteGate({ nodeMeta, onAccessReady }: PrivateDocumentInviteGateProps) {
  const application = useApplication()
  const api = useApi()
  const { volumeId, linkId } = nodeMeta

  useEffect(() => {
    const abortController = new AbortController()
    const { signal } = abortController

    acceptPendingInvitation(api, { volumeId, linkId }, signal, application.logger)
      .catch((error) => {
        if (!signal.aborted) {
          void OpenTracer.trace('boot_doc_viewer_loader_effect_accepting_invite_error')
          application.logger.warn('Could not check or accept document invite', error)
        }
      })
      .finally(() => {
        if (!signal.aborted) {
          onAccessReady()
        }
      })

    return () => abortController.abort()
  }, [api, volumeId, linkId, application.logger, onAccessReady])

  return null
}
