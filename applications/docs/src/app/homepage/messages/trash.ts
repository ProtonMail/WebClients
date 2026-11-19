export const trashMessages = {
  trash: {
    restoreNotAllowed: 'Because this document was in a shared folder, only the folder owner can restore it',
    restoreFailed: 'Failed to restore document',
    restored: 'Document restored from trash',
    trashed: 'Document moved to trash',
    trashFailed: 'Failed to trash document',
    itemsRestored: (numberOfItems: number) =>
      numberOfItems === 1 ? `${numberOfItems} item restored from trash` : `${numberOfItems} items restored from trash`,
    itemsTrashed: (numberOfItems: number) =>
      numberOfItems === 1 ? `${numberOfItems} item moved to trash` : `${numberOfItems} items moved to trash`,
    itemsNotTrashed: (count: number) =>
      count === 1 ? `${count} item could not be moved to trash` : `${count} items could not be moved to trash`,
    undo: 'Undo',
  },
}
