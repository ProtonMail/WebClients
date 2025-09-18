import type { ComponentPropsWithRef } from 'react'
import type { ProtonSheetsState } from '../../state'
import { createComponent } from '../utils'
import * as T from './primitives'
import { SheetTab } from './SheetTab'
import { SheetSwitcher } from './SheetSwitcher'

export interface BottomBarProps extends ComponentPropsWithRef<'div'> {
  state: ProtonSheetsState
  isReadonly: boolean
  isRevisionMode: boolean
}

export const BottomBar = createComponent(function BottomBar({
  state,
  isReadonly,
  isRevisionMode,
  ...props
}: BottomBarProps) {
  const visibleSheets = state.sheets.filter((sheet) => !sheet.hidden)

  return (
    <T.Container {...props}>
      {/* Left section: Sheet switcher */}
      <div className="flex items-center gap-2 px-2">
        <SheetSwitcher
          sheets={state.sheets}
          activeSheetId={state.activeSheetId}
          onChangeActiveSheet={state.onChangeActiveSheet}
          onShowSheet={state.onShowSheet}
        />
      </div>

      <T.Separator />

      {/* Center section: Sheet tabs */}
      <T.TabList>
        {visibleSheets.map((sheet) => {
          // Find the actual position of this sheet in all sheets (including hidden ones)
          const actualPosition = state.sheets.findIndex((s) => s.sheetId === sheet.sheetId)

          // Determine if we can move left or right in the actual sheets array
          const canMoveLeft = actualPosition > 0
          const canMoveRight = actualPosition < state.sheets.length - 1

          return (
            <SheetTab
              key={sheet.sheetId}
              sheet={sheet}
              active={sheet.sheetId === state.activeSheetId}
              isReadonly={isReadonly}
              protectedRanges={state.protectedRanges}
              position={actualPosition}
              canMoveLeft={canMoveLeft}
              canMoveRight={canMoveRight}
              onChangeActiveSheet={state.onChangeActiveSheet}
              onRenameSheet={state.onRenameSheet}
              onChangeSheetTabColor={state.onChangeSheetTabColor}
              onDeleteSheet={state.onRequestDeleteSheet}
              onHideSheet={state.onHideSheet}
              onMoveSheet={state.onMoveSheet}
              onProtectSheet={state.onProtectSheet}
              onUnProtectSheet={state.onUnProtectSheet}
              onDuplicateSheet={state.onDuplicateSheet}
            />
          )
        })}

        {/* New sheet button positioned after tabs */}
        {!isRevisionMode && <T.NewSheetButton onClick={state.onCreateNewSheet} disabled={isReadonly} />}
      </T.TabList>

      <T.Separator />
    </T.Container>
  )
})
