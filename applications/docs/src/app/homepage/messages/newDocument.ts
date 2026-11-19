import { c } from 'ttag'

export function createNewDocumentMessages() {
  return {
    newDocument: {
      document: c('Action').t`New document`,
      spreadsheet: c('sheets_2025:Action').t`New spreadsheet`,
    },
  }
}
