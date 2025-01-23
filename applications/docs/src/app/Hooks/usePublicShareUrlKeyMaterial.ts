import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store/lib'
import { isPublicNodeMeta } from '@proton/drive-store/lib'
import { useDriveEventManager } from '@proton/drive-store/store'
import { VolumeType } from '@proton/drive-store/store/_volumes'
import { EVENT_TYPES } from '@proton/shared/lib/drive/constants'
import type { Application } from '@proton/docs-core'
import { useRef, useEffect } from 'react'
import { useDocsUrlBar } from '../Containers/useDocsUrlBar'

/**
 * Will append the key material from the public share url to the document title:
 * - if the document has been publicly shared already when loaded
 * - when public sharing is turned on for a document
 * Only does this if the current user is the admin of the document
 */
export function useAppendPublicShareKeyMaterialToTitle(
  application: Application,
  nodeMeta: NodeMeta | PublicNodeMeta,
  canReadPublicShareUrl: boolean | undefined,
) {
  const driveEventManager = useDriveEventManager()
  const didSetKeyMaterialAfterLoad = useRef(false)

  const { changeURLVisually } = useDocsUrlBar()

  useEffect(() => {
    if (isPublicNodeMeta(nodeMeta) || !canReadPublicShareUrl) {
      return
    }

    const linkId = nodeMeta.linkId
    const volumeId = nodeMeta.volumeId

    const compat = application.compatWrapper.getUserCompat()
    const abortController = new AbortController()

    const getShareUrlInfo = compat.getPublicShareUrlInfo(abortController.signal)

    function resetURLToNormalLink() {
      changeURLVisually({
        mode: 'open',
        linkId,
        volumeId,
      })
    }

    function handleShareUrlInfo(urlInfo: Awaited<ReturnType<typeof getShareUrlInfo>>) {
      if (!urlInfo) {
        application.logger.info('No public share link info available')
        resetURLToNormalLink()
        return
      }
      const sharedLink = compat.getSharedLinkFromShareUrl(urlInfo.shareUrl)
      const token = urlInfo.shareUrl.token
      if (!sharedLink) {
        application.logger.info('Could not get shared link')
        resetURLToNormalLink()
        return
      }
      const urlPassword = new URL(sharedLink).hash
      changeURLVisually({
        mode: 'open-url',
        linkId: nodeMeta.linkId,
        token,
        urlPassword,
      })
    }

    if (!didSetKeyMaterialAfterLoad.current) {
      application.logger.info('Getting public share url on initial load')
      getShareUrlInfo(nodeMeta).then(handleShareUrlInfo).catch(console.error)
    }

    const handlerId = driveEventManager.eventHandlers.register((volumeId, { events }) => {
      if (volumeId !== nodeMeta.volumeId) {
        return
      }
      for (const event of events) {
        if (event.eventType !== EVENT_TYPES.UPDATE_METADATA) {
          continue
        }
        if (event.encryptedLink.isShared) {
          application.logger.info('Getting public share url on update metadata event')
          getShareUrlInfo(nodeMeta).then(handleShareUrlInfo).catch(console.error)
        } else {
          resetURLToNormalLink()
        }
      }
    })
    driveEventManager.volumes.startSubscription(nodeMeta.volumeId, VolumeType.main).catch(console.error)

    return () => {
      driveEventManager.eventHandlers.unregister(handlerId)
      driveEventManager.volumes.unsubscribe(nodeMeta.volumeId)
      abortController.abort()
    }
  }, [
    application.compatWrapper,
    application.logger,
    canReadPublicShareUrl,
    changeURLVisually,
    driveEventManager.eventHandlers,
    driveEventManager.volumes,
    nodeMeta,
  ])
}
