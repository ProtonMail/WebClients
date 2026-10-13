import type { SheetsMessages } from '../../../Spreadsheet/public'
import { createMenusMessages } from './menus'
import { createWorkbookMessages } from './workbook'
import { createFormattingMessages } from './formatting'
import { createFiltersMessages } from './filters'
import { createChartsMessages } from './charts'
import { createValidationMessages } from './validation'
import { createTablesMessages } from './tables'
import { createToolbarMessages } from './toolbar'

/** Recreate after the host activates a locale. All feature groups are mandatory. */
export function createSheetsMessages(): SheetsMessages {
  return {
    ...createMenusMessages(),
    ...createWorkbookMessages(),
    ...createFormattingMessages(),
    ...createFiltersMessages(),
    ...createChartsMessages(),
    ...createValidationMessages(),
    ...createTablesMessages(),
    ...createToolbarMessages(),
  }
}
