import { useEffect, useRef } from 'react'
import { type NodeMeta } from '@proton/drive-store'
import { useDocInvites } from '@proton/drive-store'

export function InviteAutoAccepter({
  nodeMeta,
  onResult,
}: {
  nodeMeta: NodeMeta
  onResult: (result: boolean) => void
}) {
  const { acceptInvite, inviteForNodeMeta, isLoading } = useDocInvites()
  const acceptRequestInProgress = useRef(false)
  const invite = inviteForNodeMeta(nodeMeta)

  useEffect(() => {
    if (!isLoading && !invite) {
      onResult(false)
    }
  }, [isLoading, invite, onResult])

  useEffect(() => {
    if (invite && !acceptRequestInProgress.current) {
      acceptRequestInProgress.current = true

      try {
        void acceptInvite(invite).then((result) => {
          if (result) {
            onResult(true)
          } else {
            onResult(false)
          }
        })
      } catch (error) {
        onResult(false)
      }
    }
  }, [acceptInvite, invite, onResult])

  return null
}
