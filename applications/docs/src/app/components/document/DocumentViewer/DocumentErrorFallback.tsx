import { useEffect } from 'react'
import { Button } from '@proton/atoms'
import { useApplication } from '../../../Containers/ApplicationProvider'
import { c } from 'ttag'
import { APPS, DRIVE_APP_NAME, SSO_PATHS } from '@proton/shared/lib/constants'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { useAuthentication } from '@proton/components'
import type { DocsApiErrorCode } from '@proton/shared/lib/api/docs'
import { useUser } from '@proton/account/user/hooks'
import { getUrlWithReturnUrl } from '@proton/shared/lib/helpers/url'
import { replaceUrl } from '@proton/shared/lib/helpers/browser'
import { getInitials } from '@proton/shared/lib/helpers/string'

export type DocumentError = {
  message: string
  userUnderstandableMessage: boolean
  code?: DocsApiErrorCode
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

  const redirectToAccountSwitcher = () => {
    const accountSwitchUrl = new URL(getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT))
    accountSwitchUrl.searchParams.append('product', 'docs')

    const returnUrlSearchParams = new URLSearchParams(window.location.search)

    const returnUrl = `/?`.concat(returnUrlSearchParams.toString())
    const urlWithReturnUrl = getUrlWithReturnUrl(accountSwitchUrl.toString(), {
      returnUrl: returnUrl,
      context: 'private',
    })

    replaceUrl(urlWithReturnUrl)
  }

  return (
    <div className="flex-column absolute left-0 top-0 flex h-full w-full items-center justify-center bg-signalInfoMinorCustom">
      <div className="border-weak bg-norm mx-auto max-w-md rounded-lg border p-8">
        <h1 className="text-[1.8rem] font-bold">{c('Info').t`Something went wrong`}</h1>
        <div className="mt-1 max-w-lg whitespace-pre-line">
          {error.userUnderstandableMessage
            ? error.message
            : c('Info')
                .t`This document may not exist, or you may not have the necessary permissions to view it with your selected account. Try a different account or contact the owner for access.`}
        </div>
        <div className="mt-4 flex gap-2">
          <Button color="norm" shape="outline" onClick={redirectToAccountSwitcher}>
            {c('Action').t`Switch accounts`}
          </Button>
          <Button color="norm" onClick={() => window.open(getAppHref('/', APPS.PROTONDRIVE, getLocalID()), '_self')}>
            {c('Action').t`Open ${DRIVE_APP_NAME}`}
          </Button>
        </div>
      </div>
      {UID && <DocumentErrorSignedInAs />}
    </div>
  )
}

export const DocumentErrorSignedInAs = () => {
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
