import { useEffect, useRef } from 'react'

import type { NodeMeta } from '@proton/docs-shared'
import OpenTracer from '@proton/docs-shared/lib/Tracer/Module'

import { useApplication } from '~/utils/application-context'
import { useDocInvites } from '~/drive-sdk/useDocInvites'

export type PrivateDocumentInviteGateProps = {
  nodeMeta: NodeMeta
  onAccessReady: () => void
}

/**
 * Accepts a pending invite for a private document before the doc loader initializes.
 * Must only be mounted when InvitationsStateProvider is available (signed-in private app).
 */
export function PrivateDocumentInviteGate({ nodeMeta, onAccessReady }: PrivateDocumentInviteGateProps) {
  const application = useApplication()
  const { acceptInvite, inviteForNodeMeta, isLoading: isInviteLoading } = useDocInvites()
  const invite = inviteForNodeMeta(nodeMeta)
  const acceptInviteInProgress = useRef(false)

  useEffect(() => {
    void OpenTracer.trace('boot_doc_viewer_loader_effect_access_ready_check', {
      isInviteLoading,
      acceptInviteInProgress: acceptInviteInProgress.current,
      hasInvite: !!invite,
    })

    if (isInviteLoading || acceptInviteInProgress.current) {
      return
    }

    if (!invite) {
      onAccessReady()
      return
    }

    acceptInviteInProgress.current = true
    application.logger.info('Accepting document invite...')
    void OpenTracer.trace('boot_doc_viewer_loader_effect_accepting_invite')

    void acceptInvite(invite)
      .then((result) => {
        if (result) {
          void OpenTracer.trace('boot_doc_viewer_loader_effect_accepting_invite_success')
        } else {
          void OpenTracer.trace('boot_doc_viewer_loader_effect_accepting_invite_no_result')
        }
      })
      .catch((error) => {
        void OpenTracer.trace('boot_doc_viewer_loader_effect_accepting_invite_error')
        application.logger.warn('Could not accept invite', error)
      })
      .finally(() => {
        onAccessReady()
      })
  }, [nodeMeta, isInviteLoading, invite, acceptInvite, application.logger, onAccessReady])

  return null
}
