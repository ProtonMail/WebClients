import { customDateAndTimeFormatMessages } from '../components/Dialogs/CustomDateAndTimeFormatDialog/customDateAndTimeFormat'
import { chartAggregatesMessages, chartTypesMessages } from '../components/Sidebar/chartData'
import { cellFormatOptionsMessages } from '../components/Sidebar/cell-format-utils'
import { borderDataMessages } from '../components/Sidebar/borderData'
import { zoomComboboxMessages } from '../components/Toolbar/ZoomCombobox'
import { formulaBarMessages } from '../components/Toolbar/FormulaBar'
import { fontSizeControlsMessages } from '../components/Toolbar/FontSizeControls'
import { fontSelectMessages } from '../components/Toolbar/FontSelect'
import { filterByValueMessages } from '../components/FilterBox/FilterByValue'
import { filterByConditionMessages, conditionsMessages } from '../components/FilterBox/FilterByCondition'
import { sheetStatusMessages } from '../components/BottomBar/SheetStatus'
import { chartEditorDialogMessages } from '../components/Sidebar/ChartEditorDialog'
import { filterBoxMessages } from '../components/FilterBox/FilterBox'
import { customCurrencyFormatDialogMessages } from '../components/Dialogs/CustomCurrencyFormatDialog'
import { customDateAndTimeFormatDialogMessages } from '../components/Dialogs/CustomDateAndTimeFormatDialog/CustomDateAndTimeFormatDialog'
import { customNumberFormatDialogMessages } from '../components/Dialogs/CustomNumberFormatDialog/CustomNumberFormatDialog'
import { cellFormatDialogMessages } from '../components/Sidebar/CellFormatDialog'
import { colorPickerMessages } from '../components/shared/ColorPicker'
import { mergeMenuItemsMessages } from '../components/shared/MergeMenuItems'
import { numberFormatsMenuMessages } from '../components/shared/NumberFormatsMenu'
import { menusMessages } from '../components/Menubar/Menubar'
import { contextMenuMessages } from '../components/ContextMenu'
import { dataMenuMessages } from '../components/Menubar/menus/DataMenu'
import { editMenuMessages } from '../components/Menubar/menus/EditMenu'
import { fileMenuMessages } from '../components/Menubar/menus/FileMenu'
import { formatMenuMessages } from '../components/Menubar/menus/FormatMenu'
import { insertMenuMessages } from '../components/Menubar/menus/InsertMenu'
import { viewMenuMessages } from '../components/Menubar/menus/ViewMenu'
import { namedRangeEditorDialogMessages } from '../components/Sidebar/NamedRangeEditorDialog'
import { sidebarDialogMessages } from '../components/Sidebar/SidebarDialog'
import { tableEditorDialogMessages } from '../components/Sidebar/TableEditorDialog'
import { toolbarMessages } from '../components/Toolbar/Toolbar'
import { conditionalFormatDialogMessages } from '../components/Sidebar/ConditionalFormatDialog'
import { dataValidationDialogMessages } from '../components/Sidebar/DataValidationDialog'
import { stateMessages } from '../state'
import { spreadsheetMessages } from '../Spreadsheet'
import { bottomBarMessages } from '../components/BottomBar/BottomBar'
import { circleLoaderMessages } from '../components/CircleLoader/CircleLoader'
import { deleteSheetMessages } from '../components/Dialogs/DeleteSheet'
import { insertLinkMessages } from '../components/Dialogs/InsertLink'
import { resizeDimensionEditorDialogMessages } from '../components/Dialogs/ResizeDimensionEditorDialog'
import { sheetSearchMessages } from '../components/Dialogs/SheetSearch'
import { spreadsheetSettingsDialogMessages } from '../components/Dialogs/SpreadsheetSettingsDialog'
import { gridFooterMessages } from '../components/GridFooter/GridFooter'
import { cellTooltipMessages } from '../components/misc/CellTooltip'
import { editingDisabledButtonMessages } from '../components/misc/EditingDisabledButton'
import { editingDisabledDialogMessages } from '../components/misc/EditingDisabledDialog'

function createDefaultSheetsMessages() {
  return {
    ...customDateAndTimeFormatMessages,
    ...chartAggregatesMessages,
    ...chartTypesMessages,
    ...cellFormatOptionsMessages,
    ...borderDataMessages,
    ...zoomComboboxMessages,
    ...formulaBarMessages,
    ...fontSizeControlsMessages,
    ...fontSelectMessages,
    ...filterByValueMessages,
    ...filterByConditionMessages,
    ...sheetStatusMessages,
    ...chartEditorDialogMessages,
    ...filterBoxMessages,
    ...conditionsMessages,
    ...customCurrencyFormatDialogMessages,
    ...customDateAndTimeFormatDialogMessages,
    ...customNumberFormatDialogMessages,
    ...cellFormatDialogMessages,
    ...colorPickerMessages,
    ...mergeMenuItemsMessages,
    ...numberFormatsMenuMessages,
    ...menusMessages,
    ...contextMenuMessages,
    ...dataMenuMessages,
    ...editMenuMessages,
    ...fileMenuMessages,
    ...formatMenuMessages,
    ...insertMenuMessages,
    ...viewMenuMessages,
    ...namedRangeEditorDialogMessages,
    ...sidebarDialogMessages,
    ...tableEditorDialogMessages,
    ...toolbarMessages,
    ...conditionalFormatDialogMessages,
    ...dataValidationDialogMessages,
    ...stateMessages,
    ...spreadsheetMessages,
    ...bottomBarMessages,
    ...circleLoaderMessages,
    ...deleteSheetMessages,
    ...insertLinkMessages,
    ...resizeDimensionEditorDialogMessages,
    ...sheetSearchMessages,
    ...spreadsheetSettingsDialogMessages,
    ...gridFooterMessages,
    ...cellTooltipMessages,
    ...editingDisabledButtonMessages,
    ...editingDisabledDialogMessages,
  }
}

export const defaultSheetsMessages = /* @__PURE__ */ createDefaultSheetsMessages()
