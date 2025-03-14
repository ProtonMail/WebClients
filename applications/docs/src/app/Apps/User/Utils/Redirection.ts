import { getAppHref } from '@proton/shared/lib/apps/helper'
import { getParsedPathWithoutLocalIDBasename } from '@proton/shared/lib/authentication/pathnameHelper'
import { SSO_PATHS, APPS } from '@proton/shared/lib/constants'
import { replaceUrl } from '@proton/shared/lib/helpers/browser'
import { getPathFromLocation, getUrlWithReturnUrl } from '@proton/shared/lib/helpers/url'

export function redirectToAccountSwitcherFromUserApp() {
  const accountSwitchUrl = new URL(getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT))
  accountSwitchUrl.searchParams.append('product', 'docs')

  const returnUrl = `/${getParsedPathWithoutLocalIDBasename(getPathFromLocation(window.location))}`
  const urlWithReturnUrl = getUrlWithReturnUrl(accountSwitchUrl.toString(), {
    returnUrl: returnUrl,
    context: 'private',
  })

  replaceUrl(urlWithReturnUrl)
}
