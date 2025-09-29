import { type CellInterface, isAreasEqual } from '@rowsncolumns/grid'
import {
  type NamedRange,
  useGetAddressFromSelection,
  useFormulaModeValue,
  addressToSelection,
  FormulaBarInput,
  selectionToRxC,
  sortSheetsByIndex,
} from '@rowsncolumns/spreadsheet'
import { addressToCell, cellToAddress, convertCellToRange } from '@rowsncolumns/utils'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useUI } from '../../ui-store'
import { onlyImplementedFunctionDescriptions as functionDescriptions } from '../../constants'
import * as Ariakit from '@ariakit/react'
import * as UI from '../ui'
import * as Icons from '../icons'
import { c } from 'ttag'
import { createStringifier } from '../../stringifier'

const { s } = createStringifier(strings)

function RangeSelector() {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const isFormulaMode = useFormulaModeValue()
  const getAddressFromSelection = useGetAddressFromSelection()

  const sheetId = useUI((ui) => ui.legacy.activeSheetId)
  const rowCount = useUI((ui) => ui.legacy.rowCount)
  const columnCount = useUI((ui) => ui.legacy.columnCount)
  const activeCell = useUI((ui) => ui.legacy.activeCell)
  const namedRanges = useUI((ui) => ui.legacy.namedRanges)
  const selections = useUI((ui) => ui.legacy.selections)
  const merges = useUI((ui) => ui.legacy.merges)
  const onChangeActiveCell = useUI.$.legacy.onChangeActiveCell
  const onChangeSelections = useUI.$.legacy.onChangeSelections

  // TODO: do we need the extra deps?
  useEffect(() => {
    if (isFormulaMode) {
      return
    }
    const lastSelection = selections[selections.length - 1]
    const isSelectionInProgress = lastSelection?.inProgress
    let inputValue: string | null | undefined = cellToAddress(activeCell)
    if (lastSelection) {
      if (isSelectionInProgress) {
        inputValue = selectionToRxC(lastSelection)
      } else {
        inputValue = getAddressFromSelection?.(lastSelection, undefined)
      }
    }

    // We check if selection is part of a named range
    const range = namedRanges.find(({ range }) => {
      return range && isAreasEqual(range, lastSelection ? lastSelection.range : convertCellToRange(activeCell))
    })

    if (inputValue) {
      setValue(range ? range.name : inputValue)
    }
  }, [rowCount, columnCount, activeCell, selections, namedRanges, isFormulaMode, merges, getAddressFromSelection])

  const onSelectNamedRange = useUI.$.legacy.onSelectNamedRange

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const value = inputRef.current?.value
        if (value) {
          // Check for named range
          const namedRange = namedRanges.find((range) => range.name === value)
          if (namedRange) {
            onSelectNamedRange(namedRange)
            return
          }
          // Check for selections
          const selection = addressToSelection(value, rowCount, columnCount)
          const activeCell: CellInterface | null = selection
            ? {
                rowIndex: selection.range.startRowIndex,
                columnIndex: selection.range.startColumnIndex,
              }
            : addressToCell(value)
          if (activeCell) {
            onChangeActiveCell(sheetId, activeCell)
          }
          onChangeSelections(sheetId, selection ? [selection] : [])
        }
      }
    },
    [namedRanges, rowCount, columnCount, onChangeSelections, sheetId, onSelectNamedRange, onChangeActiveCell],
  )

  return (
    <div className="flex w-32 items-center py-0.5">
      <input
        type="text"
        value={value}
        ref={inputRef}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="border-none bg-[white] px-1 py-1 text-sm font-normal focus:outline-none focus:ring-0"
      />
      <RangeSelectorMenu />
    </div>
  )
}

interface RangeSelectorMenuProps extends Ariakit.MenuProviderProps {}

function RangeSelectorMenu(props: RangeSelectorMenuProps) {
  const menu = Ariakit.useMenuStore({ focusLoop: true })
  const mounted = Ariakit.useStoreState(menu, 'mounted')
  return (
    <Ariakit.MenuProvider store={menu} {...props}>
      <Ariakit.MenuButton className="h-7 w-7 flex-shrink-0 rounded-[.5rem] hover:bg-[#C2C1C0]/20 focus-visible:bg-[#C2C1C0]/20 data-[focus-visible]:bg-[#C2C1C0]/20">
        <UI.Icon legacyName="chevron-down-filled" />
      </Ariakit.MenuButton>
      {mounted && <RangeSelectorMenuPopover />}
    </Ariakit.MenuProvider>
  )
}

function RangeSelectorMenuPopover() {
  const sheets = useUI((ui) => ui.legacy.sheets)
  const namedRanges = useUI((ui) => ui.legacy.namedRanges)
  const tables = useUI((ui) => ui.legacy.tables)
  const sheetId = useUI((ui) => ui.legacy.activeSheetId)
  const activeCell = useUI((ui) => ui.legacy.activeCell)
  const selections = useUI((ui) => ui.legacy.selections)
  const onRequestDefineNamedRange = useUI.$.legacy.onRequestDefineNamedRange
  const onChangeActiveSheet = useUI.$.legacy.onChangeActiveSheet
  const onSelectTable = useUI.$.legacy.onSelectTable

  const defineNamedRange = useCallback(() => {
    onRequestDefineNamedRange?.(sheetId, activeCell, selections)
  }, [activeCell, onRequestDefineNamedRange, selections, sheetId])

  return (
    <UI.Menu>
      <UI.MenuGroup>
        <UI.MenuGroupLabel>{s('Named ranges')}</UI.MenuGroupLabel>
        {namedRanges.map((namedRange) => (
          <NamedRangeItem key={namedRange.namedRangeId} namedRange={namedRange} />
        ))}
        <UI.MenuItem
          onClick={defineNamedRange}
          leadingIconSlot={<UI.Icon legacyName="plus" />}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Add new')}
        </UI.MenuItem>
      </UI.MenuGroup>
      <UI.MenuSeparator />
      {tables.length > 0 && (
        <>
          <UI.MenuGroup>
            <UI.MenuGroupLabel>{s('Tables')}</UI.MenuGroupLabel>
            {tables.map((table) => (
              <UI.MenuItem
                key={table.id}
                onClick={() => {
                  onSelectTable(table)
                }}
                leadingIconSlot={<UI.Icon data={Icons.table} />}
              >
                {table.title}
              </UI.MenuItem>
            ))}
          </UI.MenuGroup>
          <UI.MenuSeparator />
        </>
      )}
      <UI.MenuGroup>
        <UI.MenuGroupLabel>{s('Sheets')}</UI.MenuGroupLabel>
        {sortSheetsByIndex(sheets).map(({ title, sheetId }) => (
          <UI.MenuItem
            leadingIconSlot={<UI.Icon legacyName="file" />}
            key={sheetId}
            onClick={() => onChangeActiveSheet(sheetId)}
          >
            {title}
          </UI.MenuItem>
        ))}
      </UI.MenuGroup>
    </UI.Menu>
  )
}

type NamedRangeItemProps = { namedRange: NamedRange }
function NamedRangeItem({ namedRange }: NamedRangeItemProps) {
  const sheetId = useUI((ui) => ui.legacy.activeSheetId)
  const onSelectNamedRange = useUI.$.legacy.onSelectNamedRange
  const onRequestUpdateNamedRange = useUI.$.legacy.onRequestUpdateNamedRange
  const onDeleteNamedRange = useUI.$.legacy.onDeleteNamedRange
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.tableRange} />}>{namedRange.name}</UI.SubMenuButton>
      <UI.SubMenu>
        {namedRange.range && (
          <UI.MenuItem
            onClick={() => {
              onSelectNamedRange(namedRange)
            }}
          >
            View
          </UI.MenuItem>
        )}
        <UI.MenuItem
          onClick={() => {
            onRequestUpdateNamedRange(sheetId, namedRange)
          }}
        >
          Edit
        </UI.MenuItem>
        <UI.MenuItem
          onClick={() => {
            onDeleteNamedRange(namedRange.namedRangeId)
          }}
        >
          Remove
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

export function FormulaBar() {
  const showFormulaBar = useUI((ui) => ui.view.formulaBar.enabled)
  return showFormulaBar ? <FormulaBarContent /> : null
}

function FormulaBarContent() {
  return (
    <div className="border-weak flex gap-[.125rem] border-t px-3">
      <RangeSelector />
      <div className="border-weak flex items-center border-x px-1 text-sm font-normal italic">fx</div>
      <div className="flex max-h-8 flex-1 items-center overflow-auto py-1">
        <FormulaBarInput
          className="border-none bg-[white] text-sm font-normal focus:ring-0"
          sheetId={useUI((ui) => ui.legacy.activeSheetId)}
          activeCell={useUI((ui) => ui.legacy.activeCell)}
          functionDescriptions={functionDescriptions}
          disabled={useUI((ui) => ui.info.isReadonly)}
        />
      </div>
    </div>
  )
}

function strings() {
  return {
    'Add new': c('sheets_2025:Range selector menu').t`Add new`,
    'Named ranges': c('sheets_2025:Range selector menu').t`Named ranges`,
    Tables: c('sheets_2025:Range selector menu').t`Tables`,
    Sheets: c('sheets_2025:Range selector menu').t`Sheets`,
  }
}
