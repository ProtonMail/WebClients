import * as Ariakit from '@ariakit/react'
import type { FormEventHandler, RefObject } from 'react'
import { useState } from 'react'
import { Button } from '../../Components/ui'
import { useDocsDependencies, useDocsMessages } from '../../DocsDependenciesProvider'

export type DeleteCommentDialogOptions = {
  title: string
  message: string
  onDelete: () => Promise<unknown>
  /** The control that opened the dialog. A menu item unmounts with its menu, so pass the menu's button. */
  finalFocus: RefObject<HTMLElement>
}

export interface DeleteCommentDialogProps extends DeleteCommentDialogOptions {
  onClose: () => void
}

export function DeleteCommentDialog({ title, message, onDelete, finalFocus, onClose }: DeleteCommentDialogProps) {
  const { reportError } = useDocsDependencies()
  const messages = useDocsMessages().comments
  const [isDeleting, setIsDeleting] = useState(false)

  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    if (isDeleting) {
      return
    }
    setIsDeleting(true)
    try {
      await onDelete()
    } catch (error) {
      reportError(error)
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
      finalFocus={finalFocus}
      unmountOnHide
      aria-busy={isDeleting}
      render={<form onSubmit={onSubmit} />}
      // A backdrop can't cover the Docs header, which is outside the editor iframe.
      backdrop={false}
      className="fixed inset-0 z-50 m-auto h-fit w-[calc(100%-2rem)] max-w-[37.5rem] rounded-[--border-radius-lg] border border-[--border-weak] bg-[--background-norm] p-6 text-[--text-norm] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.16)] outline-none"
    >
      <Ariakit.DialogHeading className="mb-4 text-xl font-bold">{title}</Ariakit.DialogHeading>
      <Ariakit.DialogDescription className="mb-6">
        {message} {messages.cannotUndo}
      </Ariakit.DialogDescription>
      <div className="flex items-center justify-end gap-2">
        <Ariakit.DialogDismiss
          autoFocus
          disabled={isDeleting}
          accessibleWhenDisabled
          render={<Button className="aria-disabled:opacity-50" />}
        >
          {messages.cancel}
        </Ariakit.DialogDismiss>
        <Button
          type="submit"
          disabled={isDeleting}
          accessibleWhenDisabled
          className="!bg-[--signal-danger] text-[--signal-danger-contrast] hover:!bg-[--signal-danger-major-1] active:!bg-[--signal-danger-major-2] aria-disabled:opacity-50"
        >
          {messages.delete}
        </Button>
      </div>
    </Ariakit.Dialog>
  )
}
