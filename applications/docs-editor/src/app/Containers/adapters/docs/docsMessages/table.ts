import { c } from 'ttag'
import type { DocsMessages } from '../../../Docs/public'

export function createTableMessages(): Pick<DocsMessages, 'table'> {
  return {
    table: {
      menuLabel: c('Label').t`Table`,
      fitToPageWidth: c('Action').t`Fit table to page width`,
      // translator: Table header options
      headerOptions: c('Action').t`Options`,
      headerRow: c('Action').t`Header row`,
      headerColumn: c('Action').t`Header column`,
      tableOptions: c('Action').t`Table options`,
      duplicate: c('Action').t`Duplicate`,
      deleteTable: c('Action').t`Delete`,
      openRowMenu: c('Action').t`Click to open row menu`,
      openColumnMenu: c('Action').t`Click to open column menu`,
      color: c('Action').t`Color`,
      insertAbove: c('Action').t`Insert above`,
      insertBelow: c('Action').t`Insert below`,
      insertLeft: c('Action').t`Insert left`,
      insertRight: c('Action').t`Insert right`,
      clearContents: c('Action').t`Clear contents`,
      deleteRow: c('Action').t`Delete row`,
      deleteColumn: c('Action').t`Delete column`,
      addRow: c('Action').t`Add new table row`,
      addColumn: c('Action').t`Add new table column`,
    },
  }
}
