import type { ReactNode } from 'react'
import { useEffect, useMemo } from 'react'
import { Button } from '@proton/atoms/Button/Button'
import { useApplication } from '~/utils/application-context'
import { c } from 'ttag'
import { APPS, DRIVE_APP_NAME, SSO_PATHS } from '@proton/shared/lib/constants'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { useAuthentication } from '@proton/components'
import { DocsApiErrorCode } from '@proton/shared/lib/api/docs'
import { useUser } from '@proton/account/user/hooks'
import { getInitials } from '@proton/shared/lib/helpers/string'
import { getParsedPathWithoutLocalIDBasename } from '@proton/shared/lib/authentication/pathnameHelper'
import { replaceUrl } from '@proton/shared/lib/helpers/browser'
import { getPathFromLocation, getUrlWithReturnUrl } from '@proton/shared/lib/helpers/url'

function redirectToAccountSwitcherFromUserApp() {
  const accountSwitchUrl = new URL(getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT))
  accountSwitchUrl.searchParams.append('product', 'docs')

  const returnUrl = `/${getParsedPathWithoutLocalIDBasename(getPathFromLocation(window.location))}`
  const urlWithReturnUrl = getUrlWithReturnUrl(accountSwitchUrl.toString(), {
    returnUrl: returnUrl,
    context: 'private',
  })

  replaceUrl(urlWithReturnUrl)
}

function reload() {
  window.location.reload()
}

export type DocumentError = {
  title?: string
  message: string
  userUnderstandableMessage: boolean
  code?: DocsApiErrorCode
  actionButton?: ReactNode
}

export type DocumentErrorFallbackProps = { error: DocumentError }

export function DocumentErrorFallback({ error }: DocumentErrorFallbackProps) {
  const { getLocalID, UID } = useAuthentication()
  const application = useApplication()

  useEffect(() => {
    application.userState.emitEvent({
      name: 'BlockingInterfaceErrorDidDisplay',
      payload: error,
    })
  }, [application.userState, error])

  const isAccessError = error.code === DocsApiErrorCode.InsufficientPermissions

  const message = useMemo(() => {
    let message = c('Info')
      .t`This document may not exist, or we are having issues loading it. Please reload the page and try again.`

    if (isAccessError) {
      message = c('Info')
        .t`You may not have the necessary permissions to view it with your selected account. Try a different account or contact the owner for access.`
    } else if (error.userUnderstandableMessage) {
      message = error.message
    }

    return message
  }, [error.message, error.userUnderstandableMessage, isAccessError])

  let title = c('Info').t`Something went wrong`
  if (isAccessError) {
    title = c('Info').t`You don't have access`
  } else if (error.title) {
    title = error.title
  }

  return (
    <div className="flex-column absolute left-0 top-0 flex h-full w-full items-center justify-center bg-signalInfoMinorCustom">
      <div className="border-weak bg-norm mx-auto max-w-md rounded-lg border p-8">
        <h1 className="text-[1.8rem] font-bold" data-testid="document-load-error">
          {title}
        </h1>
        <div className="mt-1 max-w-lg whitespace-pre-line">{message}</div>
        <div className="mt-4 flex gap-2">
          {isAccessError ? (
            <Button color="norm" shape="outline" onClick={redirectToAccountSwitcherFromUserApp}>
              {c('Action').t`Switch accounts`}
            </Button>
          ) : (
            error.actionButton || (
              <Button color="norm" shape="outline" onClick={reload}>
                {c('Action').t`Reload`}
              </Button>
            )
          )}
          <Button color="norm" onClick={() => window.open(getAppHref('/', APPS.PROTONDRIVE, getLocalID()), '_self')}>
            {c('Action').t`Open ${DRIVE_APP_NAME}`}
          </Button>
        </div>
      </div>
      {UID && isAccessError && <DocumentErrorSignedInAs />}
    </div>
  )
}

export function DocumentErrorSignedInAs() {
  const [user] = useUser()
  const initials = getInitials(user.Name || user.Email || '')

  return (
    <div className="mt-4 flex flex-col gap-1">
      <div className="text-signalInfo text-center">You're currently accessing this document as:</div>
      <div className="border-weak bg-norm mx-auto mt-1 flex max-w-md items-center gap-2 rounded-lg border p-2 px-3 font-bold">
        <span className="user-initials flex flex-shrink-0 rounded border p-1 text-sm" aria-hidden="true">
          <span className="m-auto">{initials}</span>
        </span>
        {user.Email}
      </div>
    </div>
  )
}
