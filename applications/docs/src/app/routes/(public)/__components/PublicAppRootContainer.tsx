import { LocationErrorBoundary } from '@proton/components'
import {
  PublicDriveStoreProvider,
  PublicDriveStoreProviderWithAuthenticatedUser,
} from '@proton/drive-store/lib/DriveStoreProvider'
import { PublicApplicationContent } from './PublicApplicationContent'
import { usePublicDriveCompat } from '@proton/drive-store/lib'
import { Button, CircleLoader } from '@proton/atoms'
import { c } from 'ttag'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS, DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import { useEffect, useRef } from 'react'
import { PasswordPage } from './PasswordPage'
import { UnAuthenticated } from '@proton/components'
import { PublicCompatProvider } from '@proton/drive-store/lib/usePublicDriveCompat'
import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper'
import type { ProviderType } from '../../../provider-type'

export function PublicAppRootContainer({
  session,
  hasReadySession,
}: {
  session?: ResumedSessionResult
  hasReadySession: boolean
}) {
  const useAuthenticatedProvider = hasReadySession || session != undefined

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
        <UnAuthenticated>
          <PublicCompatProvider session={session}>
            <RenderApplicationWhenReady
              providerType={useAuthenticatedProvider ? 'public-authenticated' : 'public-unauthenticated'}
            />
          </PublicCompatProvider>
        </UnAuthenticated>
      </ApplicableDriveStoreProvider>
    </LocationErrorBoundary>
  )
}

function RenderApplicationWhenReady({ providerType }: { providerType: ProviderType }) {
  const publicDriveCompat = usePublicDriveCompat()

  const {
    isError,
    error,
    isReady,
    isWaitingForPasswordFromDriveWindow,
    isPublicDocsEnabled,
    isPasswordNeeded,
    submitPassword,
  } = publicDriveCompat

  const hasRenderedContentRef = useRef(false)

  useEffect(() => {
    const shouldRenderContent = isReady && !isError && isPublicDocsEnabled && !isPasswordNeeded
    if (hasRenderedContentRef.current && !shouldRenderContent) {
      throw new Error('Invalid state transition: PublicApplicationContent is being unmounted after being mounted')
    }
    hasRenderedContentRef.current = shouldRenderContent
  }, [isReady, isError, isPublicDocsEnabled, isPasswordNeeded])

  useEffect(() => {
    if (error) {
      console.error('publicDriveCompat error', error)
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

  if (isReady && !isPublicDocsEnabled) {
    return (
      <div className="flex-column absolute left-0 top-0 flex h-full w-full items-center justify-center">
        <h1 className="text-lg font-bold">{c('Info').t`Something went wrong`}</h1>
        <div className="mt-1 max-w-lg whitespace-pre-line text-center">
          {c('Info').t`Public documents are not yet enabled for your organization.`}
        </div>
      </div>
    )
  }

  if (isPasswordNeeded && !isWaitingForPasswordFromDriveWindow) {
    return <PasswordPage submitPassword={submitPassword} />
  }

  if (!isReady) {
    return (
      <div className="bg-norm flex-column absolute left-0 top-0 flex h-full w-full items-center justify-center gap-4">
        <CircleLoader size="large" />
        <div className="text-center">{c('Info').t`Loading document...`}</div>
      </div>
    )
  }

  return <PublicApplicationContent publicDriveCompat={publicDriveCompat} providerType={providerType} />
}
