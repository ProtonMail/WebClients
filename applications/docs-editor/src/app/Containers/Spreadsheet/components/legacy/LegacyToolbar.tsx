import type { useSpreadsheetState } from '@rowsncolumns/spreadsheet-state'
import { pattern_currency_decimal, pattern_percent_decimal } from '@rowsncolumns/spreadsheet-state'
import {
  ButtonInsertChart,
  BackgroundColorSelector,
  BorderSelector,
  ButtonBold,
  ButtonDecreaseDecimal,
  ButtonFormatCurrency,
  ButtonFormatPercent,
  ButtonIncreaseDecimal,
  ButtonItalic,
  ButtonRedo,
  ButtonStrikethrough,
  ButtonUnderline,
  ButtonUndo,
  DEFAULT_FONT_SIZE_PT,
  FontFamilySelector,
  FontSizeSelector,
  MergeCellsSelector,
  ScaleSelector,
  TableStyleSelector,
  TextColorSelector,
  TextFormatSelector,
  TextHorizontalAlignSelector,
  TextVerticalAlignSelector,
  TextWrapSelector,
  ThemeSelector,
  Toolbar,
  ToolbarSeparator,
  RangeSelector,
  FormulaBarLabel,
  FormulaBarInput,
  FormulaBar,
} from '@rowsncolumns/spreadsheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  IconButton,
  Separator,
  SimpleTooltip,
} from '@rowsncolumns/ui'
import { MagnifyingGlassIcon, DownloadIcon, ImageIcon } from '@rowsncolumns/icons'
import type { ProtonSheetsState } from '../../state'
import { LOCALE, CURRENCY } from '../../constants'
import { useRef } from 'react'
import { c } from 'ttag'
import { functionDescriptions } from '@rowsncolumns/functions'

export type LegacyToolbarProps = {
  state: ProtonSheetsState
  downloadLogs: () => void
  isReadonly: boolean
}

export function LegacyToolbar({ state, downloadLogs, isReadonly }: LegacyToolbarProps) {
  return (
    <>
      <Toolbar>
        <ButtonUndo onClick={state.onUndo} disabled={!state.canUndo} />
        <ButtonRedo onClick={state.onRedo} disabled={!state.canRedo} />
        <ToolbarSeparator />
        <ScaleSelector value={state.scale} onChange={state.onChangeScale} />
        <ToolbarSeparator />
        <ButtonFormatCurrency
          onClick={() => {
            state.onChangeFormatting(state.activeSheetId, state.activeCell, state.selections, 'numberFormat', {
              type: 'CURRENCY',
              pattern: pattern_currency_decimal,
            })
          }}
        />
        <ButtonFormatPercent
          onClick={() => {
            state.onChangeFormatting(state.activeSheetId, state.activeCell, state.selections, 'numberFormat', {
              type: 'PERCENT',
              pattern: pattern_percent_decimal,
            })
          }}
        />
        <ButtonDecreaseDecimal
          onClick={() => state.onChangeDecimals(state.activeSheetId, state.activeCell, state.selections, 'decrement')}
        />
        <ButtonIncreaseDecimal
          onClick={() => state.onChangeDecimals(state.activeSheetId, state.activeCell, state.selections, 'increment')}
        />
        <TextFormatSelector
          locale={LOCALE}
          currency={CURRENCY}
          onChangeFormatting={(type, value) =>
            state.onChangeFormatting(state.activeSheetId, state.activeCell, state.selections, type, value)
          }
        />
        <ToolbarSeparator />
        <FontFamilySelector
          value={state.currentCellFormat?.textFormat?.fontFamily}
          theme={state.theme}
          onChange={(value) => {
            state.onChangeFormatting(state.activeSheetId, state.activeCell, state.selections, 'textFormat', {
              fontFamily: value,
            })
          }}
        />
        <ToolbarSeparator />
        <FontSizeSelector
          value={state.currentCellFormat?.textFormat?.fontSize ?? DEFAULT_FONT_SIZE_PT}
          onChange={(value) => {
            state.onChangeFormatting(state.activeSheetId, state.activeCell, state.selections, 'textFormat', {
              fontSize: Number(value),
            })
          }}
        />
        <ToolbarSeparator />
        <ButtonBold
          isActive={state.currentCellFormat?.textFormat?.bold}
          onClick={() => {
            state.onChangeFormatting(state.activeSheetId, state.activeCell, state.selections, 'textFormat', {
              bold: !state.currentCellFormat?.textFormat?.bold,
            })
          }}
        />
        <ButtonItalic
          isActive={state.currentCellFormat?.textFormat?.italic}
          onClick={() => {
            state.onChangeFormatting(state.activeSheetId, state.activeCell, state.selections, 'textFormat', {
              italic: !state.currentCellFormat?.textFormat?.italic,
            })
          }}
        />
        <ButtonUnderline
          isActive={state.currentCellFormat?.textFormat?.underline}
          onClick={() => {
            state.onChangeFormatting(state.activeSheetId, state.activeCell, state.selections, 'textFormat', {
              underline: !state.currentCellFormat?.textFormat?.underline,
            })
          }}
        />
        <ButtonStrikethrough
          isActive={state.currentCellFormat?.textFormat?.strikethrough}
          onClick={() => {
            state.onChangeFormatting(state.activeSheetId, state.activeCell, state.selections, 'textFormat', {
              strikethrough: !state.currentCellFormat?.textFormat?.strikethrough,
            })
          }}
        />
        <TextColorSelector
          color={state.currentCellFormat?.textFormat?.color}
          theme={state.theme}
          onChange={(color) => {
            state.onChangeFormatting(state.activeSheetId, state.activeCell, state.selections, 'textFormat', {
              color,
            })
          }}
        />
        <ToolbarSeparator />
        <BackgroundColorSelector
          color={state.currentCellFormat?.backgroundColor}
          theme={state.theme}
          onChange={(color) => {
            state.onChangeFormatting(state.activeSheetId, state.activeCell, state.selections, 'backgroundColor', color)
          }}
        />

        <BorderSelector
          borders={state.currentCellFormat?.borders}
          onChange={(location, color, style) =>
            state.onChangeBorder(state.activeSheetId, state.activeCell, state.selections, location, color, style)
          }
          theme={state.theme}
        />
        <MergeCellsSelector
          activeCell={state.activeCell}
          selections={state.selections}
          sheetId={state.activeSheetId}
          merges={state.merges}
          onUnMerge={state.onUnMergeCells}
          onMerge={state.onMergeCells}
        />
        <ToolbarSeparator />
        <TextHorizontalAlignSelector
          value={state.currentCellFormat?.horizontalAlignment}
          onChange={(value) => {
            state.onChangeFormatting(
              state.activeSheetId,
              state.activeCell,
              state.selections,
              'horizontalAlignment',
              value,
            )
          }}
        />
        <TextVerticalAlignSelector
          value={state.currentCellFormat?.verticalAlignment}
          onChange={(value) => {
            state.onChangeFormatting(
              state.activeSheetId,
              state.activeCell,
              state.selections,
              'verticalAlignment',
              value,
            )
          }}
        />
        <TextWrapSelector
          value={state.currentCellFormat?.wrapStrategy}
          onChange={(value) => {
            state.onChangeFormatting(state.activeSheetId, state.activeCell, state.selections, 'wrapStrategy', value)
          }}
        />
        <ToolbarSeparator />

        <InsertImageMenu onInsertFile={state.onInsertFile} />
        <ButtonInsertChart
          onClick={() => state.chartsState.onCreateChart(state.activeSheetId, state.activeCell, state.selections)}
        />

        <TableStyleSelector
          theme={state.theme}
          tables={state.tables}
          activeCell={state.activeCell}
          selections={state.selections}
          sheetId={state.activeSheetId}
          onCreateTable={state.onCreateTable}
          onUpdateTable={state.onUpdateTable}
        />
        <ToolbarSeparator />
        <ThemeSelector theme={state.theme} onChangeTheme={state.onChangeSpreadsheetTheme} />
        <IconButton onClick={state.searchState.onRequestSearch}>
          <MagnifyingGlassIcon />
        </IconButton>
        <SimpleTooltip tooltip="Download debugging logs as ZIP file">
          <IconButton onClick={downloadLogs}>
            <DownloadIcon />
          </IconButton>
        </SimpleTooltip>
      </Toolbar>
      <LegacyFormulaBar state={state} isReadonly={isReadonly} />
    </>
  )
}

function InsertImageMenu({ onInsertFile }: { onInsertFile: ReturnType<typeof useSpreadsheetState>['onInsertFile'] }) {
  const insertOverCellsRef = useRef(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <IconButton tooltip="Insert image">
          <ImageIcon />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="absolute left-0 top-0 h-px w-px opacity-0"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                onInsertFile?.(file, undefined, undefined, {
                  insertOverCells: insertOverCellsRef.current,
                }).catch(console.error)
              }
            }}
          />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() => {
              insertOverCellsRef.current = false
              imageInputRef.current?.click()
            }}
          >{c('sheets_2025:Action').t`Insert image in cell`}</DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              insertOverCellsRef.current = true
              imageInputRef.current?.click()
            }}
          >{c('sheets_2025:Action').t`Insert image over cells`}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  )
}

type LegacyFormulaBarProps = {
  state: ProtonSheetsState
  isReadonly: boolean
}

function LegacyFormulaBar({ state, isReadonly }: LegacyFormulaBarProps) {
  return (
    <FormulaBar>
      <RangeSelector
        selections={state.selections}
        activeCell={state.activeCell}
        onChangeActiveCell={state.onChangeActiveCell}
        onChangeSelections={state.onChangeSelections}
        sheets={state.sheets}
        rowCount={state.rowCount}
        columnCount={state.columnCount}
        onChangeActiveSheet={state.onChangeActiveSheet}
        onRequestDefineNamedRange={state.onRequestDefineNamedRange}
        onRequestUpdateNamedRange={state.onRequestUpdateNamedRange}
        onDeleteNamedRange={state.onDeleteNamedRange}
        namedRanges={state.namedRanges}
        tables={state.tables}
        sheetId={state.activeSheetId}
        merges={state.merges}
      />
      <Separator orientation="vertical" />
      <FormulaBarLabel>fx</FormulaBarLabel>
      <FormulaBarInput
        sheetId={state.activeSheetId}
        activeCell={state.activeCell}
        functionDescriptions={functionDescriptions}
        readOnly={isReadonly}
      />
    </FormulaBar>
  )
}
