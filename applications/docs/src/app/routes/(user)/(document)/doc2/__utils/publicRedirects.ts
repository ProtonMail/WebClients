import type { RedirectAction } from '@proton/docs-shared/DocumentAction'
import { RedirectionReason, drivePublicRedirectionReasonKey } from '@proton/docs-shared/URL/publicRedirectionReason'
import { saveUrlPasswordForRedirection } from '@proton/docs-shared/URL/saveUrlPasswordForRedirection'
import { PLANS } from '@proton/payments/core/constants'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper'
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants'
import { DOCS_SIGNIN, DOCS_SIGNUP } from '../../../../../utils/urls'
import { replaceUrl } from '@proton/shared/lib/helpers/browser'
import { getUrlWithReturnUrl } from '@proton/shared/lib/helpers/url'
import { getCurrentTab, getNewWindow } from '@proton/shared/lib/helpers/window'

import { Actions, countActionWithTelemetry, traceTelemetry } from '~/components/document/public/telemetry'

// Adapted from `applications/docs/src/app/components/document/public/utils.ts`, its account switcher, sign-up and
// sign-in redirects, without the copy handover, whose file imports docs-core's types. Each returns to the public page's
// own path, `/doc2` on doc2's public page, through the user app's `open-url-reauth`.

function openUrl(url: string, openInNewTab: boolean) {
  const tab = openInNewTab ? getNewWindow() : getCurrentTab()
  tab.handle.location.assign(url)
}

export function redirectToAccountSwitcher(token: string, linkId: string | undefined, urlPassword: string) {
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
  const returnUrl = getReturnUrl(returnUrlSearchParams)
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

export async function redirectToSignUp({
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
}) {
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

  const returnUrl = getReturnUrl(returnUrlSearchParams)
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

export async function redirectToSignIn({
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
}) {
  void countActionWithTelemetry(Actions.SignInFlowModal)

  const returnUrlSearchParams = new URLSearchParams()
  returnUrlSearchParams.append('mode', 'open-url-reauth')
  if (action) {
    returnUrlSearchParams.append('action', action)
  }
  returnUrlSearchParams.append('token', token)
  if (linkId) {
    returnUrlSearchParams.append('linkId', linkId)
  }

  const returnUrl = getReturnUrl(returnUrlSearchParams)
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

/**
 * Keeps the page's path, `/doc2` on doc2's public page, so the user app sends the visitor back to doc2. The local id
 * prefix goes, since the user app adds its own.
 */
function getReturnUrl(searchParams: URLSearchParams) {
  return `${stripLocalBasenameFromPathname(window.location.pathname)}?${searchParams.toString()}`
}
