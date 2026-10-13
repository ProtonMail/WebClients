import { useSheetsMessages } from '../../SheetsDependenciesProvider'
import { Direction, type CellInterface, type CellPosition, type ScrollCoords } from '@rowsncolumns/grid'
import { isNil } from '@rowsncolumns/utils'
import { useState, type ReactElement } from 'react'
import type { CanvasGridProps, ConditionType, ConditionValue, FilterView, TableView } from '@rowsncolumns/spreadsheet'
import * as Ariakit from '@ariakit/react'
import * as Atoms from '../atoms'
import * as UI from '../ui'
import * as Icons from '../icons'

import { createComponent } from '../utils'
import { FilterByCondition } from './FilterByCondition'
import { FilterByValue } from './FilterByValue'
import { Button } from '../Sidebar/shared'

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

export function FilterBox(props: FilterBoxProps) {
  const { isOpen, onOpenChange, x, y, dimensionIndex } = props
  const popover = Ariakit.usePopoverStore({
    open: isOpen,
    setOpen: onOpenChange,
  })

  return (
    <div className="absolute left-0 top-0" style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}>
      <Ariakit.PopoverProvider store={popover} placement="bottom-start">
        <Ariakit.PopoverDisclosure className="bg-transparent absolute left-0 top-0 m-0 h-0 w-0 overflow-hidden border-none p-0 shadow-none" />
        <Atoms.DropdownPopover
          render={
            <Ariakit.Popover gutter={8} className="z-10 flex min-h-0 min-w-[17rem] flex-col" portal unmountOnHide />
          }
          onContextMenu={(e) => e.stopPropagation()}
        >
          {props.filter && !isNil(dimensionIndex) ? <FilterBoxContent {...(props as FilterBoxContentProps)} /> : null}
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
  const messages = useSheetsMessages()

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
              {messages.filterBox['Insert 1 table column left']}
            </FilterBoxButton>

            <FilterBoxButton
              leadingIconSlot={<UI.Icon data={Icons.addColumn} />}
              onClick={() => {
                onInsertTableColumn?.(filter, dimensionIndex, Direction.Right)
              }}
            >
              {messages.filterBox['Insert 1 table column right']}
            </FilterBoxButton>

            <FilterBoxButton
              leadingIconSlot={<UI.Icon data={Icons.trash} />}
              onClick={() => {
                onDeleteTableColumn?.(filter, dimensionIndex)
              }}
            >
              {messages.filterBox['Delete table column']}
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
          {messages.filterBox['Sort A → Z']}
        </FilterBoxButton>

        <FilterBoxButton
          leadingIconSlot={<UI.Icon data={Icons.sortDescending} />}
          onClick={() => {
            onSort?.(sheetId, filter, dimensionIndex, 'DESCENDING')
          }}
        >
          {messages.filterBox['Sort Z → A']}
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
          {messages.filterBox.Apply}
        </Button>
        <Button
          render={<Ariakit.PopoverDismiss />}
          type="button"
          className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
        >
          {messages.filterBox.Cancel}
        </Button>
      </div>
    </div>
  )
}

export const filterBoxMessages = {
  filterBox: {
    Copy: `Copy`,
    Paste: `Paste`,
    'Insert 1 table column left': `Insert 1 table column left`,
    'Insert 1 table column right': `Insert 1 table column right`,
    'Delete table column': `Delete table column`,
    'Sort A → Z': `Sort A → Z`,
    'Sort Z → A': `Sort Z → A`,
    Apply: `Apply`,
    Cancel: `Cancel`,
  },
}
