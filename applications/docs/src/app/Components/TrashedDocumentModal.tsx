import type { DocControllerInterface } from 'packages/docs-core'
import { c } from 'ttag'

import { Button } from '@proton/atoms'
import { CircleLoader } from '@proton/atoms/CircleLoader'
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components'
import { DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants'
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
  const { didTrashDocInCurrentSession } = controller

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
        {controller && controller.role.isAdmin() && (
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
                  {c('Action').t`Go to ${DRIVE_SHORT_APP_NAME}`}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={onOpenProtonDrive}>{c('Action').t`Go to ${DRIVE_SHORT_APP_NAME}`}</Button>
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
