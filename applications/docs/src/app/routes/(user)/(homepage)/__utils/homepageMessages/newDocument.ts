import { c } from 'ttag'

import type { HomepageMessages } from '~/homepage'

export function createNewDocumentMessages(): Pick<HomepageMessages, 'newDocument'> {
  return {
    newDocument: {
      document: c('Action').t`New document`,
      spreadsheet: c('sheets_2025:Action').t`New spreadsheet`,
    },
  }
}
