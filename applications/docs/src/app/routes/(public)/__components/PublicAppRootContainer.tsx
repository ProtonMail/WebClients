import LocationErrorBoundary from '@proton/components/containers/app/LocationErrorBoundary'
import {
  PublicDriveStoreProvider,
  PublicDriveStoreProviderWithAuthenticatedUser,
} from '@proton/drive-store/lib/DriveStoreProvider'
import { PublicApplicationContent } from './PublicApplicationContent'
import { Button } from '@proton/atoms/Button/Button'
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader'
import { c } from 'ttag'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS, DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import { useEffect, useRef, useState } from 'react'
import { usePublicLink, type PublicLinkState } from '~/drive-sdk/usePublicLink'
import { PasswordPage } from './PasswordPage'
import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper'
import type { UserModel } from '@proton/shared/lib/interfaces/User'
import { useGetUser } from '@proton/account/user/hooks'
import { traceErrorSDK } from '@proton/docs-core/DriveSDK/traceErrorSDK'
import type { ProviderType } from '../../../provider-type'
import { DocsUrlContextProvider } from '~/utils/docs-url-bar'
import { getDrive, useDrive } from '@proton/drive/sdk'
import config from '~/config'
import { loggerForSDK, sharedLogger } from '~/drive-sdk/logger'
import { useIsPathCorrectForVendorType } from '../__utils/useIsPathCorrectForVendorType'

export function PublicAppRootContainer({
  session,
  hasReadySession,
}: {
  session?: ResumedSessionResult
  hasReadySession: boolean
}) {
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

  // eslint-disable-next-line no-console
  console.log(
    useAuthenticatedProvider
      ? 'Rendering public provider with authenticated user'
      : 'Rendering public provider without authenticated user',
  )

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
  const { publicLinkState, submitPublicLinkPassword } = usePublicLink(providerType)
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

function RenderApplication({
  providerType,
  user,
  state: { isReady, isError, error, isPasswordNeeded, isWaitingForPasswordFromDriveWindow, vendorType },
  submitPassword,
}: {
  providerType: ProviderType
  user?: UserModel
  state: PublicLinkState
  submitPassword: (password: string) => Promise<void>
}) {
  const hasRenderedContentRef = useRef(false)
  const isPathCorrect = useIsPathCorrectForVendorType(vendorType, hasRenderedContentRef.current)

  useEffect(() => {
    const shouldRenderContent = isReady && !isError && !isPasswordNeeded && isPathCorrect
    if (hasRenderedContentRef.current && !shouldRenderContent) {
      throw new Error('Invalid state transition: PublicApplicationContent is being unmounted after being mounted')
    }
    hasRenderedContentRef.current = shouldRenderContent
  }, [isReady, isError, isPasswordNeeded, isPathCorrect])

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

  if (isPasswordNeeded && !isWaitingForPasswordFromDriveWindow) {
    return <PasswordPage submitPassword={submitPassword} />
  }

  if (!isReady || !isPathCorrect) {
    return <DocumentLoader />
  }

  return (
    <DocsUrlContextProvider>
      <PublicApplicationContent user={user} providerType={providerType} />
    </DocsUrlContextProvider>
  )
}

function DocumentLoader() {
  return (
    <div className="bg-norm flex-column absolute left-0 top-0 flex h-full w-full items-center justify-center gap-4">
      <CircleLoader size="large" />
      <div className="text-center">{c('Info').t`Loading document...`}</div>
    </div>
  )
}
