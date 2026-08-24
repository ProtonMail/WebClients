import useAuthentication from '@proton/components/hooks/useAuthentication'
import type { DocumentState, PublicDocumentState } from '@proton/docs-core'
import { CacheService } from '@proton/docs-core/lib/Services/CacheService'
import { generateNodeUid, getDrive } from '@proton/drive'
import type { ShareResult } from '@proton/drive'
import { isPrivateNodeMeta, type NodeMeta, type PublicNodeMeta } from '@proton/drive-store/lib/NodeMeta'
import { useEffect, useRef } from 'react'
import { useApplication } from '~/utils/application-context'
import { useSharingModalDriveSdkEnabled } from '~/utils/flags'
import OpenTracer from '@proton/docs-shared/lib/Tracer/Module'
import { addSentryBreadcrumb, SentryRealtimeInitiatives, traceError } from '@proton/shared/lib/helpers/sentry'

export function useChangeAddressWhenPubliclyShared(
  nodeMeta: NodeMeta | PublicNodeMeta,
  documentState: DocumentState | PublicDocumentState | null,
) {
  const { isPublicMode } = useApplication()
  const drive = getDrive()
  const { getLocalID } = useAuthentication()

  const sharingModalDriveSdkEnabled = useSharingModalDriveSdkEnabled()

  const nodeMetaNotPrivate = !isPrivateNodeMeta(nodeMeta)

  const changedAddress = useRef<boolean>(false)
  useEffect(
    // When SDK is enabled and AppendPublicShareKeyMaterialToTitle is not used, the default URL address is not updated
    function setInitialAddress() {
      void OpenTracer.trace('boot_use_change_address_when_publicly_shared_set_initial_address_start')
      if (
        changedAddress.current ||
        !sharingModalDriveSdkEnabled ||
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
    [documentState, sharingModalDriveSdkEnabled, nodeMetaNotPrivate, drive, getLocalID, isPublicMode],
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
  if (error instanceof Error && error.name === 'AbortError') {
    return
  }

  const errorMessage = 'Failed to change URL in address bar after changing public sharing'

  const errorWithCurrentStack = new Error(errorMessage)
  errorWithCurrentStack.cause = error

  addSentryBreadcrumb({
    category: 'docs',
    level: 'warning',
    message: 'Failure in useChangeAddressWhenPubliclyShared',
    data: breadcrumb,
  })
  traceError(errorWithCurrentStack, {
    tags: {
      initiative: SentryRealtimeInitiatives.SDK_SWITCH,
      feature: 'DocsSharingModalDriveSDK',
    },
  })
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

export function getToken(pathname: string) {
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
