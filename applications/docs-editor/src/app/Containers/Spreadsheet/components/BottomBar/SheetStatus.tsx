import clsx from '@proton/utils/clsx'
import type { PropsWithChildren } from 'react'
import { useEffect, useState } from 'react'
import * as Ariakit from '@ariakit/react'
import { Button } from '../Sidebar/shared'
import * as UI from '../ui'
import * as Atoms from '../atoms'
import { c } from 'ttag'
import { createStringifier } from '../../stringifier'
import {
  getCalculatedValues,
  scheduleIdlePriorityCallback,
  useFormulaModeValue,
  useSheetStatusDisplay,
} from '@rowsncolumns/spreadsheet'
import { isNil } from '@rowsncolumns/utils'
import { useUI } from '../../ui-store'

const { s } = createStringifier(strings)

function SheetStatusChip(props: PropsWithChildren) {
  return (
    <div
      className={clsx(
        'h-7 rounded bg-[white] text-xs font-medium',
        'flex items-center px-2',
        'border border-[#E9E9E9]',
      )}
    >
      {props.children}
    </div>
  )
}

export function SheetStatus() {
  const [{ showAverage, showCount, showSum, showMin, showMax, showNumericalCount }, setSheetStatusDisplay] =
    useSheetStatusDisplay()

  const isFormulaMode = useFormulaModeValue()
  const activeCell = useUI((ui) => ui.legacy.activeCell)
  const selections = useUI((ui) => ui.legacy.selections)
  const activeSheetId = useUI((ui) => ui.legacy.activeSheetId)
  const rowCount = useUI((ui) => ui.legacy.rowCount)
  const columnCount = useUI((ui) => ui.legacy.columnCount)
  const merges = useUI((ui) => ui.legacy.merges)
  const onRequestCalculate = useUI((ui) => ui.legacy.onRequestCalculate)

  // Recompute the selection statistics whenever the selection (or the data it points to) changes.
  // Mirrors the library's `SheetStatus`, deferring the calculation to idle time. Like the library,
  // stats are only shown for a range selection (2+ cells); a single active cell shows nothing.
  const [values, setValues] = useState<Awaited<ReturnType<typeof getCalculatedValues>>>(undefined)
  useEffect(() => {
    if (isFormulaMode || !selections?.length) {
      return
    }
    scheduleIdlePriorityCallback(() => {
      void getCalculatedValues(
        onRequestCalculate,
        selections,
        activeSheetId,
        merges,
        activeCell.rowIndex,
        activeCell.columnIndex,
        rowCount,
        columnCount,
      ).then(setValues)
    })
  }, [isFormulaMode, selections, activeSheetId, rowCount, columnCount, activeCell, merges, onRequestCalculate])

  const hasSelection = Boolean(selections?.length)
  const [sum, count, average, min, max, numericalCount] = values ?? []

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {hasSelection ? (
          <>
            {showAverage && !isNil(average) ? (
              <SheetStatusChip>{`${s('Average')}: ${average.toFixed(2)}`}</SheetStatusChip>
            ) : null}
            {showCount && !isNil(count) ? <SheetStatusChip>{`${s('Count')}: ${count}`}</SheetStatusChip> : null}
            {showNumericalCount && !isNil(numericalCount) ? (
              <SheetStatusChip>{`${s('Numerical count')}: ${numericalCount}`}</SheetStatusChip>
            ) : null}
            {showMin && !isNil(min) ? <SheetStatusChip>{`${s('Min')}: ${min.toFixed(2)}`}</SheetStatusChip> : null}
            {showMax && !isNil(max) ? <SheetStatusChip>{`${s('Max')}: ${max.toFixed(2)}`}</SheetStatusChip> : null}
            {showSum && !isNil(sum) ? <SheetStatusChip>{`${s('Sum')}: ${sum.toFixed(2)}`}</SheetStatusChip> : null}
          </>
        ) : null}
      </div>

      <Ariakit.MenuProvider>
        <Ariakit.MenuButton
          render={<Button />}
          className={clsx('flex size-7 items-center justify-center rounded', 'border border-[#E9E9E9]')}
        >
          <UI.Icon legacyName="chevron-down-filled" />
        </Ariakit.MenuButton>

        <Atoms.DropdownPopover {...Atoms.DROPDOWN_POPOVER_DEFAULTS} render={<Ariakit.Menu />}>
          <UI.MenuGroup>
            <UI.MenuGroupLabel className="text-xs">{s('Customize Status Bar')}</UI.MenuGroupLabel>
            <UI.MenuItem
              hideOnClick={false}
              leadingIndent
              selectedIndicator={showAverage === true}
              onClick={() => setSheetStatusDisplay((prev) => ({ ...prev, showAverage: !prev.showAverage }))}
            >
              {s('Average')}
            </UI.MenuItem>
            <UI.MenuItem
              hideOnClick={false}
              leadingIndent
              selectedIndicator={showCount === true}
              onClick={() => setSheetStatusDisplay((prev) => ({ ...prev, showCount: !prev.showCount }))}
            >
              {s('Count')}
            </UI.MenuItem>
            <UI.MenuItem
              hideOnClick={false}
              leadingIndent
              selectedIndicator={showNumericalCount === true}
              onClick={() =>
                setSheetStatusDisplay((prev) => ({ ...prev, showNumericalCount: !prev.showNumericalCount }))
              }
            >
              {s('Numerical count')}
            </UI.MenuItem>
            <UI.MenuItem
              hideOnClick={false}
              leadingIndent
              selectedIndicator={showMin === true}
              onClick={() => setSheetStatusDisplay((prev) => ({ ...prev, showMin: !prev.showMin }))}
            >
              {s('Min')}
            </UI.MenuItem>
            <UI.MenuItem
              hideOnClick={false}
              leadingIndent
              selectedIndicator={showMax === true}
              onClick={() => setSheetStatusDisplay((prev) => ({ ...prev, showMax: !prev.showMax }))}
            >
              {s('Max')}
            </UI.MenuItem>
            <UI.MenuItem
              hideOnClick={false}
              leadingIndent
              selectedIndicator={showSum === true}
              onClick={() => setSheetStatusDisplay((prev) => ({ ...prev, showSum: !prev.showSum }))}
            >
              {s('Sum')}
            </UI.MenuItem>
          </UI.MenuGroup>
        </Atoms.DropdownPopover>
      </Ariakit.MenuProvider>
    </div>
  )
}

function strings() {
  return {
    'Customize Status Bar': c('sheets_2025:Spreadsheet sheet status bar').t`Customize Status Bar`,
    Average: c('sheets_2025:Spreadsheet sheet status bar').t`Average`,
    Count: c('sheets_2025:Spreadsheet sheet status bar').t`Count`,
    'Numerical count': c('sheets_2025:Spreadsheet sheet status bar').t`Numerical count`,
    Min: c('sheets_2025:Spreadsheet sheet status bar').t`Min`,
    Max: c('sheets_2025:Spreadsheet sheet status bar').t`Max`,
    Sum: c('sheets_2025:Spreadsheet sheet status bar').t`Sum`,
  }
}
