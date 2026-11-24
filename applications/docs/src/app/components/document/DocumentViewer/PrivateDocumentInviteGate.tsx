import { useEffect } from 'react'

import { useApi } from '@proton/app-context/useApi'
import type { NodeMeta } from '@proton/docs-shared/BasicTypes'
import OpenTracer from '@proton/docs-shared/Tracer/Module'
import { generateInvitationUid, getDrive } from '@proton/drive/sdk'
import { queryInvitationDetails } from '@proton/shared/lib/api/drive/invitation'
import { queryUserLinkAccess } from '@proton/shared/lib/api/drive/link'
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions'
import type { Api } from '@proton/shared/lib/interfaces/Api'
import type { ShareInvitationDetailsPayload } from '@proton/shared/lib/interfaces/drive/invitation'
import type { LoggerInterface } from '@proton/shared/lib/logs'

import { useApplication } from '~/utils/application-context'

export type PrivateDocumentInviteGateProps = {
  nodeMeta: NodeMeta
  onAccessReady: () => void
}

type PendingInvitation = { ShareID: string; VolumeID: string; InvitationID: string }

type UserLinkAccessResponse = {
  ContextShare?: { ShareID: string; LinkID: string; VolumeID: string } | null
  Invitations?: PendingInvitation[] | null
}

type InvitationDetails = {
  invitation: PendingInvitation
  sharedLinkId: string
  /** A bitfield, and a higher value grants more: viewer < editor < admin editor. */
  permissions: SHARE_MEMBER_PERMISSIONS
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
/** The invitations to accept for this document: none when the user already has access or has no invitation. */
async function findInvitationUidsToAccept(api: Api, { volumeId, linkId }: NodeMeta, signal: AbortSignal) {
  const access = await api<UserLinkAccessResponse>({
    ...queryUserLinkAccess({ volumeId, linkId }),
    signal,
    silence: true,
  })
  const invitations = access.Invitations ?? []
  void OpenTracer.trace('boot_doc_viewer_loader_effect_access_ready_check', {
    hasContextShare: !!access.ContextShare,
    hasInvite: invitations.length > 0,
  })

  if (access.ContextShare || invitations.length === 0) {
    return []
  }
  const chosen = invitations.length === 1 ? invitations : await chooseInvitations(api, invitations, linkId, signal)
  return chosen.map((invitation) => generateInvitationUid(invitation.ShareID, invitation.InvitationID))
}

/**
 * user-link-access also returns invitations to the folders above the document, in no set order, and without the
 * shared link or the permissions, so look each one up. The document's own invitation is always accepted, and a
 * folder's too when it grants more, so an editor of the folder who is a viewer of the document can edit it.
 */
async function chooseInvitations(api: Api, invitations: PendingInvitation[], linkId: string, signal: AbortSignal) {
  const lookups = await Promise.allSettled(
    invitations.map((invitation) => fetchInvitationDetails(api, invitation, signal)),
  )
  // A failed lookup is skipped: acting on the others beats no access, and those not accepted stay pending in Drive
  const found = lookups.flatMap((lookup) => (lookup.status === 'fulfilled' ? [lookup.value] : []))
  if (found.length === 0) {
    throw (lookups[0] as PromiseRejectedResult).reason
  }

  const ownInvitation = found.find((details) => details.sharedLinkId === linkId)
  const folderInvitations = found.filter((details) => details !== ownInvitation)
  if (!ownInvitation) {
    return [grantingMost(folderInvitations).invitation]
  }
  if (folderInvitations.length === 0) {
    return [ownInvitation.invitation]
  }
  const bestFolderInvitation = grantingMost(folderInvitations)
  return bestFolderInvitation.permissions > ownInvitation.permissions
    ? [ownInvitation.invitation, bestFolderInvitation.invitation]
    : [ownInvitation.invitation]
}

async function fetchInvitationDetails(
  api: Api,
  invitation: PendingInvitation,
  signal: AbortSignal,
): Promise<InvitationDetails> {
  const details = await api<ShareInvitationDetailsPayload>({
    ...queryInvitationDetails(invitation.InvitationID),
    signal,
    silence: true,
  })
  return { invitation, sharedLinkId: details.Link.LinkID, permissions: details.Invitation.Permissions }
}

function grantingMost(candidates: InvitationDetails[]) {
  return candidates.reduce((most, candidate) => (candidate.permissions > most.permissions ? candidate : most))
}

async function acceptPendingInvitations(api: Api, nodeMeta: NodeMeta, signal: AbortSignal, logger: LoggerInterface) {
  const invitationUids = await findInvitationUidsToAccept(api, nodeMeta, signal)
  if (invitationUids.length === 0 || signal.aborted) {
    return
  }

  logger.info('Accepting document invite...')
  void OpenTracer.trace('boot_doc_viewer_loader_effect_accepting_invite')
  // One at a time, the document's own first, so a folder's failing never keeps the user out of the document
  for (const invitationUid of invitationUids) {
    await acceptInvitationOnce(invitationUid)
  }
  void OpenTracer.trace('boot_doc_viewer_loader_effect_accepting_invite_success')
}

/**
 * Accepts pending invites for a private document before the doc loader initializes. It asks the API about this
 * document only, so opening a document never waits on the user's other pending invitations.
 */
export function PrivateDocumentInviteGate({ nodeMeta, onAccessReady }: PrivateDocumentInviteGateProps) {
  const application = useApplication()
  const api = useApi()
  const { volumeId, linkId } = nodeMeta

  useEffect(() => {
    const abortController = new AbortController()
    const { signal } = abortController

    acceptPendingInvitations(api, { volumeId, linkId }, signal, application.logger)
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
