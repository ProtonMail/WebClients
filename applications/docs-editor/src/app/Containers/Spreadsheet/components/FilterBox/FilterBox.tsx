import { Direction, type CellInterface, type CellPosition, type ScrollCoords } from '@rowsncolumns/grid'
import { isNil } from '@rowsncolumns/utils'
import { useState, type KeyboardEvent, type PointerEvent, type ReactElement } from 'react'
import type { CanvasGridProps, ConditionType, ConditionValue, FilterView, TableView } from '@rowsncolumns/spreadsheet'
import * as Ariakit from '@ariakit/react'
import * as Atoms from '../atoms'
import * as UI from '../ui'
import * as Icons from '../icons'
import { c } from 'ttag'
import { createStringifier } from '../../stringifier'
import { createComponent } from '../utils'
import { FilterByCondition } from './FilterByCondition'
import { FilterByValue } from './FilterByValue'
import { Button } from '../Sidebar/shared'

const { s } = createStringifier(strings)

const isTableView = (filter: FilterView | TableView): filter is TableView => {
  return 'columns' in filter
}

type UseFilterProps = {
  scale?: number
  sheetId: number
  getActualCellCoords(coords: CellInterface): CellInterface | undefined
  getScrollPosition(): ScrollCoords | undefined
  getCellOffsetFromCoords(coords: CellInterface): CellPosition | undefined
  getFormattedValue(sheetId: number, rowIndex: number, columnIndex: number): string | undefined
  getFilterComponent(props: FilterBoxBaseProps): ReactElement | null
  isFrozenRow(rowIndex: number): boolean
  isFrozenColumn(columnIndex: number): boolean
  isHiddenRowByFilter(rowIndex: number): boolean
  onSortTable: CanvasGridProps['onSortTable']
  onFilterTable: CanvasGridProps['onFilterTable']
  onInsertTableColumn: CanvasGridProps['onInsertTableColumn']
  onDeleteTableColumn: CanvasGridProps['onDeleteTableColumn']
}

type FilterBoxBaseProps = {
  x: number
  y: number
  dimensionIndex: number
  isOpen: boolean
  onOpenChange(value: boolean): void
  onSort: UseFilterProps['onSortTable']
  onFilter: UseFilterProps['onFilterTable']
  onInsertTableColumn: UseFilterProps['onInsertTableColumn']
  onDeleteTableColumn: UseFilterProps['onDeleteTableColumn']
  filter: FilterView | TableView
  values: string[]
}

type FilterBoxProps = Omit<FilterBoxBaseProps, 'filter'> & {
  sheetId: number
  filter?: FilterView | TableView
  dimensionIndex?: number
}

/** The menu's width in px: 17rem by default, up to 40rem, never past the space it's given. */
const MIN_WIDTH = 272
const MAX_WIDTH = 640
const WIDTH_STEP = 16
/** Kept while the sheet is open, so the menu reopens at the width someone dragged it to. */
let lastWidth = MIN_WIDTH

export function FilterBox(props: FilterBoxProps) {
  const { isOpen, onOpenChange, x, y, dimensionIndex } = props
  const popover = Ariakit.usePopoverStore({
    open: isOpen,
    setOpen: onOpenChange,
  })
  const [width, setWidthState] = useState(lastWidth)
  const setWidth = (next: number) => {
    lastWidth = Math.round(Math.min(Math.max(next, MIN_WIDTH), MAX_WIDTH))
    setWidthState(lastWidth)
  }

  return (
    <div className="absolute left-0 top-0" style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}>
      <Ariakit.PopoverProvider store={popover} placement="bottom-start">
        <Ariakit.PopoverDisclosure className="bg-transparent absolute left-0 top-0 m-0 h-0 w-0 overflow-hidden border-none p-0 shadow-none" />
        <Atoms.DropdownPopover
          render={<Ariakit.Popover gutter={8} className="relative z-10 flex min-h-0 flex-col" portal unmountOnHide />}
          style={{ width }}
          onContextMenu={(e) => e.stopPropagation()}
        >
          {props.filter && !isNil(dimensionIndex) ? <FilterBoxContent {...(props as FilterBoxContentProps)} /> : null}
          <ResizeHandle width={width} onResize={setWidth} />
        </Atoms.DropdownPopover>
      </Ariakit.PopoverProvider>
    </div>
  )
}

const FilterBoxButton = createComponent(function FilterBoxButton(props: Atoms.DropdownItemProps) {
  return <Ariakit.PopoverDismiss render={<Atoms.DropdownItem {...props} />} />
})

type FilterBoxContentProps = FilterBoxProps & Required<Pick<FilterBoxProps, 'filter'>>

function FilterBoxContent({
  dimensionIndex,
  onOpenChange,
  onSort,
  onFilter,
  onDeleteTableColumn,
  onInsertTableColumn,
  sheetId,
  filter,
  values,
}: FilterBoxContentProps) {
  const filterSpec = filter?.filterSpecs?.find((spec) => spec.columnIndex === dimensionIndex)
  const filterCriteria = filterSpec?.filterCriteria
  const [conditionType, onChangeConditionType] = useState<ConditionType | undefined>(
    filterCriteria?.condition?.type ?? undefined,
  )
  const [fromValue, onChangeFromValue] = useState(filterCriteria?.condition?.values?.[0]?.userEnteredValue ?? '')
  const [toValue, onChangeToValue] = useState(filterCriteria?.condition?.values?.[1]?.userEnteredValue ?? '')
  const [visibleValues, onChangeVisibleValues] = useState<string[] | undefined | null>(
    filterCriteria?.visibleValues ?? values,
  )

  const isTable = isTableView(filter)

  const onApply = () => {
    const conditionValues: ConditionValue[] = []
    if (fromValue) {
      conditionValues.push({ userEnteredValue: fromValue })
    }
    if (toValue) {
      conditionValues.push({ userEnteredValue: toValue })
    }
    onFilter?.(sheetId, filter, dimensionIndex, conditionType, conditionValues, visibleValues)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 grow flex-col overflow-y-auto *:shrink-0">
        {isTable && onInsertTableColumn && onDeleteTableColumn ? (
          <>
            <FilterBoxButton
              leadingIconSlot={<UI.Icon data={Icons.addColumn} style={{ transform: 'scaleX(-1)' }} />}
              onClick={() => {
                onInsertTableColumn?.(filter, dimensionIndex, Direction.Left)
              }}
            >
              {s('Insert 1 table column left')}
            </FilterBoxButton>

            <FilterBoxButton
              leadingIconSlot={<UI.Icon data={Icons.addColumn} />}
              onClick={() => {
                onInsertTableColumn?.(filter, dimensionIndex, Direction.Right)
              }}
            >
              {s('Insert 1 table column right')}
            </FilterBoxButton>

            <FilterBoxButton
              leadingIconSlot={<UI.Icon data={Icons.trash} />}
              onClick={() => {
                onDeleteTableColumn?.(filter, dimensionIndex)
              }}
            >
              {s('Delete table column')}
            </FilterBoxButton>
            <Atoms.DropdownSeparator />
          </>
        ) : null}

        <FilterBoxButton
          leadingIconSlot={<UI.Icon data={Icons.sortAlphabetically} />}
          onClick={() => {
            onSort?.(sheetId, filter, dimensionIndex, 'ASCENDING')
          }}
        >
          {s('Sort A → Z')}
        </FilterBoxButton>

        <FilterBoxButton
          leadingIconSlot={<UI.Icon data={Icons.sortDescending} />}
          onClick={() => {
            onSort?.(sheetId, filter, dimensionIndex, 'DESCENDING')
          }}
        >
          {s('Sort Z → A')}
        </FilterBoxButton>

        <div className="px-4 py-2">
          <FilterByCondition
            conditionType={conditionType}
            onChangeConditionType={onChangeConditionType}
            toValue={toValue}
            onChangeToValue={onChangeToValue}
            fromValue={fromValue}
            onChangeFromValue={onChangeFromValue}
          />
        </div>

        <Atoms.DropdownSeparator />

        <div className="px-4 py-2">
          <FilterByValue values={values} visibleValues={visibleValues} onChangeVisibleValues={onChangeVisibleValues} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t-[0.5px] border-[#EAE7E4] px-4 pt-2">
        <Button
          render={<Ariakit.PopoverDismiss />}
          type="button"
          className="inline-flex h-[36px] items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-4 text-[13px] text-[white]"
          onClick={onApply}
        >
          {s('Apply')}
        </Button>
        <Button
          render={<Ariakit.PopoverDismiss />}
          type="button"
          className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
        >
          {s('Cancel')}
        </Button>
      </div>
    </div>
  )
}

/**
 * The menu's right edge: drag it (or use the arrow keys) to widen the menu so
 * long values fit. Double-click puts it back to the default width. The menu
 * hangs from its left edge, so only the right edge moves.
 */
function ResizeHandle({ width, onResize }: { width: number; onResize: (width: number) => void }) {
  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) {
      return
    }
    e.preventDefault()
    const handle = e.currentTarget
    handle.setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startWidth = width
    const onMove = (move: globalThis.PointerEvent) => onResize(startWidth + move.clientX - startX)
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove)
      handle.removeEventListener('pointerup', onUp)
      handle.removeEventListener('pointercancel', onUp)
    }
    handle.addEventListener('pointermove', onMove)
    handle.addEventListener('pointerup', onUp)
    handle.addEventListener('pointercancel', onUp)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = { ArrowLeft: -WIDTH_STEP, ArrowRight: WIDTH_STEP }[e.key]
    if (step) {
      e.preventDefault()
      onResize(width + step)
    }
  }
  return (
    <button
      type="button"
      aria-label={s('Resize filter menu')}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onDoubleClick={() => onResize(MIN_WIDTH)}
      className="group absolute inset-y-0 right-0 m-0 flex w-2 cursor-ew-resize touch-none items-center justify-center border-0 p-0 [background:transparent] focus:outline-none"
    >
      <span className="h-8 w-[.1875rem] rounded-full bg-[--border-norm] transition-colors duration-150 ease-out group-hover:bg-[--text-hint] group-focus-visible:bg-[--text-hint] group-active:bg-[--text-weak]" />
    </button>
  )
}

function strings() {
  return {
    Copy: c('sheets_2025:Spreadsheet filter menu').t`Copy`,
    Paste: c('sheets_2025:Spreadsheet filter menu').t`Paste`,
    'Insert 1 table column left': c('sheets_2025:Spreadsheet filter menu').t`Insert 1 table column left`,
    'Insert 1 table column right': c('sheets_2025:Spreadsheet filter menu').t`Insert 1 table column right`,
    'Delete table column': c('sheets_2025:Spreadsheet filter menu').t`Delete table column`,
    'Sort A → Z': c('sheets_2025:Spreadsheet filter menu').t`Sort A → Z`,
    'Sort Z → A': c('sheets_2025:Spreadsheet filter menu').t`Sort Z → A`,
    Apply: c('sheets_2025:Spreadsheet filter menu').t`Apply`,
    Cancel: c('sheets_2025:Spreadsheet filter menu').t`Cancel`,
    'Resize filter menu': c('sheets_2025:Spreadsheet filter menu').t`Resize filter menu`,
  }
}
