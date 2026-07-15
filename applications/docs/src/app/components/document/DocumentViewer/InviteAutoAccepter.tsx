import { useEffect, useRef } from 'react'
import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import { useDocInvites } from '@proton/drive-store'
import OpenTracer from '@proton/docs-shared/lib/Tracer/Module'

export type InviteAutoAcceptResult =
  | {
      success: true
      acceptedNodeMeta: NodeMeta
    }
  | {
      success: false
    }

export type InviteAutoAccepterProps = {
  nodeMeta: NodeMeta | PublicNodeMeta
  onResult: (result: InviteAutoAcceptResult) => void
}

export function InviteAutoAccepter({ nodeMeta, onResult }: InviteAutoAccepterProps) {
  const { acceptInvite, inviteForNodeMeta, isLoading } = useDocInvites()
  const acceptRequestInProgress = useRef(false)
  const invite = inviteForNodeMeta(nodeMeta)

  useEffect(() => {
    if (!isLoading && !invite) {
      void OpenTracer.trace('boot_invite_auto_accepter_is_loading_and_no_invite')
      onResult({ success: false })
    }
  }, [isLoading, invite, onResult])

  useEffect(() => {
    if (invite && !acceptRequestInProgress.current) {
      void OpenTracer.trace('boot_invite_auto_accepter_invite_and_not_in_progress')
      acceptRequestInProgress.current = true

      try {
        void acceptInvite(invite).then((result) => {
          void OpenTracer.trace('boot_invite_auto_accepter_accept_invite_then')
          if (result) {
            onResult({
              success: true,
              acceptedNodeMeta: { linkId: invite.link.linkId, volumeId: invite.share.volumeId },
            })
          } else {
            void OpenTracer.trace('boot_invite_auto_accepter_accept_invite_then_false')
            onResult({ success: false })
          }
        })
      } catch (error) {
        void OpenTracer.trace('boot_invite_auto_accepter_on_error', { error: JSON.stringify(error) })
        onResult({ success: false })
      }
    }
  }, [acceptInvite, invite, onResult])

  return null
}
