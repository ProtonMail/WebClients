import { c } from 'ttag'

export function createContentMessages() {
  return {
    content: {
      emptyRecents: c('Info').t`Create end-to-end encrypted documents and spreadsheets.`,
      emptyTrash: c('Info').t`There are no documents in the trash.`,
      emptySearch: c('Info').t`No recent documents match your search.`,
      newBadge: c('Info').t`New`,
    },
  }
}
