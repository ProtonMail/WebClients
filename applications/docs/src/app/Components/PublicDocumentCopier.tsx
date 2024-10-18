import { useEffect, useCallback } from 'react'
import { useApplication } from '../Containers/ApplicationProvider'
import { PostApplicationError } from '@proton/docs-core'
import { c } from 'ttag'
import { CircleLoader } from '@proton/atoms/index'
import type { PublicDocumentPostMessageDataForCopying } from './PublicDocumentPostMessageEvents'
import { PublicDocumentPostMessageEvent } from './PublicDocumentPostMessageEvents'
import { APPS } from '@proton/shared/lib/constants'
import { getAppHref } from '@proton/shared/lib/apps/helper'

/**
 * A processing component that duplicates a document received from the tab opener. Once duplication completes,
 * the window will reroute to the new document.
 */
export function PublicDocumentCopier() {
  const application = useApplication()

  const performCopy = useCallback(
    async (name: string, yjsData: Uint8Array) => {
      const duplicateDocument = application.duplicateDocumentUseCase
      const result = await duplicateDocument.executePublic(name, yjsData)

      if (result.isFailed()) {
        PostApplicationError(application.eventBus, {
          translatedError: c('Error')
            .t`An error occurred while attempting to duplicate the document. Please try again.`,
        })
      } else {
        const shell = result.getValue()
        void application.compatWrapper.userCompat?.openDocumentWindow({
          ...shell,
          mode: 'open',
          window: window,
        })
      }
    },
    [application],
  )

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.data.type === PublicDocumentPostMessageEvent.DataForCopying) {
        const { name, yjsData } = event.data.doc as PublicDocumentPostMessageDataForCopying
        void performCopy(name, yjsData)
      }
    },
    [performCopy],
  )

  useEffect(() => {
    window.opener.postMessage({ type: PublicDocumentPostMessageEvent.CopierReady }, getAppHref('/', APPS.PROTONDOCS))

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [handleMessage])

  return (
    <div className="bg-norm flex-column absolute left-0 top-0 flex h-full w-full items-center justify-center gap-4">
      <CircleLoader size="large" />
      <div className="text-center">{c('Info').t`Making a copy...`}</div>
    </div>
  )
}
