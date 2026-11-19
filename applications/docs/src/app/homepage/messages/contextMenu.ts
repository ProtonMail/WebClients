import { c } from 'ttag'

export function createContextMenuMessages() {
  return {
    contextMenu: {
      open: c('Action').t`Open`,
      openFolder: c('Action').t`Open folder`,
      share: c('Action').t`Share`,
      rename: c('Action').t`Rename`,
      move: c('Action').t`Move`,
      moveToTrash: c('Action').t`Move to trash`,
      trashing: c('Action').t`Trashing...`,
      restoreFromTrash: c('Action').t`Restore from trash`,
      restoring: c('Action').t`Restoring...`,
      deletePermanently: c('Action').t`Delete permanently`,
    },
  }
}
