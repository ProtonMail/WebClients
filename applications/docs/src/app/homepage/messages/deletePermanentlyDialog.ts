import { c } from 'ttag'

// `confirm` names its parameter `itemName`, as Drive's identical string does (applications/drive's
// useTrashNotifications.ts), so the string keeps its existing translations.
export function createDeletePermanentlyDialogMessages() {
  return {
    deletePermanentlyDialog: {
      title: c('Title').t`Delete permanently`,
      close: c('Action').t`Close`,
      confirm: (itemName: string) => c('Info').t`Are you sure you want to permanently delete "${itemName}" from trash?`,
      cannotUndo: c('Info').t`You cannot undo this action.`,
      cancel: c('Action').t`Cancel`,
      deletePermanently: c('Action').t`Delete permanently`,
    },
  }
}
