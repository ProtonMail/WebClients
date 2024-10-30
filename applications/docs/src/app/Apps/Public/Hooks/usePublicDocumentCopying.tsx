import { useOpenDocument } from '@proton/drive-store/store/_documents'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { getNewWindow } from '@proton/shared/lib/helpers/window'
import type { AnyDocControllerInterface } from 'packages/docs-core/lib/Controller/Document/AnyDocControllerInterface'
import { useCallback } from 'react'
import type { PublicContextType } from '../../../Containers/ContextProvider'
import {
  type PublicDocumentPostMessageDataForCopying,
  PublicDocumentPostMessageEvent,
} from './PublicDocumentPostMessageEvents'

export const usePublicDocumentCopying = ({
  context,
  controller,
}: {
  context: PublicContextType
  controller: AnyDocControllerInterface
}) => {
  const { openDocumentWindow } = useOpenDocument()
  const { user } = context

  const handleCopierReady = useCallback(
    async (childWindow: Window) => {
      const editorData = await controller.exportData('yjs')
      const messageData: PublicDocumentPostMessageDataForCopying = {
        yjsData: editorData,
        name: controller.getSureDocument().name,
      }
      childWindow.postMessage(
        {
          type: PublicDocumentPostMessageEvent.DataForCopying,
          doc: messageData,
        },
        getAppHref('/', APPS.PROTONDOCS),
      )
    },
    [controller],
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
