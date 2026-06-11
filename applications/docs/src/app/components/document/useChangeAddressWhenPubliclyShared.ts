import useAuthentication from '@proton/components/hooks/useAuthentication'
import type { DocumentState, PublicDocumentState } from '@proton/docs-core'
import { CacheService } from '@proton/docs-core/lib/Services/CacheService'
import { generateNodeUid, getDrive } from '@proton/drive'
import { isPrivateNodeMeta, type NodeMeta, type PublicNodeMeta } from '@proton/drive-store/lib/NodeMeta'
import { useEffect, useRef } from 'react'
import { useApplication } from '~/utils/application-context'
import { useSharingModalDriveSdkEnabled } from '~/utils/flags'

export function useChangeAddressWhenPubliclyShared(
  nodeMeta: NodeMeta | PublicNodeMeta,
  documentState: DocumentState | PublicDocumentState | null,
) {
  const { logger } = useApplication()
  const drive = getDrive()
  const { getLocalID } = useAuthentication()

  const sharingModalDriveSdkEnabled = useSharingModalDriveSdkEnabled()

  const nodeMetaNotPrivate = !isPrivateNodeMeta(nodeMeta)

  const changedAddress = useRef<boolean>(false)
  useEffect(
    // When SDK is enabled and AppendPublicShareKeyMaterialToTitle is not used, the default URL address is not updated
    function setInitialAddress() {
      if (
        changedAddress.current ||
        !sharingModalDriveSdkEnabled ||
        !documentState ||
        !documentState.getProperty('userRole').canReadPublicShareUrl() ||
        nodeMetaNotPrivate
      ) {
        return
      }

      const { volumeId, nodeId } = documentState.getProperty('decryptedNode')

      drive
        .getSharingInfo(generateNodeUid(volumeId, nodeId))
        .then((result) => {
          if (result) {
            const newAddress = result.publicLink ? getPublicURL(result.publicLink.url) : getPrivateURL(volumeId, nodeId)

            const localID = getLocalID()
            if (result.publicLink && localID) {
              const { pathname } = new URL(result.publicLink.url)
              const token = getToken(pathname)
              CacheService.setLocalIDForDocumentInCache({ token }, localID)
            }

            history.replaceState(null, '', newAddress)

            changedAddress.current = true
          }
        })
        .catch((error) => logger.warn('Failed to change URL in address bar after changing public sharing', error))
    },
    [logger, documentState, sharingModalDriveSdkEnabled, nodeMetaNotPrivate, drive, getLocalID],
  )
}

// We are transitioning from toggle OFF to ON
export function getPublicURL(publicLinkUrl: string) {
  // Example: /doc?mode=open&volumeId=ZXC&linkId=BAR
  const currentLocation = new URL(window.location.href)
  const locationParameters = new URLSearchParams(currentLocation.search)
  const linkId = locationParameters.get('linkId')
  if (!linkId) {
    throw new Error('Failed to extract linkId from current URL')
  }

  // Example: https://docs.proton.dev/urls/FOO#QAZ
  const { pathname, hash } = new URL(publicLinkUrl)
  const token = getToken(pathname)

  // Output should be /doc?mode=open-url&token=FOO&linkId=BAR#QAZ
  const result = new URL(currentLocation.origin)
  result.search = new URLSearchParams({ mode: 'open-url', linkId, token }).toString()
  result.hash = hash
  return result
}

function getToken(pathname: string) {
  const token = pathname.split('/').pop()
  if (!token) {
    throw new Error('Failed to extract token from current URL')
  }
  return token
}

// We are transitioning from toggle ON to OFF
export function getPrivateURL(volumeId: string, linkId: string) {
  const currentLocation = new URL(window.location.href)
  // Output should be /doc?mode=open&volumeId=ZXC&linkId=BAR
  const result = new URL(currentLocation.origin)
  result.search = new URLSearchParams({ mode: 'open', volumeId, linkId }).toString()
  return result
}
