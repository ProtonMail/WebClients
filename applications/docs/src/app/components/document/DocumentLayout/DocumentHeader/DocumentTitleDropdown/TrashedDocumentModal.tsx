import type { AuthenticatedDocControllerInterface, DocumentState } from '@proton/docs-core'
import { c } from 'ttag'

import { Button, CircleLoader } from '@proton/atoms'
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components'
import { DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants'
import { goToPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag'

export type TrashedDocumentModalProps = {
  controller: AuthenticatedDocControllerInterface
  documentState: DocumentState
  documentTitle: string
  onOpenProtonDrive: () => void
}

export function TrashedDocumentModal({
  documentState,
  documentTitle,
  onOpenProtonDrive,
  controller,
}: TrashedDocumentModalProps) {
  const { didTrashDocInCurrentSession } = controller
  const trashedState = documentState.getProperty('documentTrashState')

  return (
    <ModalTwo className="!rounded-t-xl" open={trashedState === 'trashed'}>
      <ModalTwoHeader
        title={didTrashDocInCurrentSession ? c('Info').t`Document moved to trash` : c('Info').t`Document is in trash`}
        hasClose={false}
      />
      <ModalTwoContent>
        {didTrashDocInCurrentSession
          ? c('Info')
              .t`"${documentTitle}" has been moved to the trash. It will stay there until you restore it or delete it permanently.`
          : c('Info').t`"${documentTitle}" is in trash and will stay there until you delete it permanently.`}
      </ModalTwoContent>
      <ModalTwoFooter>
        {documentState.getProperty('userRole').canTrash() && (
          <>
            {didTrashDocInCurrentSession ? (
              <>
                <Button
                  onClick={() => {
                    void controller.restoreDocument()
                  }}
                  className="flex items-center"
                >
                  {c('Action').t`Undo`}
                  {trashedState === 'restoring' && <CircleLoader size="small" className="ml-2" />}
                </Button>
                <Button color="norm" onClick={onOpenProtonDrive}>
                  {goToPlanOrAppNameText(DRIVE_SHORT_APP_NAME)}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={onOpenProtonDrive}>{goToPlanOrAppNameText(DRIVE_SHORT_APP_NAME)}</Button>
                <Button
                  color="norm"
                  onClick={() => {
                    void controller.restoreDocument()
                  }}
                  className="flex items-center"
                >
                  {c('Action').t`Take out of trash`}
                  {trashedState === 'restoring' && <CircleLoader size="small" className="ml-2" />}
                </Button>
              </>
            )}
          </>
        )}
      </ModalTwoFooter>
    </ModalTwo>
  )
}
