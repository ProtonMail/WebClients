import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'

/**
 * SDK parses token from the last path segment and url password from the hash.
 * Unlike legacy, an empty url password makes the SDK fail, so the error page is shown.
 */
export function getPublicLinkUrl(token: string, urlPassword: string) {
  return `${getAppHref(`/urls/${token}`, APPS.PROTONDRIVE)}#${urlPassword}`
}
