import { useCallback, useEffect, useState } from 'react'

import { traceErrorSDK } from '@proton/docs-core/DriveSDK/traceErrorSDK'
import type { NodeMeta, PublicNodeMeta } from '@proton/docs-shared/BasicTypes'
import { isPrivateNodeMeta } from '@proton/docs-shared/NodeMetaHelpers'
import { generateNodeUid, getDrive, type NodeEntity } from '@proton/drive/sdk'

import { getIsSharedWithMe } from '~/drive-sdk/getIsSharedWithMe'

type DriveSharing = {
  /** The user holds a membership on the document itself */
  isSharedDirectly: boolean
  /** Shared directly, or in a folder shared with the user: not their own */
  isSharedWithMe: boolean
}

export type DriveSharingState = {
  /** `undefined` until Drive answers, when it fails, and for a public link */
  sharing: DriveSharing | undefined
  /** Drive failed to answer, which `retry` asks again */
  failed: boolean
  retry: () => void
}

/** How the private document `nodeMeta` is shared with the user, as Drive answers */
export function useDriveSharing(nodeMeta: NodeMeta | PublicNodeMeta | undefined): DriveSharingState {
  const [sharing, setSharing] = useState<DriveSharing>()
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const nodeUid =
    nodeMeta && isPrivateNodeMeta(nodeMeta) ? generateNodeUid(nodeMeta.volumeId, nodeMeta.linkId) : undefined

  useEffect(() => {
    setSharing(undefined)
    setFailed(false)
    if (!nodeUid) {
      return
    }
    let isCurrent = true
    const loadSharing = async () => {
      let node: NodeEntity
      try {
        node = await getDrive().getNode(nodeUid)
      } catch (error) {
        traceErrorSDK(error, 'DocsDriveCompatSDK')
        if (isCurrent) {
          setFailed(true)
        }
        return
      }
      if (isCurrent) {
        setSharing({ isSharedDirectly: !!node.membership, isSharedWithMe: getIsSharedWithMe(node) })
      }
    }
    void loadSharing()
    return () => {
      isCurrent = false
    }
  }, [nodeUid, attempt])

  const retry = useCallback(() => setAttempt((count) => count + 1), [])

  return { sharing, failed, retry }
}
