import { useAuthentication } from '@proton/components'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import type { ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import type { NodeMeta, DocumentType } from '../BasicTypes'
import { getNewWindow } from '@proton/shared/lib/helpers/window'
import { useCallback } from 'react'
import type { DocumentAction } from '../DocumentAction'

// TODO: we will rename the values in `DocumentType` to 'document' and 'spreadsheet' soon, but for now
// we just convert the new names to the old ones to support both naming patterns to keep changes small.
export function tmpConvertNewDocTypeToOld(type: DocumentType | ProtonDocumentType): DocumentType {
  switch (type) {
    case 'document':
      return 'doc'
    case 'spreadsheet':
      return 'sheet'
    default:
      return type
  }
}

export const useDocumentWindowAction = () => {
  const { getLocalID } = useAuthentication()

  const documentWindowAction = useCallback(
    (action: DocumentAction & { window: Window }) => {
      const { type: originalType, mode, window } = action
      const type = tmpConvertNewDocTypeToOld(originalType)

      const href = getAppHref(`/${type}`, APPS.PROTONDOCS, getLocalID())
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

      window.location.assign(url)
    },
    [getLocalID],
  )

  return documentWindowAction
}

export function useOpenDocument() {
  const documentWindowAction = useDocumentWindowAction()

  const openDocument = useCallback(
    (meta: NodeMeta, type: DocumentType = 'doc') =>
      documentWindowAction({ ...meta, type, mode: 'open', window: getNewWindow().handle }),
    [documentWindowAction],
  )

  return openDocument
}
