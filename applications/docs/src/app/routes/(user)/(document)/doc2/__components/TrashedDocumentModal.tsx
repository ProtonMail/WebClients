import { Button } from '@proton/atoms/Button/Button'
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader'
import ModalTwo from '@proton/components/components/modalTwo/Modal'
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent'
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter'
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader'
import { DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants'
import { goToPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag'
import { c } from 'ttag'

import type { TrashState } from '../__utils/useDocumentFileActions'

export type TrashedDocumentModalProps = {
  documentTitle: string
  trashState: TrashState
  /** Trashed here, which offers Undo, rather than elsewhere or before opening, which offers Take out of trash */
  trashedInSession: boolean
  /** Admin only. Everyone can go to Drive: unlike /doc, which leaves non-Admins no button, so no way out */
  canRestore: boolean
  onRestore: () => void
  onGoToDrive: () => void
}

/**
 * Copied from
 * `applications/docs/src/app/components/document/DocumentLayout/DocumentHeader/DocumentTitleDropdown/TrashedDocumentModal.tsx`,
 * which takes docs-core types: the blocking modal over a trashed document. It stays open while restoring, with the
 * restore button disabled.
 */
export function TrashedDocumentModal({
  documentTitle,
  trashState,
  trashedInSession,
  canRestore,
  onRestore,
  onGoToDrive,
}: TrashedDocumentModalProps) {
  const restoring = trashState === 'restoring'
  const restoreLoader = restoring && <CircleLoader size="small" className="ml-2" />

  return (
    <ModalTwo
      className="!rounded-t-xl"
      open={trashState === 'trashed' || restoring}
      data-testid="trashed-document-modal"
    >
      <ModalTwoHeader
        title={trashedInSession ? c('Info').t`Document moved to trash` : c('Info').t`Document is in trash`}
        hasClose={false}
      />
      <ModalTwoContent>
        {trashedInSession
          ? c('Info')
              .t`"${documentTitle}" has been moved to the trash. It will stay there until you restore it or delete it permanently.`
          : c('Info').t`"${documentTitle}" is in trash and will stay there until you delete it permanently.`}
      </ModalTwoContent>
      <ModalTwoFooter>
        {!canRestore && <Button onClick={onGoToDrive}>{goToPlanOrAppNameText(DRIVE_SHORT_APP_NAME)}</Button>}
        {canRestore &&
          (trashedInSession ? (
            <>
              <Button onClick={onRestore} disabled={restoring} className="flex items-center">
                {c('Action').t`Undo`}
                {restoreLoader}
              </Button>
              <Button color="norm" onClick={onGoToDrive}>
                {goToPlanOrAppNameText(DRIVE_SHORT_APP_NAME)}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={onGoToDrive}>{goToPlanOrAppNameText(DRIVE_SHORT_APP_NAME)}</Button>
              <Button color="norm" onClick={onRestore} disabled={restoring} className="flex items-center">
                {c('Action').t`Take out of trash`}
                {restoreLoader}
              </Button>
            </>
          ))}
      </ModalTwoFooter>
    </ModalTwo>
  )
}
