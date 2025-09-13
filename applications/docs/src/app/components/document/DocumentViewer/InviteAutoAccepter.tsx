import { useEffect, useRef } from 'react'
import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import { useDocInvites } from '@proton/drive-store'

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
      onResult({ success: false })
    }
  }, [isLoading, invite, onResult])

  useEffect(() => {
    if (invite && !acceptRequestInProgress.current) {
      acceptRequestInProgress.current = true

      try {
        void acceptInvite(invite).then((result) => {
          if (result) {
            onResult({
              success: true,
              acceptedNodeMeta: { linkId: invite.link.linkId, volumeId: invite.share.volumeId },
            })
          } else {
            onResult({ success: false })
          }
        })
      } catch (error) {
        onResult({ success: false })
      }
    }
  }, [acceptInvite, invite, onResult])

  return null
}
