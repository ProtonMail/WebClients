import ModalTwo from '@proton/components/components/modalTwo/Modal'
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent'
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter'
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader'
import useNotifications from '@proton/components/hooks/useNotifications'
import type { AuthenticatedDocControllerInterface, DocumentState } from '@proton/docs-core'
import { c } from 'ttag'

import { Button } from '@proton/atoms/Button/Button'
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader'
import { DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants'
import { goToPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag'
import { useTrashWithSDK } from '~/utils/flags'
import { generateNodeUid, getDrive } from '@proton/drive'
import type { NodeMeta } from '@proton/drive-store/lib/NodeMeta'
import { handleRestoreError, restoreDocument } from '~/drive-sdk/trash'
import { useEvent } from '~/utils/misc'

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
  const { createNotification } = useNotifications()
  const { didTrashDocInCurrentSession } = controller
  const trashedState = documentState.getProperty('documentTrashState')
  const trashWithSDK = useTrashWithSDK()

  const restore = useEvent(() => {
    if (trashWithSDK) {
      const drive = getDrive()
      const { volumeId, linkId } = documentState.getProperty('entitlements').nodeMeta as NodeMeta

      restoreDocument(drive, generateNodeUid(volumeId, linkId))
        .then(() => {
          controller.markAsRestored()
        })
        .catch((error) => {
          handleRestoreError(createNotification, error)
        })
    } else {
      void controller.restoreDocument()
    }
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
      </ModalTwoContent>
      <ModalTwoFooter>
        {documentState.getProperty('userRole').canTrash() && (
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
