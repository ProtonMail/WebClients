import { c, msgid } from 'ttag'

import type { HomepageMessages } from '~/homepage'

// Parameter names and the expressions in the strings are part of the existing msgids, which translations match.
export function createDocumentsTableMessages(): Pick<HomepageMessages, 'documentsTable'> {
  return {
    documentsTable: {
      recents: c('Info').t`Recents`,
      recentDocuments: c('Info').t`Recent documents`,
      recentSpreadsheets: c('Info').t`Recent spreadsheets`,
      trash: c('Info').t`Trash`,
      selected: (selection: { selectedIds: readonly string[] }) =>
        c('Info').ngettext(
          msgid`${selection.selectedIds.length} selected`,
          `${selection.selectedIds.length} selected`,
          selection.selectedIds.length,
        ),
      selectAll: c('Label').t`Select all`,
      selectDocument: (document: { name: string }) => c('Label').t`Select ${document.name}`,
      move: c('Action').t`Move`,
      moveToTrash: c('Action').t`Move to trash`,
      actions: c('Action').t`Actions`,
      renameFailed: c('Notification').t`Failed to rename document`,
      invalidName: {
        empty: c('Validation Error').t`Name must not be empty`,
        tooLong: (maxLength: number) => {
          // Named as in Drive's msgid, so its translations apply
          const MAX_NAME_LENGTH = maxLength
          return c('Validation Error').ngettext(
            msgid`Name must be ${MAX_NAME_LENGTH} character long at most`,
            `Name must be ${MAX_NAME_LENGTH} characters long at most`,
            MAX_NAME_LENGTH,
          )
        },
        slashes: c('Validation Error').t`Name must not contain slashes (/)`,
      },
      justNow: c('Info').t`Just now`,
      header: {
        createdBy: c('Recent documents table header').t`Created by`,
        location: c('Recent documents table header').t`Location`,
        searchResults: c('Recent documents table header').t`Search results`,
        name: c('Recent documents table header').t`Name`,
        today: c('Recent documents table header').t`Today`,
        yesterday: c('Recent documents table header').t`Yesterday`,
        previous7Days: c('Recent documents table header').t`Previous 7 days`,
        previous30Days: c('Recent documents table header').t`Previous 30 days`,
        earlier: c('Recent documents table header').t`Earlier`,
        modified: c('Recent documents table header').t`Modified`,
        deleted: c('Recent documents table header').t`Deleted`,
        viewed: c('Recent documents table header').t`Viewed`,
      },
      location: {
        trash: c('Label').t`Trash`,
        sharedWithMe: c('Label').t`Shared with me`,
        myFiles: c('Label').t`My files`,
      },
      rowLabel: {
        spreadsheet: c('Label').t`Spreadsheet`,
        document: c('Label').t`Document`,
        createdBy: (displayName: string) => c('Label').t`Created by ${displayName}`,
        location: (locationLabel: string) => c('Label').t`Location ${locationLabel}`,
        selected: c('Label').t`Selected`,
        notSelected: c('Label').t`Not selected`,
      },
    },
  }
}
