import { c, msgid } from 'ttag'

// Parameter names are part of the existing msgids, which translations match.
export function createTrashMessages() {
  return {
    trash: {
      restoreNotAllowed: c('Notification')
        .t`Because this document was in a shared folder, only the folder owner can restore it`,
      restoreFailed: c('Notification').t`Failed to restore document`,
      restored: c('Notification').t`Document restored from trash`,
      trashed: c('Notification').t`Document moved to trash`,
      trashFailed: c('Notification').t`Failed to trash document`,
      itemsRestored: (numberOfItems: number) =>
        c('Notification').ngettext(
          msgid`${numberOfItems} item restored from trash`,
          `${numberOfItems} items restored from trash`,
          numberOfItems,
        ),
      itemsTrashed: (numberOfItems: number) =>
        c('Notification').ngettext(
          msgid`${numberOfItems} item moved to trash`,
          `${numberOfItems} items moved to trash`,
          numberOfItems,
        ),
      itemsNotTrashed: (count: number) =>
        c('Notification').ngettext(
          msgid`${count} item could not be moved to trash`,
          `${count} items could not be moved to trash`,
          count,
        ),
      undo: c('Action').t`Undo`,
    },
  }
}
