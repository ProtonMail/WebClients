import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants'
import { replaceUrl } from '@proton/shared/lib/helpers/browser'
import { getUrlWithReturnUrl } from '@proton/shared/lib/helpers/url'
import { PLANS } from '@proton/payments'
import { Actions, countActionWithTelemetry, traceTelemetry } from '@proton/drive-store/utils/telemetry'
import { getCurrentTab, getNewWindow } from '@proton/shared/lib/helpers/window'
import { DOCS_SIGNIN, DOCS_SIGNUP } from '@proton/shared/lib/docs/urls'
import {
  RedirectionReason,
  drivePublicRedirectionReasonKey,
} from '@proton/drive-store/hooks/util/useRedirectToPublicPage'
import { saveUrlPasswordForRedirection } from '@proton/drive-store/utils/url/password'
import type { RedirectAction } from '@proton/drive-store/store/_documents/useOpenDocument'

function openUrl(url: string, openInNewTab: boolean) {
  const tab = openInNewTab ? getNewWindow() : getCurrentTab()
  tab.handle.location.assign(url)
}

export const redirectToAccountSwitcher = (token: string, linkId: string | undefined, urlPassword: string) => {
  const accountSwitchUrl = new URL(getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT))
  accountSwitchUrl.searchParams.append('product', 'docs')

  const returnUrlSearchParams = new URLSearchParams()
  returnUrlSearchParams.append('mode', 'open-url-reauth')
  returnUrlSearchParams.append('token', token)
  if (linkId) {
    returnUrlSearchParams.append('linkId', linkId)
  }

  // We need to pass by the private app to set latest active session, then be redirected to public page.
  // This will be done in MainContainer.tsx on page loading
  returnUrlSearchParams.append(drivePublicRedirectionReasonKey, RedirectionReason.ACCOUNT_SWITCH)
  const returnUrl = `/?`.concat(returnUrlSearchParams.toString())
  const urlWithReturnUrl = getUrlWithReturnUrl(accountSwitchUrl.toString(), {
    returnUrl: returnUrl,
    context: 'private',
  })

  // Save password before going to account switch page
  saveUrlPasswordForRedirection(urlPassword)

  // We replace the url to prevent any bad action from the user,
  // like returning back into the history after signout all sessions
  replaceUrl(urlWithReturnUrl)
}

export const redirectToSignUp = async ({
  action,
  token,
  email,
  linkId,
  urlPassword,
  openInNewTab,
}: {
  action: RedirectAction | undefined
  token: string
  email: string
  linkId: string | undefined
  urlPassword: string
  openInNewTab: boolean
}) => {
  await Promise.all([
    countActionWithTelemetry(Actions.SignUpFlowModal),
    traceTelemetry(Actions.SignUpFlowAndRedirectCompleted).start(),
  ])

  const returnUrlSearchParams = new URLSearchParams()
  returnUrlSearchParams.append('mode', 'open-url-reauth')
  if (action) {
    returnUrlSearchParams.append('action', action)
  }
  returnUrlSearchParams.append('token', token)
  if (linkId) {
    returnUrlSearchParams.append('linkId', linkId)
  }

  const returnUrl = `/?`.concat(returnUrlSearchParams.toString())
  const urlWithReturnUrl = new URL(
    getUrlWithReturnUrl(DOCS_SIGNUP, {
      returnUrl: returnUrl,
      context: 'private',
    }),
  )

  // This autofills the sign-up email input
  urlWithReturnUrl.searchParams.append('email', email)
  urlWithReturnUrl.searchParams.append('plan', PLANS.FREE)

  // Save password before going to auth. This way we can load the hash param into the url when we come back from redirection
  saveUrlPasswordForRedirection(urlPassword)

  openUrl(urlWithReturnUrl.toString(), openInNewTab)
}

export const redirectToSignIn = async ({
  action,
  token,
  email,
  linkId,
  urlPassword,
  openInNewTab,
}: {
  action: RedirectAction | undefined
  token: string
  email: string
  linkId: string | undefined
  urlPassword: string
  openInNewTab: boolean
}) => {
  countActionWithTelemetry(Actions.SignInFlowModal)

  const returnUrlSearchParams = new URLSearchParams()
  returnUrlSearchParams.append('mode', 'open-url-reauth')
  if (action) {
    returnUrlSearchParams.append('action', action)
  }
  returnUrlSearchParams.append('token', token)
  if (linkId) {
    returnUrlSearchParams.append('linkId', linkId)
  }

  const returnUrl = `/?`.concat(returnUrlSearchParams.toString())
  const urlWithReturnUrl = new URL(
    getUrlWithReturnUrl(DOCS_SIGNIN, {
      returnUrl: returnUrl,
      context: 'private',
    }),
  )

  // This autofills the sign-in email input
  urlWithReturnUrl.searchParams.append('username', email)

  // Save password before going to auth. This way we can load the hash param into the url when we come back from redirection
  saveUrlPasswordForRedirection(urlPassword)

  openUrl(urlWithReturnUrl.toString(), openInNewTab)
}
