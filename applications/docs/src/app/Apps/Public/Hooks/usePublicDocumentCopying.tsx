import { useOpenDocument } from '@proton/drive-store/store/_documents'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { getNewWindow } from '@proton/shared/lib/helpers/window'
import { useCallback } from 'react'
import type { PublicContextType } from '../../../Containers/DocsContextProvider'
import {
  type PublicDocumentPostMessageDataForCopying,
  PublicDocumentPostMessageEvent,
} from './PublicDocumentPostMessageEvents'
import type { EditorControllerInterface } from '@proton/docs-core'
import type { PublicDocumentState } from '@proton/docs-core'

export const usePublicDocumentCopying = ({
  context,
  editorController,
  documentState,
}: {
  context: PublicContextType
  editorController: EditorControllerInterface
  documentState: PublicDocumentState
}) => {
  const { openDocumentWindow } = useOpenDocument()
  const { user } = context

  const handleCopierReady = useCallback(
    async (childWindow: Window) => {
      const editorData = await editorController.exportData('yjs')
      const messageData: PublicDocumentPostMessageDataForCopying = {
        yjsData: editorData,
        name: documentState.getProperty('documentName'),
      }
      childWindow.postMessage(
        {
          type: PublicDocumentPostMessageEvent.DataForCopying,
          doc: messageData,
        },
        getAppHref('/', APPS.PROTONDOCS),
      )
    },
    [editorController, documentState],
  )

  const handleCopierMessage = useCallback(
    async (event: MessageEvent) => {
      if (event.data.type === PublicDocumentPostMessageEvent.CopierReady) {
        await handleCopierReady(event.source as Window)

        window.removeEventListener('message', handleCopierMessage)
      }
    },
    [handleCopierReady],
  )

  const createCopy = () => {
    if (!user) {
      throw new Error('Attempted to create a copy without a user')
    }

    const w = getNewWindow()
    window.addEventListener('message', handleCopierMessage)

    openDocumentWindow({
      mode: 'copy-public',
      window: w.handle,
    })
  }

  return { createCopy }
}
