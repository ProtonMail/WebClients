import type { DocControllerInterface } from 'packages/docs-core'
import { c } from 'ttag'

import { Button } from '@proton/atoms/Button'
import { CircleLoader } from '@proton/atoms/CircleLoader'
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components/components'
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import type { DocTrashState } from 'packages/docs-shared'

type TrashedDocumentModalProps = {
  controller: DocControllerInterface
  trashedState?: DocTrashState
  documentTitle: string
  onOpenProtonDrive: () => void
}

export function TrashedDocumentModal({
  trashedState,
  documentTitle,
  onOpenProtonDrive,
  controller,
}: TrashedDocumentModalProps) {
  return (
    <ModalTwo className="!rounded-t-xl" open={trashedState === 'trashed'}>
      <ModalTwoHeader title="Document moved to trash" hasClose={false} />
      <ModalTwoContent>{c('Info')
        .t`"${documentTitle}" will stay in trash until you delete it permanently.`}</ModalTwoContent>
      <ModalTwoFooter>
        {controller && controller.role.isAdmin() && (
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
              {c('Action').t`Open ${DRIVE_APP_NAME}`}
            </Button>
          </>
        )}
      </ModalTwoFooter>
    </ModalTwo>
  )
}
