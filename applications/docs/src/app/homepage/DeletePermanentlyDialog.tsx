// Like drive/docs/realtime's packages/docs-editor/src/Plugins/Comments/DeleteCommentDialog.tsx, with the look of
// Proton's ConfirmActionModal: its large size, close button, backdrop and buttons at both ends of the footer.

import * as Ariakit from '@ariakit/react'
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig'
import { type FormEvent, useState } from 'react'
import { c } from 'ttag'
import { Button, IconButton } from './components/ui'

export type DeletePermanentlyDialogProps = {
  documentName: string
  onDelete: () => Promise<void>
  onClose: () => void
}

export function DeletePermanentlyDialog({ documentName, onDelete, onClose }: DeletePermanentlyDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  // drive-store has the same string with `itemName`, and one string can't have two variable names.
  const itemName = documentName

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsDeleting(true)
    try {
      await onDelete()
    } finally {
      onClose()
    }
  }

  return (
    <Ariakit.Dialog
      open
      onClose={onClose}
      hideOnEscape={!isDeleting}
      hideOnInteractOutside={false}
      unmountOnHide
      render={<form onSubmit={onSubmit} />}
      // z-[900] is Proton's modal layer, above its header and sidebar.
      backdrop={<div className="z-[900] bg-[--backdrop-norm]" />}
      className="fixed inset-0 z-[900] m-auto h-fit max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-[37.5rem] overflow-auto rounded-[--border-radius-lg] bg-[--modal-background-color] px-8 text-[--modal-text-color] shadow-[--shadow-lifted] outline-none"
    >
      <div className="mb-2 mt-8 flex items-start justify-between gap-2">
        <Ariakit.DialogHeading className="mt-1 text-[calc(24em/14)] font-bold">
          {c('Title').t`Delete permanently`}
        </Ariakit.DialogHeading>
        <Ariakit.DialogDismiss
          // Proton's modal focuses its first button.
          autoFocus
          disabled={isDeleting}
          render={
            <IconButton
              shape="ghost"
              label={c('Action').t`Close`}
              className="-mr-[calc(10em/14)] -mt-[calc(9.5em/14)]"
            />
          }
        >
          <IcCrossBig />
        </Ariakit.DialogDismiss>
      </div>
      <Ariakit.DialogDescription className="mb-4 mt-2">
        {c('Info').t`Are you sure you want to permanently delete "${itemName}" from trash?`}
        <br />
        {c('Info').t`You cannot undo this action.`}
      </Ariakit.DialogDescription>
      <div className="mb-6 mt-4 flex justify-between gap-2">
        <Ariakit.DialogDismiss disabled={isDeleting} render={<Button />}>
          {c('Action').t`Cancel`}
        </Ariakit.DialogDismiss>
        <Button
          type="submit"
          loading={isDeleting}
          className="bg-[--signal-danger] text-[--signal-danger-contrast] hover:bg-[--signal-danger-major-1] active:bg-[--signal-danger-major-2]"
        >
          {c('Action').t`Delete permanently`}
        </Button>
      </div>
    </Ariakit.Dialog>
  )
}
