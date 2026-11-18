import ModalTwo from '@proton/components/components/modalTwo/Modal'
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent'
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter'
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader'
import type { AuthenticatedDocControllerInterface } from '@proton/docs-core/AuthenticatedDocController/AuthenticatedDocControllerInterface'
import type { DocumentState } from '@proton/docs-core/State/DocumentState'
import { c } from 'ttag'

import { Button } from '@proton/atoms/Button/Button'
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader'
import { DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants'
import { goToPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag'

import { useEvent } from '~/utils/misc'

export type TrashedDocumentModalProps = {
  controller: AuthenticatedDocControllerInterface
  documentState: DocumentState
  documentTitle: string
  onOpenProtonDrive: () => void
  /** Only the owner restores; anyone else gets only Go to Drive, since the modal can't be closed */
  canRestore: boolean
  /** Set when Drive couldn't say whether the user may restore, so the modal says so and offers to ask again */
  onRetryRestoreCheck?: () => void
}

export function TrashedDocumentModal({
  documentState,
  documentTitle,
  onOpenProtonDrive,
  controller,
  canRestore,
  onRetryRestoreCheck,
}: TrashedDocumentModalProps) {
  const { didTrashDocInCurrentSession } = controller
  const trashedState = documentState.getProperty('documentTrashState')

  const restore = useEvent(() => {
    void controller.restoreDocument()
  })

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
        {onRetryRestoreCheck && (
          <p className="mb-0 mt-4">{c('Error').t`We couldn't check whether you can take it out of trash.`}</p>
        )}
      </ModalTwoContent>
      <ModalTwoFooter>
        {!canRestore && <Button onClick={onOpenProtonDrive}>{goToPlanOrAppNameText(DRIVE_SHORT_APP_NAME)}</Button>}
        {!canRestore && onRetryRestoreCheck && (
          <Button color="norm" onClick={onRetryRestoreCheck}>{c('Action').t`Try again`}</Button>
        )}
        {canRestore && (
          <>
            {didTrashDocInCurrentSession ? (
              <>
                <Button onClick={restore} className="flex items-center">
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
                <Button color="norm" onClick={restore} className="flex items-center">
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
