import { useCallback, useEffect, useRef, useState } from 'react'
import { c } from 'ttag'

import { useNotifications } from '@proton/app-context/useNotifications'
import { ValidationError, getDrive } from '@proton/drive'
import { receiveCustomPasswordFromDriveWindow } from '@proton/drive/modules/publicDocsSharing'
import { authenticatePublicDrive, loadPublicLinkInfo } from '@proton/docs-core/lib/DriveSDK/authenticatePublicDrive'
import { getPublicLinkInfo } from '@proton/docs-core/lib/DriveSDK/getPublicDrive'
import { reportPublicDriveError } from '@proton/docs-core/lib/DriveSDK/traceErrorSDK'
import { getPublicLinkUrl } from '@proton/docs-shared/lib/URL/getPublicLinkUrl'
import { getPublicLinkUrlParams } from '@proton/docs-shared/lib/URL/getPublicLinkUrlParams'
import { getUrlPassword } from '@proton/docs-shared/lib/URL/getUrlPassword'
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors'
import type { ProviderType } from '../provider-type'

type Status = 'loading' | 'waitingForPasswordFromDriveWindow' | 'passwordNeeded' | 'ready' | 'error'

export type PublicLinkState = {
  isReady: boolean
  isError: boolean
  error?: Error
  isPasswordNeeded: boolean
  isWaitingForPasswordFromDriveWindow: boolean
}

/**
 * Drive SDK counterpart of `usePublicDocsToken` and `usePublicNode` from drive-store.
 */
export function usePublicLink(providerType: ProviderType) {
  const isAnonymousContext = providerType === 'public-unauthenticated'
  const { createNotification } = useNotifications()

  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<Error>()
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
        await openPublicLink(customPassword, isAnonymousContext, !!directAccess)
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
      .then(async ({ isCustomPasswordProtected, directAccess }) => {
        if (isCustomPasswordProtected) {
          askForPassword()
          return
        }
        try {
          await openPublicLink(undefined, isAnonymousContext, !!directAccess)
          setStatus('ready')
        } catch (error) {
          if (!isPermissionDeniedError(error)) {
            throw error
          }
          askForPassword()
        }
      })
      // Unlike legacy, a failed root node load shows the error page instead of loading forever,
      // and `error` is the raw SDK error
      .catch(handleError)
  }, [isAnonymousContext, submitPublicLinkPassword, handleError])

  // In case linkId is missing, an error page will be shown because `isError` and `error` will be truthy.
  const linkIdError =
    status === 'ready' && !getPublicLinkInfo().linkId ? new Error('No valid linkId present') : undefined

  return {
    publicLinkState: {
      isReady: status === 'ready' && !linkIdError,
      isError: status === 'error' || !!linkIdError,
      error: error || linkIdError,
      isPasswordNeeded: status === 'passwordNeeded' || status === 'waitingForPasswordFromDriveWindow',
      isWaitingForPasswordFromDriveWindow: status === 'waitingForPasswordFromDriveWindow',
    },
    submitPublicLinkPassword,
  }
}

async function openPublicLink(
  customPassword: string | undefined,
  isAnonymousContext: boolean,
  hasRootDirectAccess: boolean,
) {
  const { url, linkIdParam } = getPublicLinkParams()
  await authenticatePublicDrive(url, customPassword, isAnonymousContext)
  await loadPublicLinkInfo(customPassword, linkIdParam, isAnonymousContext, hasRootDirectAccess)
}

function getPublicLinkParams() {
  const { token, linkIdParam, urlPassword } = getPublicLinkUrlParams(window.location)
  return { url: getPublicLinkUrl(token, urlPassword), linkIdParam }
}

function isPermissionDeniedError(error: unknown) {
  return error instanceof ValidationError && error.code === API_CUSTOM_ERROR_CODES.PERMISSION_DENIED
}
