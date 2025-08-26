import type { CanvasGridMethods } from '@rowsncolumns/spreadsheet'
import { CanvasGrid } from '@rowsncolumns/spreadsheet'
import type { ProtonSheetsState } from '../../state'
import { functionDescriptions } from '@rowsncolumns/functions'
import { ChartComponent } from '@rowsncolumns/charts'
import { isDevOrBlack } from '@proton/utils/env'
import { useEffect, useRef } from 'react'

export type LegacyGridProps = {
  state: ProtonSheetsState
  isReadonly: boolean
  // TODO: move this into state object
  users: any
  userName: string
}

const exposeCanvasGrid = (instance: CanvasGridMethods | null, state: ProtonSheetsState) => {
  // Force exposure for e2e testing - always expose in any development-like environment
  const shouldExpose = typeof window !== 'undefined' && instance && isDevOrBlack()

  if (shouldExpose) {
    ;(window as any).spreadsheet = {
      ...instance,
      getCellDataWithValues: (coords: { rowIndex: number; columnIndex: number }) => {
        // Build a proper CellData object using the available state methods
        const { rowIndex, columnIndex } = coords

        try {
          const userEnteredValue = state.getUserEnteredValue(state.activeSheetId, rowIndex, columnIndex)
          const effectiveValue = state.getEffectiveValue(state.activeSheetId, rowIndex, columnIndex)
          const formattedValue = state.getFormattedValue(state.activeSheetId, rowIndex, columnIndex)

          // Return a proper CellData object structure
          const result = {
            userEnteredValue,
            effectiveValue,
            formattedValue,
          }
          return result
        } catch (e) {
          // Store debug info even on error
          ;(window as any).lastCellQuery = {
            coords,
            activeSheetId: state.activeSheetId,
            error: e instanceof Error ? e.message : 'Unknown error',
            stateExists: !!state,
            availableMethods: {
              getUserEnteredValue: typeof state.getUserEnteredValue === 'function',
              getEffectiveValue: typeof state.getEffectiveValue === 'function',
              getFormattedValue: typeof state.getFormattedValue === 'function',
            },
          }
          return null
        }
      },
    }
  }
}

export function LegacyGrid({ state, isReadonly, users, userName }: LegacyGridProps) {
  const canvasGridRef = useRef<CanvasGridMethods | null>(null)

  // Use useEffect to ensure API is exposed as soon as possible
  useEffect(() => {
    exposeCanvasGrid(canvasGridRef.current, state)
  }, [state]) // Re-run when state changes

  return (
    <CanvasGrid
      {...state.spreadsheetColors}
      ref={(instance) => {
        canvasGridRef.current = instance
        exposeCanvasGrid(instance, state)
      }}
      borderStyles={state.searchState.borderStyles}
      scale={state.scale}
      conditionalFormats={state.conditionalFormats}
      sheetId={state.activeSheetId}
      rowCount={state.rowCount}
      getDataRowCount={state.getDataRowCount}
      columnCount={state.columnCount}
      frozenColumnCount={state.frozenColumnCount}
      frozenRowCount={state.frozenRowCount}
      rowMetadata={state.rowMetadata}
      columnMetadata={state.columnMetadata}
      activeCell={state.activeCell}
      selections={state.selections}
      theme={state.theme}
      merges={state.merges}
      charts={state.charts}
      embeds={state.embeds}
      tables={state.tables}
      protectedRanges={state.protectedRanges}
      bandedRanges={state.bandedRanges}
      functionDescriptions={functionDescriptions}
      getSheetName={state.getSheetName}
      getSheetId={state.getSheetId}
      getCellData={state.getCellData}
      onChangeActiveCell={state.onChangeActiveCell}
      onChangeSelections={state.onChangeSelections}
      onChangeActiveSheet={state.onChangeActiveSheet}
      onRequestCalculate={state.onRequestCalculate}
      onSelectNextSheet={state.onSelectNextSheet}
      onSelectPreviousSheet={state.onSelectPreviousSheet}
      onChangeFormatting={state.onChangeFormatting}
      onRepeatFormatting={state.onRepeatFormatting}
      onHideColumn={state.onHideColumn}
      onShowColumn={state.onShowColumn}
      onHideRow={state.onHideRow}
      onShowRow={state.onShowRow}
      onDelete={state.onDelete}
      onClearContents={state.onDelete}
      onFill={state.onFill}
      onFillRange={state.onFillRange}
      onResize={state.onResize}
      onMoveChart={state.chartsState.onMoveChart}
      onMoveEmbed={state.onMoveEmbed}
      onResizeChart={state.chartsState.onResizeChart}
      onDeleteChart={state.chartsState.onDeleteChart}
      onResizeEmbed={state.onResizeEmbed}
      onDeleteEmbed={state.onDeleteEmbed}
      onDeleteRow={state.onDeleteRow}
      onDeleteColumn={state.onDeleteColumn}
      onDeleteCellsShiftUp={state.onDeleteCellsShiftUp}
      onDeleteCellsShiftLeft={state.onDeleteCellsShiftLeft}
      onInsertCellsShiftRight={state.onInsertCellsShiftRight}
      onInsertCellsShiftDown={state.onInsertCellsShiftDown}
      onInsertRow={state.onInsertRow}
      onInsertColumn={state.onInsertColumn}
      onMoveColumns={state.onMoveColumns}
      onMoveRows={state.onMoveRows}
      onMoveSelection={state.onMoveSelection}
      onCreateNewSheet={state.onCreateNewSheet}
      onChange={state.onChange}
      onChangeBatch={state.onChangeBatch}
      onUndo={state.onUndo}
      onRedo={state.onRedo}
      onSortColumn={state.onSortColumn}
      onSortTable={state.onSortTable}
      onFilterTable={state.onFilterTable}
      onResizeTable={state.onResizeTable}
      onClearFormatting={state.onClearFormatting}
      onCopy={state.onCopy}
      onPaste={state.onPaste}
      onDragOver={state.onDragOver}
      onDrop={state.onDrop}
      onCreateTable={state.onCreateTable}
      onRequestEditTable={state.onRequestEditTable}
      onRequestDefineNamedRange={state.onRequestDefineNamedRange}
      onFreezeColumn={state.onFreezeColumn}
      onFreezeRow={state.onFreezeRow}
      onUpdateNote={state.onUpdateNote}
      onSortRange={state.onSortRange}
      onProtectRange={state.onProtectRange}
      onUnProtectRange={state.onUnProtectRange}
      onRequestConditionalFormat={state.onRequestConditionalFormat}
      namedRanges={state.namedRanges}
      licenseKey={process.env.DOCS_SHEETS_KEY}
      onRequestSearch={state.searchState.onRequestSearch}
      onRequestDataValidation={state.onRequestDataValidation}
      onRequestFormatCells={state.onRequestFormatCells}
      users={users}
      userId={userName}
      getChartComponent={(props) => (
        <ChartComponent
          {...props}
          getSeriesValuesFromRange={state.getSeriesValuesFromRange}
          getDomainValuesFromRange={state.getDomainValuesFromRange}
          onRequestEdit={!isReadonly ? state.chartsState.onRequestEditChart : undefined}
          onRequestCalculate={state.onRequestCalculate}
          readonly={isReadonly}
        />
      )}
      readonly={isReadonly}
      getEffectiveFormat={state.getEffectiveFormat}
    />
  )
}
