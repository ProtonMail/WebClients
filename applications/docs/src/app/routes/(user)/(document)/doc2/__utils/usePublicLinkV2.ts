import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { c } from 'ttag'

import { useNotifications } from '@proton/app-context/useNotifications'
import { getPublicLinkUrl } from '@proton/docs-shared/URL/getPublicLinkUrl'
import { getPublicLinkUrlParams } from '@proton/docs-shared/URL/getPublicLinkUrlParams'
import { getUrlPassword } from '@proton/docs-shared/URL/getUrlPassword'
import { receiveCustomPasswordFromDriveWindow } from '@proton/drive/public/publicDocsSharing'
import { MemberRole, type NodeEntity, NodeType, ValidationError, getDrive, splitNodeUid } from '@proton/drive/sdk'
import metrics from '@proton/metrics/metricsInstance'
import { SHARE_URL_PERMISSIONS } from '@proton/shared/lib/drive/permissions'
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors'
import { getSentryError, SentryRealtimeInitiatives, traceError } from '@proton/shared/lib/helpers/sentry'
import type { HandshakeInfoVendorType } from '@proton/shared/lib/interfaces/drive/sharing'

import { PROTON_SHEET_VENDOR_TYPE } from '../../../../(public)/__utils/useIsPathCorrectForVendorType'
import type { ProviderType } from '../../../../../provider-type'
import type { PublicLinkHandoff } from './publicLink'

type Status = 'loading' | 'waitingForPasswordFromDriveWindow' | 'passwordNeeded' | 'ready' | 'error'

/** What the share URL's sign-in gives doc2's public page: the client and the link, from its root node */
export type SignedInLink = Pick<PublicLinkHandoff, 'publicDrive' | 'linkInfo'>

export type PublicLinkV2State = {
  isReady: boolean
  isError: boolean
  error?: Error
  isPasswordNeeded: boolean
  isWaitingForPasswordFromDriveWindow: boolean
  /** The type of the shared item, known from the handshake before any password is entered */
  vendorType: HandshakeInfoVendorType | undefined
  /** Set once ready */
  signedIn?: SignedInLink
}

/**
 * Signs into the share URL: the handshake, the password when the link has one, then the client and the link's root
 * node. Adapted from `applications/docs/src/app/drive-sdk/usePublicLink.ts`, which keeps the client and the link in
 * docs-core's module state; this returns them, so doc2 reads nothing from docs-core.
 */
export function usePublicLinkV2(providerType: ProviderType) {
  const isAnonymousContext = providerType === 'public-unauthenticated'
  const { createNotification } = useNotifications()

  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<Error>()
  const [vendorType, setVendorType] = useState<HandshakeInfoVendorType>()
  const [opened, setOpened] = useState<OpenedLink>()
  const didStart = useRef(false)

  const handleError = useCallback((error: Error) => {
    reportPublicDriveError(error)
    setError(error)
    setStatus('error')
  }, [])

  const submitPublicLinkPassword = useCallback(
    async (customPassword: string) => {
      try {
        // The SDK caches the SRP session of the handshake info, so each attempt needs a fresh one
        const { directAccess } = await getDrive().experimental.getURLAccessInfo(getPublicLinkParams().url)
        setOpened(await openPublicLink(customPassword, isAnonymousContext, !!directAccess))
        setStatus('ready')
      } catch (error) {
        if (!isPermissionDeniedError(error)) {
          handleError(error as Error)
          return
        }
        createNotification({ type: 'error', text: c('Error').t`Incorrect password. Please try again.` })
      }
    },
    [isAnonymousContext, createNotification, handleError],
  )

  useEffect(() => {
    if (didStart.current) {
      return
    }

    didStart.current = true

    /**
     * Run this to update the window location hash value,
     * in case we are coming back from signup/signin and needing to get the hash from local storage.
     */
    getUrlPassword()

    const askForPassword = () => {
      setStatus('waitingForPasswordFromDriveWindow')
      receiveCustomPasswordFromDriveWindow({
        submitPassword: submitPublicLinkPassword,
        onFail: () => setStatus('passwordNeeded'),
      })
    }

    getDrive()
      .experimental.getURLAccessInfo(getPublicLinkParams().url)
      .then(async ({ isCustomPasswordProtected, directAccess, vendorType: handshakeVendorType }) => {
        setVendorType(handshakeVendorType)
        if (handshakeVendorType === PROTON_SHEET_VENDOR_TYPE) {
          // The public app on /sheet signs in, and takes the password from Drive's window: this page is about to go
          return
        }
        if (isCustomPasswordProtected) {
          askForPassword()
          return
        }
        try {
          setOpened(await openPublicLink(undefined, isAnonymousContext, !!directAccess))
          setStatus('ready')
        } catch (error) {
          if (!isPermissionDeniedError(error)) {
            throw error
          }
          askForPassword()
        }
      })
      // A failed root node load shows the error page, and `error` is the raw SDK error
      .catch(handleError)
  }, [isAnonymousContext, submitPublicLinkPassword, handleError])

  // In case linkId is missing, an error page will be shown because `isError` and `error` will be truthy.
  const linkId = opened?.linkInfo.linkId
  const linkIdError = status === 'ready' && !linkId ? new Error('No valid linkId present') : undefined
  // One object per sign-in, so the page's effects on it run once
  const signedIn = useMemo(
    () =>
      status === 'ready' && opened && linkId
        ? { publicDrive: opened.publicDrive, linkInfo: { ...opened.linkInfo, linkId } }
        : undefined,
    [status, opened, linkId],
  )

  const publicLinkState: PublicLinkV2State = {
    isReady: !!signedIn,
    isError: status === 'error' || !!linkIdError,
    error: error || linkIdError,
    isPasswordNeeded: status === 'passwordNeeded' || status === 'waitingForPasswordFromDriveWindow',
    isWaitingForPasswordFromDriveWindow: status === 'waitingForPasswordFromDriveWindow',
    vendorType,
    signedIn,
  }
  return { publicLinkState, submitPublicLinkPassword }
}

type OpenedLink = {
  publicDrive: SignedInLink['publicDrive']
  linkInfo: Omit<SignedInLink['linkInfo'], 'linkId'> & { linkId: string | undefined }
}

/**
 * Adapted from `packages/docs-core/lib/DriveSDK/authenticatePublicDrive.ts`, its `authenticatePublicDrive` and
 * `loadPublicLinkInfo`, returning the client and the link instead of setting them on docs-core's module state.
 */
async function openPublicLink(
  customPassword: string | undefined,
  isAnonymousContext: boolean,
  hasRootDirectAccess: boolean,
): Promise<OpenedLink> {
  const { url, linkIdParam } = getPublicLinkParams()
  const publicDrive = await getDrive().experimental.authURLAccess(url, customPassword, isAnonymousContext)
  const { uid, accessToken } = publicDrive.experimental.getSessionInfo()
  // This enables metrics to work for both auth and un-auth customers
  metrics.setAuthHeaders(uid, accessToken)
  const rootNode = await publicDrive.getRootNode()
  return {
    publicDrive,
    linkInfo: { ...toLinkInfo(rootNode, linkIdParam, isAnonymousContext, hasRootDirectAccess), customPassword },
  }
}

function toLinkInfo(
  rootNode: NodeEntity,
  linkIdParam: string | undefined,
  isAnonymousContext: boolean,
  hasRootDirectAccess: boolean,
): OpenedLink['linkInfo'] {
  const { volumeId, nodeId } = splitNodeUid(rootNode.uid)
  const isSharedUrlAFolder = rootNode.type === NodeType.Folder
  return {
    /**
     * For directly shared public doc links, Drive might redirect to Docs without a linkId.
     * If the shared url is a file then we can use the linkId of the loaded root node,
     * and if the shared url is a folder we need the linkId param to be passed.
     */
    linkId: isSharedUrlAFolder ? linkIdParam : nodeId,
    volumeId,
    isSharedUrlAFolder,
    permissions: roleToPermissions(rootNode.directRole),
    hasDirectAccess: getHasDirectAccess(isSharedUrlAFolder, isAnonymousContext, hasRootDirectAccess),
  }
}

/**
 * Direct access to the shared root covers the document too, whether it is the root itself or inside it.
 * Without it, a document inside a shared folder may still be shared directly, which the public link can't tell.
 */
function getHasDirectAccess(isSharedUrlAFolder: boolean, isAnonymousContext: boolean, hasRootDirectAccess: boolean) {
  if (isAnonymousContext) {
    return false
  }
  if (hasRootDirectAccess) {
    return true
  }
  return isSharedUrlAFolder ? undefined : false
}

// Unlike legacy, which reads the share URL permissions, they are derived from the direct role of the root node
function roleToPermissions(role: MemberRole): SHARE_URL_PERMISSIONS {
  return role === MemberRole.Editor || role === MemberRole.Admin
    ? SHARE_URL_PERMISSIONS.EDITOR
    : SHARE_URL_PERMISSIONS.VIEWER
}

function getPublicLinkParams() {
  const { token, linkIdParam, urlPassword } = getPublicLinkUrlParams(window.location)
  return { url: getPublicLinkUrl(token, urlPassword), linkIdParam }
}

function isPermissionDeniedError(error: unknown) {
  return error instanceof ValidationError && error.code === API_CUSTOM_ERROR_CODES.PERMISSION_DENIED
}

/**
 * Errors from Drive SDK are missing stack trace from our app so we wrap it. Copied from
 * `packages/docs-core/lib/DriveSDK/traceErrorSDK.ts`, its `traceErrorSDK` and `reportPublicDriveError`.
 */
export function traceErrorSDK(error: any, feature: string) {
  // Wrapping hides error name from Sentry's ignoreErrors (e.g. AbortError), so filter before
  if (!getSentryError(error) || error instanceof ValidationError) {
    return
  }
  const errorWithCurrentStack = new Error(error?.message ?? 'Failed while calling Drive SDK')
  errorWithCurrentStack.cause = error
  traceError(errorWithCurrentStack, {
    tags: {
      initiative: SentryRealtimeInitiatives.SDK_SWITCH,
      feature,
    },
  })
}

function reportPublicDriveError(error: unknown) {
  const isNotFound = error instanceof ValidationError && error.code === API_CUSTOM_ERROR_CODES.NOT_FOUND
  if (!isNotFound) {
    traceErrorSDK(error, 'DocsDriveCompatSDK')
  }
}
