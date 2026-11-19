import { c } from 'ttag'

// Parameter names are part of the existing msgids, which translations match. So is the stray quote in `deleted`.
export function createDocumentActionsMessages() {
  return {
    documentActions: {
      renamed: (newName: string) => c('Notification').t`"${newName}" renamed successfully`,
      trashFailed: c('Error').t`Failed to trash document`,
      deleteFailed: c('Notification').t`Failed to delete document`,
      deleted: c('Notification').t`"Document deleted permanently`,
    },
  }
}
