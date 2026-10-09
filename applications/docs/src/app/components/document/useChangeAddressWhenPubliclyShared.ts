import useAuthentication from '@proton/components/hooks/useAuthentication'
import type { DocumentState, PublicDocumentState } from '@proton/docs-core'
import { CacheService } from '@proton/docs-core/lib/Services/CacheService'
import { traceErrorSDK } from '@proton/docs-core/lib/DriveSDK/traceErrorSDK'
import type { NodeMeta, PublicNodeMeta } from '@proton/docs-shared'
import OpenTracer from '@proton/docs-shared/lib/Tracer/Module'
import type { ShareResult } from '@proton/drive'
import { generateNodeUid, getDrive } from '@proton/drive'
import { isPrivateNodeMeta } from '@proton/drive-store/lib/NodeMeta'
import { addSentryBreadcrumb } from '@proton/shared/lib/helpers/sentry'
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper'
import { useEffect, useRef } from 'react'
import { useApplication } from '~/utils/application-context'

export function useChangeAddressWhenPubliclyShared(
  nodeMeta: NodeMeta | PublicNodeMeta,
  documentState: DocumentState | PublicDocumentState | null,
) {
  const { isPublicMode } = useApplication()
  const drive = getDrive()
  const { getLocalID } = useAuthentication()

  const nodeMetaNotPrivate = !isPrivateNodeMeta(nodeMeta)

  const changedAddress = useRef<boolean>(false)
  useEffect(
    function setInitialAddress() {
      void OpenTracer.trace('boot_use_change_address_when_publicly_shared_set_initial_address_start')
      if (
        changedAddress.current ||
        !documentState ||
        !documentState.getProperty('userRole').canReadPublicShareUrl() ||
        nodeMetaNotPrivate
      ) {
        void OpenTracer.trace('boot_use_change_address_when_publicly_shared_set_initial_address_return')
        return
      }

      const { volumeId, nodeId } = documentState.getProperty('decryptedNode')

      drive
        .getSharingInfo(generateNodeUid(volumeId, nodeId))
        .then((result) => {
          if (result) {
            replaceAddress({ getLocalID, urlAccess: result.urlAccess, volumeId, nodeId, traceEnabled: true })
            changedAddress.current = true
          }
        })
        .catch((error) =>
          reportChangeAddressError(error, {
            volumeId,
            nodeId,
            userRole: documentState.getProperty('userRole').roleType,
            isPublicMode,
          }),
        )
    },
    [documentState, nodeMetaNotPrivate, drive, getLocalID, isPublicMode],
  )
}

export function replaceAddress({
  getLocalID,
  urlAccess,
  volumeId,
  nodeId,
  traceEnabled = false,
}: {
  getLocalID: ReturnType<typeof useAuthentication>['getLocalID']
  urlAccess: ShareResult['urlAccess']
  volumeId: string
  nodeId: string
  traceEnabled?: boolean
}) {
  const newAddress = urlAccess ? getPublicURL(urlAccess.url) : getPrivateURL(volumeId, nodeId)

  const localID = getLocalID()
  if (urlAccess && localID) {
    const { pathname } = new URL(urlAccess.url)
    const token = getToken(pathname)
    CacheService.setLocalIDForDocumentInCache({ token }, localID)
  }

  if (traceEnabled) {
    void OpenTracer.trace('boot_use_change_address_when_publicly_shared_replace_state', {
      newAddress: newAddress.pathname,
      localID,
    })
  }

  history.replaceState(null, '', newAddress)
}

export function reportChangeAddressError(error: any, breadcrumb: Record<string, any>) {
  addSentryBreadcrumb({
    category: 'docs',
    level: 'warning',
    message: 'Failure in useChangeAddressWhenPubliclyShared',
    data: breadcrumb,
  })
  traceErrorSDK(error, 'DocsSharingModalDriveSDK')
}

// We are transitioning from toggle OFF to ON
function getPublicURL(publicLinkUrl: string) {
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
  const result = new URL(stripLocalBasenameFromPathname(currentLocation.pathname), currentLocation.origin)
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
function getPrivateURL(volumeId: string, linkId: string) {
  const currentLocation = new URL(window.location.href)
  // Output should be /doc?mode=open&volumeId=ZXC&linkId=BAR
  const result = new URL(stripLocalBasenameFromPathname(currentLocation.pathname), currentLocation.origin)
  result.search = new URLSearchParams({ mode: 'open', volumeId, linkId }).toString()
  return result
}
