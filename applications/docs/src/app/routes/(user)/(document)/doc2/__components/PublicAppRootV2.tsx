import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { c } from 'ttag'

import { useGetUser } from '@proton/account/user/hooks'
import { Button } from '@proton/atoms/Button/Button'
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader'
import useAuthentication from '@proton/components/hooks/useAuthentication'
import LocationErrorBoundary from '@proton/components/containers/app/LocationErrorBoundary'
import {
  PublicDriveStoreProvider,
  PublicDriveStoreProviderWithAuthenticatedUser,
} from '@proton/drive-store/lib/DriveStoreProvider'
import { getDrive, useDrive } from '@proton/drive/sdk'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper'
import { APPS, DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import type { UserModel } from '@proton/shared/lib/interfaces/User'
import { useFlagsStatus } from '@unleash/proxy-client-react'

import config from '~/config'
import { loggerForSDK, sharedLogger } from '~/drive-sdk/logger'
import { PasswordPage } from '../../../../(public)/__components/PasswordPage'
import { PublicAppRootContainer } from '../../../../(public)/__components/PublicAppRootContainer'
import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'
import { DocsUrlContextProvider, replaceLastPathSegment, useDocsUrlBar } from '~/utils/docs-url-bar'
import { useRealtimeSdkEnabled } from '~/utils/flags'
import type { ProviderType } from '../../../../../provider-type'
import { useOpenDocumentHeartbeat } from '../__utils/useOpenDocumentHeartbeat'
import {
  PROTON_SHEET_VENDOR_TYPE,
  type PublicLinkV2State,
  type SignedInLink,
  traceErrorSDK,
  usePublicLinkV2,
} from '../__utils/usePublicLinkV2'

// The page and the editor load only once the share URL is signed into, under the app's error boundary
const PublicDocumentPageV2 = lazy(() => import(/* webpackChunkName: "PublicDocumentPageV2" */ '../publicPage'))

type SessionProps = { session?: ResumedSessionResult; hasReadySession: boolean }

/**
 * A public link on `/doc2`: doc2's public page while `DocsRealtimeSdkEnabled` is on, read once Unleash is ready, as the
 * public app doesn't wait for it before rendering. Off, the public app takes over, and its path check corrects `/doc2`
 * to `/doc`, as the user app falls through to `/doc`.
 */
export function PublicAppRootV2(props: SessionProps) {
  const isRealtimeSdkEnabled = useRealtimeSdkEnabled()
  const { flagsReady, flagsError } = useFlagsStatus()
  // Picked once, as the page it picks must never unmount
  const pickedRef = useRef<'doc2' | 'publicApp'>(undefined)
  if (flagsReady || flagsError) {
    pickedRef.current ??= isRealtimeSdkEnabled ? 'doc2' : 'publicApp'
  }

  switch (pickedRef.current) {
    case undefined:
      return <DocumentLoader />
    case 'publicApp':
      return <PublicAppRootContainer {...props} />
    case 'doc2':
      return <PublicDoc2Root {...props} />
  }
}

/**
 * Adapted from `applications/docs/src/app/routes/(public)/__components/PublicAppRootContainer.tsx`, its
 * `PublicAppRootContainer`, `RenderPublicLink` and `usePublicUser`: the Drive SDK, the Drive store and the visitor.
 */
function PublicDoc2Root({ session, hasReadySession }: SessionProps) {
  const useAuthenticatedProvider = hasReadySession || session != undefined

  const { init: initializeDriveSDK } = useDrive()
  // Only initialize if not already initialized.
  // Done during render, not in an effect, because children call getDrive()
  // and effects would run after they render, when the SDK is still uninitialized.
  if (!getDrive()) {
    initializeDriveSDK({
      appName: APPS.PROTONDOCS,
      appVersion: config.APP_VERSION,
      logging: loggerForSDK(sharedLogger),
    })
  }

  const ApplicableDriveStoreProvider = useAuthenticatedProvider
    ? PublicDriveStoreProviderWithAuthenticatedUser
    : PublicDriveStoreProvider

  return (
    <LocationErrorBoundary>
      <ApplicableDriveStoreProvider>
        <RenderPublicLink providerType={useAuthenticatedProvider ? 'public-authenticated' : 'public-unauthenticated'} />
      </ApplicableDriveStoreProvider>
    </LocationErrorBoundary>
  )
}

function RenderPublicLink({ providerType }: { providerType: ProviderType }) {
  const { publicLinkState, submitPublicLinkPassword } = usePublicLinkV2(providerType)
  const { user, isUserReady } = usePublicUser(providerType)

  return (
    <RenderApplication
      providerType={providerType}
      user={user}
      state={{ ...publicLinkState, isReady: publicLinkState.isReady && isUserReady }}
      submitPassword={submitPublicLinkPassword}
    />
  )
}

// The session may be undefined even when signed in, so the user is loaded here.
function usePublicUser(providerType: ProviderType) {
  const getUser = useGetUser()
  const isAuthenticated = providerType === 'public-authenticated'
  const [user, setUser] = useState<UserModel>()
  const [isUserReady, setIsUserReady] = useState(!isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      getUser()
        .then(setUser)
        .catch((error) => traceErrorSDK(error, 'DocsDriveCompatSDK'))
        .finally(() => setIsUserReady(true))
    }
  }, [getUser, isAuthenticated])

  return { user, isUserReady }
}

/**
 * Adapted from `applications/docs/src/app/routes/(public)/__components/PublicAppRootContainer.tsx`, its
 * `RenderApplication`: the error page, the password page and the loader, then doc2's page in place of
 * `PublicApplicationContent`. A spreadsheet goes to `/sheet`, through a load of the public app, before any password.
 */
export function RenderApplication({
  providerType,
  user,
  state: { isReady, isError, error, isPasswordNeeded, isWaitingForPasswordFromDriveWindow, vendorType, signedIn },
  submitPassword,
}: {
  providerType: ProviderType
  user?: UserModel
  state: PublicLinkV2State
  submitPassword: (password: string) => Promise<void>
}) {
  const hasRenderedContentRef = useRef(false)
  const isSheet = vendorType === PROTON_SHEET_VENDOR_TYPE

  useEffect(() => {
    if (!isSheet) {
      return
    }
    // The hash holds the url password and may have been restored outside the router, so read it from window
    const { pathname, search, hash } = window.location
    window.location.replace(`${replaceLastPathSegment(pathname, 'sheet')}${search}${hash}`)
  }, [isSheet])

  useEffect(() => {
    const shouldRenderContent = isReady && !isError && !isPasswordNeeded && !isSheet
    if (hasRenderedContentRef.current && !shouldRenderContent) {
      throw new Error('Invalid state transition: PublicDocumentContentV2 is being unmounted after being mounted')
    }
    hasRenderedContentRef.current = shouldRenderContent
  }, [isReady, isError, isPasswordNeeded, isSheet])

  useEffect(() => {
    if (error) {
      console.error('Public link error', error)
    }
  }, [error])

  if (isError) {
    return (
      <div className="flex-column absolute left-0 top-0 flex h-full w-full items-center justify-center">
        <h1 className="text-lg font-bold">{c('Info').t`Something went wrong`}</h1>
        <div className="mt-1 max-w-lg whitespace-pre-line text-center">
          {c('Info')
            .t`This document may not exist, or you may not have permission to view it. You may try reloading the page to see if the issue persists or reach out to the owner for access.`}
        </div>
        <div className="mt-4 flex gap-2">
          <Button color="norm" onClick={() => window.open(getAppHref('/', APPS.PROTONDRIVE), '_self')}>
            {c('Action').t`Open ${DRIVE_APP_NAME}`}
          </Button>
        </div>
      </div>
    )
  }

  if (isSheet) {
    return <DocumentLoader />
  }

  if (isPasswordNeeded && !isWaitingForPasswordFromDriveWindow) {
    return <PasswordPage submitPassword={submitPassword} />
  }

  if (!isReady || !signedIn) {
    return <DocumentLoader />
  }

  return (
    <DocsUrlContextProvider>
      <PublicDocumentContentV2 signedIn={signedIn} user={user} providerType={providerType} />
    </DocsUrlContextProvider>
  )
}

/**
 * doc2's public page, handed what the share URL's sign-in gave. doc2 reads only the logger from the Application, so
 * it gets the shared logger alone, whose buffer the title menu's Download logs exports.
 */
function PublicDocumentContentV2({
  signedIn,
  user,
  providerType,
}: {
  signedIn: SignedInLink
  user?: UserModel
  providerType: ProviderType
}) {
  const { getLocalID } = useAuthentication()
  const { openAction, removeLocalIDFromUrl } = useDocsUrlBar()
  useOpenDocumentHeartbeat('public')
  const application = useMemo(
    () => ({ logger: sharedLogger }) as unknown as ApplicationProviderProps['application'],
    [],
  )

  // As /doc's DocumentViewer once open: the link reopens under a signed-in visitor's account without `/u/<id>/`
  useEffect(() => {
    const localID = getLocalID()
    const token = openAction && 'token' in openAction ? openAction.token : undefined
    if (localID !== undefined && token && setLocalIDForTokenInCache(token, localID)) {
      removeLocalIDFromUrl()
    }
  }, [getLocalID, openAction, removeLocalIDFromUrl])

  return (
    <ApplicationProvider application={application}>
      <Suspense fallback={<DocumentLoader />}>
        <PublicDocumentPageV2 {...signedIn} user={user} providerType={providerType} />
      </Suspense>
    </ApplicationProvider>
  )
}

/**
 * Adapted from `packages/docs-core/lib/Services/CacheService.ts`, its `setLocalIDForDocumentInCache` for a public
 * link's token, with the same key, so the user app finds the local id where /doc leaves it.
 */
function setLocalIDForTokenInCache(token: string, localID: number): boolean {
  try {
    localStorage.setItem(`local-id:${token}`, JSON.stringify(localID))
    return true
  } catch (_) {
    return false
  }
}

/** Copied from `applications/docs/src/app/routes/(public)/__components/PublicAppRootContainer.tsx`, its `DocumentLoader` */
function DocumentLoader() {
  return (
    <div className="bg-norm flex-column absolute left-0 top-0 flex h-full w-full items-center justify-center gap-4">
      <CircleLoader size="large" />
      <div className="text-center">{c('Info').t`Loading document...`}</div>
    </div>
  )
}
