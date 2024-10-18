import { Icon } from '@proton/components'
import { useCallback } from 'react'
import { Button } from '@proton/atoms'
import { c } from 'ttag'
import type { AnyDocControllerInterface } from '@proton/docs-core/lib/Controller/Document/AnyDocControllerInterface'
import type { PublicContextType } from '../../Containers/ContextProvider'
import { useDocsBookmarks } from '@proton/drive-store/lib/_views/useDocsBookmarks'
import { SaveToDriveButton } from './SaveToDriveButton'
import { useOpenDocument } from '@proton/drive-store/store/_documents'
import { getNewWindow } from '@proton/shared/lib/helpers/window'
import type { PublicDocumentPostMessageDataForCopying } from '../PublicDocumentPostMessageEvents'
import { PublicDocumentPostMessageEvent } from '../PublicDocumentPostMessageEvents'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'

export const HeaderPublicOptions = ({
  context,
  controller,
}: {
  context: PublicContextType
  controller: AnyDocControllerInterface
}) => {
  const { customPassword, token, urlPassword } = context.compat
  const { addBookmark, isAlreadyBookmarked, isLoading } = useDocsBookmarks({ token, urlPassword, customPassword })
  const { openDocumentWindow } = useOpenDocument()
  const { user } = context

  const saveForLater = useCallback(async () => {
    void addBookmark()
  }, [addBookmark])

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
    if (user) {
      const w = getNewWindow()

      window.addEventListener('message', handleCopierMessage)

      openDocumentWindow({
        mode: 'copy-public',
        window: w.handle,
      })
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!isLoading && (
        <SaveToDriveButton
          alreadyBookmarked={isAlreadyBookmarked}
          onClick={saveForLater}
          customPassword={customPassword}
          loading={isLoading}
        />
      )}

      {user && (
        <Button
          color={context.user ? 'weak' : 'norm'}
          size="small"
          className="flex items-center gap-2 text-sm"
          data-testid="make-a-copy-button"
          onClick={createCopy}
        >
          <Icon name="user-plus" />
          {c('Action').t`Create a copy`}
        </Button>
      )}
    </div>
  )
}
