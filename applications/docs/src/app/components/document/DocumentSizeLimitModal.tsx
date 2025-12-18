import { ModalTwo, ModalTwoHeader, ModalTwoContent, ModalTwoFooter, useNotifications } from '@proton/components'
import { useEffect, useState } from 'react'
import { useApplication } from '~/utils/application-context'
import type {
  AuthenticatedDocControllerInterface,
  DocumentState,
  EditorControllerInterface,
  PublicDocumentState,
} from '@proton/docs-core'
import { DocSizeTrackerEvent, type DocSizeTrackerEventPayload } from '@proton/docs-core'
import { c } from 'ttag'
import { Button } from '@proton/atoms/Button/Button'
import noop from '@proton/utils/noop'
import type { DocumentType } from '@proton/drive-store/store/_documents'
import useLoading from '@proton/hooks/useLoading'

export function DocumentSizeLimitModal({ documentType }: { documentType: DocumentType }) {
  const application = useApplication()

  const [docState, setDocState] = useState<DocumentState | PublicDocumentState | null>(null)
  const [editorController, setEditorController] = useState<EditorControllerInterface | null>(null)
  const [docController, setDocController] = useState<AuthenticatedDocControllerInterface | null>(null)
  useEffect(
    () =>
      application.getDocLoader().addStatusObserver({
        onSuccess: (result) => {
          setEditorController(result.editorController)
          setDocState(result.documentState)
          setDocController(result.docController || null)
        },
        onError: noop,
      }),
    [application],
  )

  const [isOpen, setIsOpen] = useState(false)

  const [event, setEvent] = useState<DocSizeTrackerEventPayload | null>(null)
  useEffect(() => {
    return application.eventBus.addEventCallback((event: DocSizeTrackerEventPayload) => {
      setEvent(event)
      setIsOpen(true)
    }, DocSizeTrackerEvent)
  }, [application.eventBus])

  const [isRemovingRevisions, withRemovingRevisions] = useLoading()
  const { createNotification } = useNotifications()

  if (!docState?.getProperty('userRole').canEdit()) {
    return null
  }

  if (event === null) {
    return null
  }

  const removeOlderRevisions = () => {
    if (!docController) {
      return
    }
    const onFail = () => {
      createNotification({
        type: 'error',
        text: c('Error').t`Failed to remove older revisions`,
      })
    }
    void withRemovingRevisions(
      docController
        .squashEverythingInBaseCommit()
        .then((result) => {
          if (result.isFailed()) {
            onFail()
            return
          }
          window.location.reload()
        })
        .catch(onFail),
    )
  }

  return (
    <ModalTwo className="!rounded-t-xl" open={isOpen}>
      <ModalTwoHeader
        title={
          event.exceededMaxSize ? c('Title').t`Document Size Limit Exceeded` : c('Title').t`Document Size Limit Reached`
        }
        hasClose={false}
      />
      <ModalTwoContent>
        {event.exceededMaxSize
          ? c('Info')
              .t`This document has grown too large, and your latest changes couldn’t be saved. Download a copy to keep your work.`
          : c('Info').t`This document has grown too large to edit. You can remove older revisions to continue editing.`}
      </ModalTwoContent>
      <ModalTwoFooter>
        {editorController && (
          <>
            {!event.exceededMaxSize &&
              !application.isPublicMode &&
              docController &&
              docState.getProperty('baseCommit') && (
                <>
                  <Button color="norm" loading={isRemovingRevisions} onClick={removeOlderRevisions}>{c('Action')
                    .t`Delete older revisions`}</Button>
                </>
              )}
            {event.exceededMaxSize && (
              <Button
                color="norm"
                onClick={() => editorController.exportAndDownload(documentType === 'sheet' ? 'xlsx' : 'docx')}
              >
                {documentType === 'sheet'
                  ? c('Action').t`Download a copy (as xlsx)`
                  : c('Action').t`Download a copy (as docx)`}
              </Button>
            )}
          </>
        )}
        <Button disabled={isRemovingRevisions} onClick={() => setIsOpen(false)}>
          {!event.exceededMaxSize ? c('Action').t`View only` : c('Action').t`Okay`}
        </Button>
      </ModalTwoFooter>
    </ModalTwo>
  )
}
