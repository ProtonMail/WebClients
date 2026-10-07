import { useAuthentication } from '@proton/components'
import type { NodeMeta, DocumentType } from '../BasicTypes'
import { getNewWindow } from '@proton/shared/lib/helpers/window'
import { useCallback } from 'react'
import type { DocumentAction } from '../DocumentAction'
import { getDocumentActionUrl } from '../URL/getDocumentActionUrl'

export const useDocumentWindowAction = () => {
  const { getLocalID } = useAuthentication()

  const documentWindowAction = useCallback(
    (action: DocumentAction & { window: Window }) => {
      action.window.location.assign(getDocumentActionUrl(action, getLocalID()))
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
