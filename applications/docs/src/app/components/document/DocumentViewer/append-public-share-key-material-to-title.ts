import type { NodeMeta } from '@proton/drive-store/lib'
import { type ShareURL, useDriveEventManager } from '@proton/drive-store/store'
import { VolumeTypeForEvents } from '@proton/drive-store/store/_volumes'
import { EVENT_TYPES } from '@proton/shared/lib/drive/constants'
import { type DocumentState } from '@proton/docs-core'
import { useRef, useEffect, useCallback } from 'react'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import { useAuthentication } from '@proton/components'
import { CacheService } from '@proton/docs-core/lib/Services/CacheService'
import { useApplication } from '~/utils/application-context'
import { useDocsUrlBar } from '~/utils/docs-url-bar'

/**
 * Will append the key material from the public share url to the document title:
 *
 * - If the document has been publicly shared already when loaded.
 * - When public sharing is turned on for a document.
 *
 * Only does this if the current user is the admin of the document.
 */
export function AppendPublicShareKeyMaterialToTitle({
  nodeMeta,
  documentState,
}: {
  nodeMeta: NodeMeta
  documentState: DocumentState
}) {
  if (!documentState.getProperty('userRole').canReadPublicShareUrl()) {
    throw new Error('Do not render AppendPublicShareKeyMaterialToTitle if user cannot read public share url')
  }

  const application = useApplication()
  const driveEventManager = useDriveEventManager()
  const compat = application.compatWrapper.getUserCompat()

  const { linkId, volumeId } = nodeMeta

  const { getLocalID } = useAuthentication()
  const { openAction, changeURLVisually } = useDocsUrlBar()

  const resetURLToNormalLink = useCallback(() => {
    changeURLVisually({
      type: openAction?.type ?? 'doc',
      mode: 'open',
      linkId,
      volumeId,
    })
  }, [changeURLVisually, linkId, openAction?.type, volumeId])

  const handleShareUrlInfo = useCallback(
    (shareUrl: ShareURL | undefined) => {
      if (!shareUrl) {
        application.logger.info('No public share link info available')
        resetURLToNormalLink()
        return
      }

      const sharedLink = compat.getSharedLinkFromShareUrl(shareUrl)
      const token = shareUrl.token

      const localID = getLocalID()
      if (localID !== undefined) {
        CacheService.setLocalIDForDocumentInCache({ token }, localID)
      }

      if (!sharedLink) {
        application.logger.info('Could not get shared link')
        resetURLToNormalLink()
        return
      }

      const urlPassword = new URL(sharedLink).hash
      changeURLVisually({
        type: openAction?.type ?? 'doc',
        mode: 'open-url',
        linkId,
        token,
        urlPassword,
      })
    },
    [application.logger, changeURLVisually, compat, getLocalID, linkId, openAction?.type, resetURLToNormalLink],
  )

  const linkStateChangeInProgress = useRef(false)

  const onLinkStateChange = useCallback(
    async (enabled: boolean) => {
      if (linkStateChangeInProgress.current) {
        return
      }

      linkStateChangeInProgress.current = true

      const abortController = new AbortController()
      const getShareUrlInfo = compat.getPublicShareUrlInfo(abortController.signal)

      if (enabled) {
        application.logger.info('Getting public share url on link state change')
        await getShareUrlInfo(nodeMeta)
          .then((result) => {
            handleShareUrlInfo(result?.shareUrl)
          })
          .catch(console.error)
      } else {
        resetURLToNormalLink()
      }

      linkStateChangeInProgress.current = false
    },
    [application.logger, compat, handleShareUrlInfo, nodeMeta, resetURLToNormalLink],
  )

  useEffectOnce(() => {
    const abortController = new AbortController()

    const getShareUrlInfo = compat.getPublicShareUrlInfo(abortController.signal)

    getShareUrlInfo(nodeMeta)
      .then((result) => {
        handleShareUrlInfo(result?.shareUrl)
      })
      .catch(console.error)
  })

  useEffect(() => {
    const eventDisposer = documentState.subscribeToEvent('PublicLinkToggleStateChanged', (payload) => {
      application.logger.info('Adjusting URL from Share modal UI toggle')
      void onLinkStateChange(payload.enabled)
    })

    return eventDisposer
  }, [application.logger, documentState, onLinkStateChange])

  useEffectOnce(() => {
    const handlerId = driveEventManager.eventHandlers.register((volumeId, { events }) => {
      if (volumeId !== nodeMeta.volumeId) {
        return
      }

      for (const event of events) {
        if (event.encryptedLink.linkId !== linkId || event.eventType !== EVENT_TYPES.UPDATE_METADATA) {
          continue
        }

        application.logger.info('Adjusting URL from Drive event')
        void onLinkStateChange(event.encryptedLink.isShared ?? false)
      }
    })

    driveEventManager.volumes.startSubscription(nodeMeta.volumeId, VolumeTypeForEvents.main).catch(console.error)

    return () => {
      driveEventManager.eventHandlers.unregister(handlerId)
      driveEventManager.volumes.unsubscribe(nodeMeta.volumeId)
    }
  })

  return null
}
