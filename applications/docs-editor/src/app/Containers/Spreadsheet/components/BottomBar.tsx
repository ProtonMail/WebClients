import {
  NewSheetButton,
  BottomBar as RncBottomBar,
  SheetStatus,
  SheetSwitcher,
  SheetTabs,
} from '@rowsncolumns/spreadsheet'
import type { ProtonSheetsState } from '../state'

export type BottomBarProps = {
  state: ProtonSheetsState
  isReadonly: boolean
  isRevisionMode: boolean
}

export function BottomBar({ state, isReadonly, isRevisionMode }: BottomBarProps) {
  return (
    <RncBottomBar>
      {!isRevisionMode && <NewSheetButton onClick={state.onCreateNewSheet} disabled={isReadonly} />}
      <SheetSwitcher
        sheets={state.sheets}
        activeSheetId={state.activeSheetId}
        onChangeActiveSheet={state.onChangeActiveSheet}
        onShowSheet={state.onShowSheet}
      />
      <SheetTabs
        sheets={state.sheets}
        protectedRanges={state.protectedRanges}
        activeSheetId={state.activeSheetId}
        theme={state.theme}
        onChangeActiveSheet={state.onChangeActiveSheet}
        onRenameSheet={state.onRenameSheet}
        onChangeSheetTabColor={state.onChangeSheetTabColor}
        onDeleteSheet={state.onRequestDeleteSheet}
        onHideSheet={state.onHideSheet}
        onMoveSheet={state.onMoveSheet}
        onProtectSheet={state.onProtectSheet}
        onUnProtectSheet={state.onUnProtectSheet}
        onDuplicateSheet={state.onDuplicateSheet}
        readonly={isReadonly}
      />
      <SheetStatus
        sheetId={state.activeSheetId}
        activeCell={state.activeCell}
        selections={state.selections}
        onRequestCalculate={state.onRequestCalculate}
        rowCount={state.rowCount}
        columnCount={state.columnCount}
        merges={state.merges}
      />
    </RncBottomBar>
  )
}
