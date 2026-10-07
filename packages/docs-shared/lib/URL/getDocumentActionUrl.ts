import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import type { DocumentAction } from '../DocumentAction'
import { tmpConvertNewDocTypeToOld } from '../Doc/convert-doc-type'

export function getDocumentActionUrl(action: DocumentAction, localID: number | undefined): URL {
  const { type: originalType, mode } = action
  const type = tmpConvertNewDocTypeToOld(originalType)

  const href = getAppHref(`/${type}`, APPS.PROTONDOCS, localID)
  const url = new URL(href)

  url.searchParams.append('mode', mode)

  if ('volumeId' in action && action.volumeId) {
    url.searchParams.append('volumeId', action.volumeId)
  } else if ('token' in action && action.token) {
    url.searchParams.append('token', action.token)
  }

  if ('linkId' in action && action.linkId) {
    url.searchParams.append('linkId', action.linkId)
  } else if ('parentLinkId' in action && action.parentLinkId) {
    url.searchParams.append('parentLinkId', action.parentLinkId)
  }

  if ('urlPassword' in action && action.urlPassword) {
    url.hash = action.urlPassword
  }

  return url
}
