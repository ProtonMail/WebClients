import type { CanvasGridMethods } from '@rowsncolumns/spreadsheet'
import { CanvasGrid } from '@rowsncolumns/spreadsheet'
import { GRID_THEME_PROPS, FUNCTION_DESCRIPTIONS } from '../../constants'
import { ChartComponent } from '@rowsncolumns/charts'
import { isDevOrBlack } from '@proton/utils/env'
import { useEffect, useRef } from 'react'
import { type ProtonSheetsUIStoreSetters, useUI } from '../../ui-store'
import { CellTooltip } from '../misc/CellTooltip'
import { GridFooter } from '../GridFooter/GridFooter'
import { ContextMenu, ContextMenuWrapper } from '../ContextMenu'

const exposeCanvasGrid = (
  instance: CanvasGridMethods | null,
  setters: ProtonSheetsUIStoreSetters['legacy'],
  activeSheetId: number,
) => {
  // Force exposure for e2e testing - always expose in any development-like environment
  const shouldExpose = typeof window !== 'undefined' && instance && isDevOrBlack()

  if (shouldExpose) {
    ;(window as any).spreadsheet = {
      ...instance,
      getCellDataWithValues: (coords: { rowIndex: number; columnIndex: number }) => {
        // Build a proper CellData object using the available state methods
        const { rowIndex, columnIndex } = coords

        try {
          const userEnteredValue = setters.getUserEnteredValue(activeSheetId, rowIndex, columnIndex)
          const effectiveValue = setters.getEffectiveValue(activeSheetId, rowIndex, columnIndex)
          const formattedValue = setters.getFormattedValue(activeSheetId, rowIndex, columnIndex)

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
            activeSheetId: activeSheetId,
            error: e instanceof Error ? e.message : 'Unknown error',
            stateExists: !!setters,
            availableMethods: {
              getUserEnteredValue: typeof setters.getUserEnteredValue === 'function',
              getEffectiveValue: typeof setters.getEffectiveValue === 'function',
              getFormattedValue: typeof setters.getFormattedValue === 'function',
            },
          }
          return null
        }
      },
    }
  }
}

export function LegacyGrid() {
  const canvasGridRef = useRef<CanvasGridMethods | null>(null)
  const activeSheetId = useUI((ui) => ui.legacy.activeSheetId)
  const isReadonly = useUI((ui) => ui.info.isReadonly)

  const setters = useUI.$.legacy
  const ref = (instance: CanvasGridMethods | null) => {
    canvasGridRef.current = instance
    exposeCanvasGrid(instance, setters, activeSheetId)
  }
  useEffect(() => {
    exposeCanvasGrid(canvasGridRef.current, setters, activeSheetId)
  }, [setters, activeSheetId])

  const getSeriesValuesFromRange = useUI((ui) => ui.legacy.getSeriesValuesFromRange)
  const getDomainValuesFromRange = useUI((ui) => ui.legacy.getDomainValuesFromRange)
  const onRequestEditChart = useUI((ui) => ui.legacy.chartsState.onRequestEditChart)
  const onRequestCalculate = useUI((ui) => ui.legacy.onRequestCalculate)
  const onRequestAddRows = useUI((ui) => ui.legacy.onRequestAddRows)

  return (
    <CanvasGrid
      {...GRID_THEME_PROPS}
      ref={ref}
      // the table hacks are to override the css resets that break the cell date picker
      // also need to override the hover color for buttons
      className="relative grow after:absolute after:top-0 after:z-10 after:h-[.0625rem] after:w-full after:bg-[#f8f9fa] [&_.rdp_button:hover]:!bg-[hsl(var(--rnc-accent))] [&_:is(th,td)]:!my-0 [&_table]:!table-auto"
      autoFocus={true}
      showGridLines={useUI((ui) => ui.view.gridLines.enabled)}
      borderStyles={useUI((ui) => ui.legacy.searchState.borderStyles)}
      scale={useUI((ui) => ui.legacy.scale)}
      conditionalFormats={useUI((ui) => ui.legacy.conditionalFormats)}
      sheetId={useUI((ui) => ui.legacy.activeSheetId)}
      rowCount={useUI((ui) => ui.legacy.rowCount)}
      getDataRowCount={useUI((ui) => ui.legacy.getDataRowCount)}
      columnCount={useUI((ui) => ui.legacy.columnCount)}
      frozenColumnCount={useUI((ui) => ui.legacy.frozenColumnCount)}
      frozenRowCount={useUI((ui) => ui.legacy.frozenRowCount)}
      rowMetadata={useUI((ui) => ui.legacy.rowMetadata)}
      columnMetadata={useUI((ui) => ui.legacy.columnMetadata)}
      activeCell={useUI((ui) => ui.legacy.activeCell)}
      selections={useUI((ui) => ui.legacy.selections)}
      theme={useUI((ui) => ui.legacy.theme)}
      merges={useUI((ui) => ui.legacy.merges)}
      charts={useUI((ui) => ui.legacy.charts)}
      embeds={useUI((ui) => ui.legacy.embeds)}
      tables={useUI((ui) => ui.legacy.tables)}
      protectedRanges={useUI((ui) => ui.legacy.protectedRanges)}
      bandedRanges={useUI((ui) => ui.legacy.bandedRanges)}
      functionDescriptions={FUNCTION_DESCRIPTIONS}
      getSheetName={useUI((ui) => ui.legacy.getSheetName)}
      getSheetId={useUI((ui) => ui.legacy.getSheetId)}
      getCellData={useUI((ui) => ui.legacy.getCellData)}
      onChangeActiveCell={useUI((ui) => ui.legacy.onChangeActiveCell)}
      onChangeSelections={useUI((ui) => ui.legacy.onChangeSelections)}
      onChangeActiveSheet={useUI((ui) => ui.legacy.onChangeActiveSheet)}
      onRequestCalculate={useUI((ui) => ui.legacy.onRequestCalculate)}
      onSelectNextSheet={useUI((ui) => ui.legacy.onSelectNextSheet)}
      onSelectPreviousSheet={useUI((ui) => ui.legacy.onSelectPreviousSheet)}
      onChangeFormatting={useUI((ui) => ui.legacy.onChangeFormatting)}
      onRepeatFormatting={useUI((ui) => ui.legacy.onRepeatFormatting)}
      onHideColumn={useUI((ui) => ui.legacy.onHideColumn)}
      onShowColumn={useUI((ui) => ui.legacy.onShowColumn)}
      onHideRow={useUI((ui) => ui.legacy.onHideRow)}
      onShowRow={useUI((ui) => ui.legacy.onShowRow)}
      onDelete={useUI((ui) => ui.legacy.onDelete)}
      onClearContents={useUI((ui) => ui.legacy.onDelete)}
      onFill={useUI((ui) => ui.legacy.onFill)}
      onFillRange={useUI((ui) => ui.legacy.onFillRange)}
      onResize={useUI((ui) => ui.legacy.onResize)}
      onAutoResize={useUI((ui) => ui.legacy.onAutoResize)}
      onMoveChart={useUI((ui) => ui.legacy.chartsState.onMoveChart)}
      onMoveEmbed={useUI((ui) => ui.legacy.onMoveEmbed)}
      onResizeChart={useUI((ui) => ui.legacy.chartsState.onResizeChart)}
      onDeleteChart={useUI((ui) => ui.legacy.chartsState.onDeleteChart)}
      onResizeEmbed={useUI((ui) => ui.legacy.onResizeEmbed)}
      onDeleteEmbed={useUI((ui) => ui.legacy.onDeleteEmbed)}
      onDeleteRow={useUI((ui) => ui.legacy.onDeleteRow)}
      onDeleteColumn={useUI((ui) => ui.legacy.onDeleteColumn)}
      onDeleteCellsShiftUp={useUI((ui) => ui.legacy.onDeleteCellsShiftUp)}
      onDeleteCellsShiftLeft={useUI((ui) => ui.legacy.onDeleteCellsShiftLeft)}
      onInsertCellsShiftRight={useUI((ui) => ui.legacy.onInsertCellsShiftRight)}
      onInsertCellsShiftDown={useUI((ui) => ui.legacy.onInsertCellsShiftDown)}
      onInsertRow={useUI((ui) => ui.legacy.onInsertRow)}
      onInsertColumn={useUI((ui) => ui.legacy.onInsertColumn)}
      onMoveColumns={useUI((ui) => ui.legacy.onMoveColumns)}
      onMoveRows={useUI((ui) => ui.legacy.onMoveRows)}
      onMoveSelection={useUI((ui) => ui.legacy.onMoveSelection)}
      onCreateNewSheet={useUI((ui) => ui.legacy.onCreateNewSheet)}
      onChange={useUI((ui) => ui.legacy.onChange)}
      onChangeBatch={useUI((ui) => ui.legacy.onChangeBatch)}
      onUndo={useUI((ui) => ui.legacy.onUndo)}
      onRedo={useUI((ui) => ui.legacy.onRedo)}
      onSortColumn={useUI((ui) => ui.legacy.onSortColumn)}
      onSortTable={useUI((ui) => ui.legacy.onSortTable)}
      onFilterTable={useUI((ui) => ui.legacy.onFilterTable)}
      onResizeTable={useUI((ui) => ui.legacy.onResizeTable)}
      onClearFormatting={useUI((ui) => ui.legacy.onClearFormatting)}
      onCopy={useUI((ui) => ui.legacy.onCopy)}
      onPaste={useUI((ui) => ui.legacy.onPaste)}
      onDragOver={useUI((ui) => ui.legacy.onDragOver)}
      onDrop={useUI((ui) => ui.legacy.onDrop)}
      onCreateTable={useUI((ui) => ui.legacy.onCreateTable)}
      basicFilter={useUI((ui) => ui.legacy.basicFilter)}
      onCreateBasicFilter={useUI((ui) => ui.legacy.onCreateBasicFilter)}
      onRequestEditTable={useUI((ui) => ui.legacy.onRequestEditTable)}
      onRequestDefineNamedRange={useUI((ui) => ui.legacy.onRequestDefineNamedRange)}
      onFreezeColumn={useUI((ui) => ui.legacy.onFreezeColumn)}
      onFreezeRow={useUI((ui) => ui.legacy.onFreezeRow)}
      onUpdateNote={useUI((ui) => ui.legacy.onUpdateNote)}
      onSortRange={useUI((ui) => ui.legacy.onSortRange)}
      onProtectRange={useUI((ui) => ui.legacy.onProtectRange)}
      onUnProtectRange={useUI((ui) => ui.legacy.onUnProtectRange)}
      onRequestConditionalFormat={useUI((ui) => ui.legacy.onRequestConditionalFormat)}
      namedRanges={useUI((ui) => ui.legacy.namedRanges)}
      licenseKey={process.env.DOCS_SHEETS_KEY}
      onRequestSearch={useUI((ui) => ui.legacy.searchState.onRequestSearch)}
      onRequestDataValidation={useUI((ui) => ui.legacy.onRequestDataValidation)}
      onRequestFormatCells={useUI((ui) => ui.legacy.onRequestFormatCells)}
      onRequestResize={useUI((ui) => ui.legacy.onRequestResize)}
      users={useUI((ui) => ui.legacy.yjsState.users)}
      userId={useUI((ui) => ui.legacy.yjsState.userName)}
      getChartComponent={(props) => (
        <ChartComponent
          {...props}
          getSeriesValuesFromRange={getSeriesValuesFromRange}
          getDomainValuesFromRange={getDomainValuesFromRange}
          onRequestEdit={!isReadonly ? onRequestEditChart : undefined}
          onRequestCalculate={onRequestCalculate}
          readonly={isReadonly}
        />
      )}
      readonly={isReadonly}
      getEffectiveFormat={useUI((ui) => ui.legacy.getEffectiveFormat)}
      CellTooltip={CellTooltip}
      ContextMenu={ContextMenu}
      ContextMenuWrapper={ContextMenuWrapper}
      footerHeight={isReadonly ? undefined : 68}
      footerComponent={
        isReadonly ? undefined : <GridFooter sheetId={activeSheetId} onRequestAddRows={onRequestAddRows} />
      }
    />
  )
}
