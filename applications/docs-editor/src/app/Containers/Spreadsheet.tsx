/* eslint-disable monorepo-cop/no-relative-import-outside-package */

import type { ForwardedRef } from 'react'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { SheetData } from '@rowsncolumns/spreadsheet-state'
import {
  DeleteSheetConfirmation,
  NamedRangeEditor,
  pattern_currency_decimal,
  pattern_percent_decimal,
  TableEditor,
  useSearch,
  useSpreadsheetState,
} from '@rowsncolumns/spreadsheet-state'
import type {
  CellData,
  Sheet,
  EmbeddedChart,
  EmbeddedObject,
  TableView,
  ConditionalFormatRule,
  ProtectedRange,
  SpreadsheetTheme,
  ColorMode,
  NamedRange,
} from '@rowsncolumns/spreadsheet'
import {
  ButtonInsertChart,
  CanvasGrid,
  defaultSpreadsheetTheme,
  BackgroundColorSelector,
  BorderSelector,
  ButtonBold,
  ButtonDecreaseDecimal,
  ButtonFormatCurrency,
  ButtonFormatPercent,
  ButtonIncreaseDecimal,
  ButtonInsertImage,
  ButtonItalic,
  ButtonRedo,
  ButtonStrikethrough,
  ButtonSwitchColorMode,
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
  FormulaBar,
  FormulaBarInput,
  FormulaBarLabel,
  RangeSelector,
  BottomBar,
  NewSheetButton,
  SheetSearch,
  SheetStatus,
  SheetSwitcher,
  SheetTabs,
} from '@rowsncolumns/spreadsheet'
import { ChartComponent, useCharts, ChartEditor, ChartEditorDialog } from '@rowsncolumns/charts'
import { IconButton, Separator } from '@rowsncolumns/ui'
import { functionDescriptions, functions } from '@rowsncolumns/functions'
import { MagnifyingGlassIcon } from '@rowsncolumns/icons'
import type { EditorInitializationConfig, DocStateInterface, SheetImportData } from '@proton/docs-shared'
import { EditorSystemMode, SheetImportEvent } from '@proton/docs-shared'
import { DocProvider, TranslatedResult } from '@proton/docs-shared'
import { useYSpreadsheetV2 } from '@rowsncolumns/y-spreadsheet'
import { useSyncedState } from '../Hooks/useSyncedState'
import '@rowsncolumns/spreadsheet/dist/spreadsheet.min.css'
import type { EditorLoadResult } from '../Lib/EditorLoadResult'
import { SupportedProtonDocsMimeTypes } from '@proton/shared/lib/drive/constants'
import { useApplication } from './ApplicationProvider'

export type SheetRef = {
  getSheetState: () => {
    sheets: Sheet[]
    sheetData: SheetData<CellData>
    conditionalFormats: ConditionalFormatRule[]
    protectedRanges: ProtectedRange[]
    charts: EmbeddedChart[]
    embeds: EmbeddedObject[]
    tables: TableView[]
    namedRanges: NamedRange[]
  }
}

export const Spreadsheet = forwardRef(function Spreadsheet(
  {
    docState,
    hidden,
    onEditorLoadResult,
    editorInitializationConfig,
    systemMode,
  }: {
    docState: DocStateInterface
    hidden: boolean
    onEditorLoadResult: EditorLoadResult
    editorInitializationConfig: EditorInitializationConfig | undefined
    systemMode: EditorSystemMode
  },
  ref: ForwardedRef<SheetRef>,
) {
  const { application } = useApplication()
  const { userName } = useSyncedState()

  const didImportFromExcelFile = useRef(false)
  const [sheets, onChangeSheets] = useState<Sheet[]>([])
  const [sheetData, onChangeSheetData] = useState<SheetData<CellData>>({})
  const [scale, onChangeScale] = useState(1)
  const [theme, onChangeTheme] = useState<SpreadsheetTheme>(defaultSpreadsheetTheme)
  const [conditionalFormats, onChangeConditionalFormats] = useState<ConditionalFormatRule[]>([])
  const [protectedRanges, onChangeProtectedRanges] = useState<ProtectedRange[]>([])
  const [colorMode, onChangeColorMode] = useState<ColorMode>()
  const [charts, onChangeCharts] = useState<EmbeddedChart[]>([])
  const [embeds, onChangeEmbeds] = useState<EmbeddedObject[]>([])
  const [tables, onChangeTables] = useState<TableView[]>([])
  const [namedRanges, onChangeNamedRanges] = useState<NamedRange[]>([])
  const locale = 'en-GB'
  const currency = 'USD'
  const yDoc = useMemo(() => docState.getDoc(), [docState])

  const isRevisionMode = systemMode === EditorSystemMode.Revision

  const {
    activeCell,
    activeSheetId,
    selections,
    rowCount,
    getDataRowCount,
    columnCount,
    frozenColumnCount,
    frozenRowCount,
    rowMetadata,
    columnMetadata,
    merges,
    bandedRanges,
    spreadsheetColors,
    canRedo,
    canUndo,
    onUndo,
    onRedo,
    getCellData,
    getSheetName,
    getSheetId,
    getEffectiveFormat,
    onRequestCalculate,
    onChangeActiveCell,
    onChangeActiveSheet,
    onSelectNextSheet,
    onSelectPreviousSheet,
    onChangeSelections,
    onChange,
    onChangeBatch,
    onDelete,
    onChangeFormatting,
    onRepeatFormatting,
    onClearFormatting,
    onUnMergeCells,
    onMergeCells,
    onResize,
    onChangeBorder,
    onChangeDecimals,
    onChangeSheetTabColor,
    onRenameSheet,
    onRequestDeleteSheet,
    onDeleteSheet,
    onShowSheet,
    onHideSheet,
    onProtectSheet,
    onUnProtectSheet,
    onMoveSheet,
    onCreateNewSheet,
    onDuplicateSheet,
    onHideColumn,
    onShowColumn,
    onHideRow,
    onShowRow,
    onFill,
    onFillRange,
    onMoveEmbed,
    onResizeEmbed,
    onDeleteEmbed,
    onDeleteRow,
    onDeleteColumn,
    onDeleteCellsShiftUp,
    onDeleteCellsShiftLeft,
    onInsertCellsShiftRight,
    onInsertCellsShiftDown,
    onInsertRow,
    onInsertColumn,
    onMoveColumns,
    onMoveRows,
    onMoveSelection,
    onSortColumn,
    onSortTable,
    onFilterTable,
    onResizeTable,
    onCopy,
    onPaste,
    onCreateTable,
    onRequestEditTable,
    onUpdateTable,
    onDragOver,
    onDrop,
    onInsertFile,
    onFreezeColumn,
    onFreezeRow,
    onChangeSpreadsheetTheme,
    onUpdateNote,
    onSortRange,
    onProtectRange,
    onUnProtectRange,
    onRequestDefineNamedRange,
    onRequestUpdateNamedRange,
    onCreateNamedRange,
    onUpdateNamedRange,
    onDeleteNamedRange,

    // Create a history stack
    createHistory,

    // Enqueue any calculation manually
    enqueueCalculation,
    getNonEmptyColumnCount,
    getNonEmptyRowCount,
    calculateNow,

    getSeriesValuesFromRange,
    getDomainValuesFromRange,
  } = useSpreadsheetState({
    sheets,
    sheetData,
    tables,
    functions,
    namedRanges,
    theme,
    colorMode,
    locale,
    onChangeSheets,
    onChangeSheetData,
    onChangeEmbeds,
    onChangeCharts,
    onChangeTables,
    onChangeNamedRanges,
    onChangeTheme,
    onChangeConditionalFormats,
    onChangeProtectedRanges,
    onChangeHistory(patches) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      onBroadcastPatch(patches)
    },
  })

  useImperativeHandle(ref, () => ({
    getSheetState: () => ({
      activeCell,
      activeSheetId,
      sheets,
      sheetData,
      conditionalFormats,
      protectedRanges,
      charts,
      embeds,
      tables,
      namedRanges,
    }),
  }))

  const provider = useMemo(() => {
    const provider = new DocProvider(docState)
    // useYSpreadsheet checks for either a "synced" event from the provider
    // or for a true `synced` property before it starts listening to changes
    // to the doc
    provider.synced = true
    return provider
  }, [docState])

  const { users, onBroadcastPatch } = useYSpreadsheetV2({
    provider,
    doc: yDoc,
    onChangeSheetData,
    onChangeSheets,
    onChangeTables,
    onChangeCharts,
    onChangeEmbeds,
    onChangeConditionalFormats,
    onChangeNamedRanges,
    onChangeProtectedRanges,
    enqueueCalculation,
    calculateNow,
    sheetId: activeSheetId,
    activeCell,
    initialSheets: [],

    // User info
    userId: userName,
    title: userName,
  })

  // Charts module
  const { onRequestEditChart, onDeleteChart, onMoveChart, onResizeChart, onUpdateChart, onCreateChart, selectedChart } =
    useCharts({
      onChangeCharts,
      createHistory,
    })

  const {
    onSearch,
    onResetSearch,
    onFocusNextResult,
    onFocusPreviousResult,
    hasNextResult,
    hasPreviousResult,
    borderStyles,
    isSearchActive,
    onRequestSearch,
    currentResult,
    totalResults,
    searchQuery,
  } = useSearch({
    sheets,
    getCellData,
    sheetId: activeSheetId,
    getNonEmptyColumnCount,
    getNonEmptyRowCount,
  })

  const currentCellFormat = useMemo(
    () => getEffectiveFormat(activeSheetId, activeCell.rowIndex, activeCell.columnIndex),
    [activeSheetId, activeCell, getEffectiveFormat],
  )

  useEffect(() => {
    onEditorLoadResult(TranslatedResult.ok())
  }, [onEditorLoadResult])

  useEffect(() => {
    const canConvertFile =
      editorInitializationConfig &&
      editorInitializationConfig.mode === 'conversion' &&
      editorInitializationConfig.type.dataType === 'xlsx'
    if (canConvertFile && !didImportFromExcelFile.current) {
      didImportFromExcelFile.current = true
      const file = new File([editorInitializationConfig.data], 'import.xlsx', {
        type: SupportedProtonDocsMimeTypes.xlsx,
      })
      onInsertFile(file, undefined, undefined, {
        minRowCount: 1000,
        minColumnCount: 100,
      }).catch(console.error)
    }
  }, [calculateNow, editorInitializationConfig, onChange, onInsertFile])

  useEffect(
    () =>
      application.eventBus.addEventCallback((data: SheetImportData) => {
        const newSheet = onCreateNewSheet()
        if (newSheet) {
          onInsertFile(
            data.file,
            newSheet.sheetId,
            { rowIndex: 1, columnIndex: 1 },
            { preserveFormatting: data.shouldConvertCellContents },
          )
            .then(() => {
              calculateNow({
                shouldResetCellDependencyGraph: true,
              })
            })
            .catch(console.error)
        }
      }, SheetImportEvent),
    [application.eventBus, calculateNow, onCreateNewSheet, onInsertFile],
  )

  const createdInitialSheetRef = useRef(false)
  useEffect(() => {
    if (
      editorInitializationConfig &&
      editorInitializationConfig.mode === 'creation' &&
      !createdInitialSheetRef.current
    ) {
      onCreateNewSheet()
      createdInitialSheetRef.current = true
    }
  }, [editorInitializationConfig, onCreateNewSheet])

  return (
    <>
      {hidden && (
        <div
          className="bg-norm absolute z-[100] flex h-full w-full flex-col items-center justify-center gap-4"
          data-testid="editor-curtain"
        ></div>
      )}
      <div className="flex h-full w-full flex-1 flex-col [grid-column:1/3] [grid-row:1/3]">
        {!isRevisionMode && (
          <Toolbar>
            <ButtonUndo onClick={onUndo} disabled={!canUndo} />
            <ButtonRedo onClick={onRedo} disabled={!canRedo} />
            <ToolbarSeparator />
            <ScaleSelector value={scale} onChange={onChangeScale} />
            <ToolbarSeparator />
            <ButtonFormatCurrency
              onClick={() => {
                onChangeFormatting(activeSheetId, activeCell, selections, 'numberFormat', {
                  type: 'CURRENCY',
                  pattern: pattern_currency_decimal,
                })
              }}
            />
            <ButtonFormatPercent
              onClick={() => {
                onChangeFormatting(activeSheetId, activeCell, selections, 'numberFormat', {
                  type: 'PERCENT',
                  pattern: pattern_percent_decimal,
                })
              }}
            />
            <ButtonDecreaseDecimal
              onClick={() => onChangeDecimals(activeSheetId, activeCell, selections, 'decrement')}
            />
            <ButtonIncreaseDecimal
              onClick={() => onChangeDecimals(activeSheetId, activeCell, selections, 'increment')}
            />
            <TextFormatSelector
              locale={locale}
              currency={currency}
              onChangeFormatting={(type, value) =>
                onChangeFormatting(activeSheetId, activeCell, selections, type, value)
              }
            />
            <ToolbarSeparator />
            <FontFamilySelector
              value={currentCellFormat?.textFormat?.fontFamily}
              theme={theme}
              onChange={(value) => {
                onChangeFormatting(activeSheetId, activeCell, selections, 'textFormat', {
                  fontFamily: value,
                })
              }}
            />
            <ToolbarSeparator />
            <FontSizeSelector
              value={currentCellFormat?.textFormat?.fontSize ?? DEFAULT_FONT_SIZE_PT}
              onChange={(value) => {
                onChangeFormatting(activeSheetId, activeCell, selections, 'textFormat', {
                  fontSize: Number(value),
                })
              }}
            />
            <ToolbarSeparator />
            <ButtonBold
              isActive={currentCellFormat?.textFormat?.bold}
              onClick={() => {
                onChangeFormatting(activeSheetId, activeCell, selections, 'textFormat', {
                  bold: !currentCellFormat?.textFormat?.bold,
                })
              }}
            />
            <ButtonItalic
              isActive={currentCellFormat?.textFormat?.italic}
              onClick={() => {
                onChangeFormatting(activeSheetId, activeCell, selections, 'textFormat', {
                  italic: !currentCellFormat?.textFormat?.italic,
                })
              }}
            />
            <ButtonUnderline
              isActive={currentCellFormat?.textFormat?.underline}
              onClick={() => {
                onChangeFormatting(activeSheetId, activeCell, selections, 'textFormat', {
                  underline: !currentCellFormat?.textFormat?.underline,
                })
              }}
            />
            <ButtonStrikethrough
              isActive={currentCellFormat?.textFormat?.strikethrough}
              onClick={() => {
                onChangeFormatting(activeSheetId, activeCell, selections, 'textFormat', {
                  strikethrough: !currentCellFormat?.textFormat?.strikethrough,
                })
              }}
            />
            <TextColorSelector
              color={currentCellFormat?.textFormat?.color}
              theme={theme}
              onChange={(color) => {
                onChangeFormatting(activeSheetId, activeCell, selections, 'textFormat', {
                  color,
                })
              }}
            />
            <ToolbarSeparator />
            <BackgroundColorSelector
              color={currentCellFormat?.backgroundColor}
              theme={theme}
              onChange={(color) => {
                onChangeFormatting(activeSheetId, activeCell, selections, 'backgroundColor', color)
              }}
            />

            <BorderSelector
              borders={currentCellFormat?.borders}
              onChange={(location, color, style) =>
                onChangeBorder(activeSheetId, activeCell, selections, location, color, style)
              }
              theme={theme}
            />
            <MergeCellsSelector
              activeCell={activeCell}
              selections={selections}
              sheetId={activeSheetId}
              merges={merges}
              onUnMerge={onUnMergeCells}
              onMerge={onMergeCells}
            />
            <ToolbarSeparator />
            <TextHorizontalAlignSelector
              value={currentCellFormat?.horizontalAlignment}
              onChange={(value) => {
                onChangeFormatting(activeSheetId, activeCell, selections, 'horizontalAlignment', value)
              }}
            />
            <TextVerticalAlignSelector
              value={currentCellFormat?.verticalAlignment}
              onChange={(value) => {
                onChangeFormatting(activeSheetId, activeCell, selections, 'verticalAlignment', value)
              }}
            />
            <TextWrapSelector
              value={currentCellFormat?.wrapStrategy}
              onChange={(value) => {
                onChangeFormatting(activeSheetId, activeCell, selections, 'wrapStrategy', value)
              }}
            />
            <ToolbarSeparator />

            <ButtonInsertImage onInsertFile={onInsertFile} />
            <ButtonInsertChart onClick={() => onCreateChart(activeSheetId, activeCell, selections)} />

            <TableStyleSelector
              theme={theme}
              tables={tables}
              activeCell={activeCell}
              selections={selections}
              sheetId={activeSheetId}
              onCreateTable={onCreateTable}
              onUpdateTable={onUpdateTable}
            />
            <ToolbarSeparator />
            <ThemeSelector theme={theme} onChangeTheme={onChangeSpreadsheetTheme} />
            <ButtonSwitchColorMode
              colorMode={colorMode}
              onClick={() => onChangeColorMode((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            />
            <IconButton onClick={onRequestSearch}>
              <MagnifyingGlassIcon />
            </IconButton>
          </Toolbar>
        )}
        <FormulaBar>
          <RangeSelector
            selections={selections}
            activeCell={activeCell}
            onChangeActiveCell={onChangeActiveCell}
            onChangeSelections={onChangeSelections}
            sheets={sheets}
            rowCount={rowCount}
            columnCount={columnCount}
            onChangeActiveSheet={onChangeActiveSheet}
            onRequestDefineNamedRange={onRequestDefineNamedRange}
            onRequestUpdateNamedRange={onRequestUpdateNamedRange}
            onDeleteNamedRange={onDeleteNamedRange}
            namedRanges={namedRanges}
            tables={tables}
            sheetId={activeSheetId}
            merges={merges}
          />
          <Separator orientation="vertical" />
          <FormulaBarLabel>fx</FormulaBarLabel>
          <FormulaBarInput
            sheetId={activeSheetId}
            activeCell={activeCell}
            functionDescriptions={functionDescriptions}
            readOnly={isRevisionMode}
          />
        </FormulaBar>
        <CanvasGrid
          {...spreadsheetColors}
          borderStyles={borderStyles}
          scale={scale}
          conditionalFormats={conditionalFormats}
          sheetId={activeSheetId}
          rowCount={rowCount}
          getDataRowCount={getDataRowCount}
          columnCount={columnCount}
          frozenColumnCount={frozenColumnCount}
          frozenRowCount={frozenRowCount}
          rowMetadata={rowMetadata}
          columnMetadata={columnMetadata}
          activeCell={activeCell}
          selections={selections}
          theme={theme}
          merges={merges}
          charts={charts}
          embeds={embeds}
          tables={tables}
          protectedRanges={protectedRanges}
          bandedRanges={bandedRanges}
          functionDescriptions={functionDescriptions}
          getSheetName={getSheetName}
          getSheetId={getSheetId}
          getCellData={getCellData}
          onChangeActiveCell={onChangeActiveCell}
          onChangeSelections={onChangeSelections}
          onChangeActiveSheet={onChangeActiveSheet}
          onRequestCalculate={onRequestCalculate}
          onSelectNextSheet={onSelectNextSheet}
          onSelectPreviousSheet={onSelectPreviousSheet}
          onChangeFormatting={onChangeFormatting}
          onRepeatFormatting={onRepeatFormatting}
          onHideColumn={onHideColumn}
          onShowColumn={onShowColumn}
          onHideRow={onHideRow}
          onShowRow={onShowRow}
          onDelete={onDelete}
          onClearContents={onDelete}
          onFill={onFill}
          onFillRange={onFillRange}
          onResize={onResize}
          onMoveChart={onMoveChart}
          onMoveEmbed={onMoveEmbed}
          onResizeChart={onResizeChart}
          onDeleteChart={onDeleteChart}
          onResizeEmbed={onResizeEmbed}
          onDeleteEmbed={onDeleteEmbed}
          onDeleteRow={onDeleteRow}
          onDeleteColumn={onDeleteColumn}
          onDeleteCellsShiftUp={onDeleteCellsShiftUp}
          onDeleteCellsShiftLeft={onDeleteCellsShiftLeft}
          onInsertCellsShiftRight={onInsertCellsShiftRight}
          onInsertCellsShiftDown={onInsertCellsShiftDown}
          onInsertRow={onInsertRow}
          onInsertColumn={onInsertColumn}
          onMoveColumns={onMoveColumns}
          onMoveRows={onMoveRows}
          onMoveSelection={onMoveSelection}
          onCreateNewSheet={onCreateNewSheet}
          onChange={onChange}
          onChangeBatch={onChangeBatch}
          onUndo={onUndo}
          onRedo={onRedo}
          onSortColumn={onSortColumn}
          onSortTable={onSortTable}
          onFilterTable={onFilterTable}
          onResizeTable={onResizeTable}
          onClearFormatting={onClearFormatting}
          onCopy={onCopy}
          onPaste={onPaste}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onCreateTable={onCreateTable}
          onRequestEditTable={onRequestEditTable}
          onRequestDefineNamedRange={onRequestDefineNamedRange}
          onFreezeColumn={onFreezeColumn}
          onFreezeRow={onFreezeRow}
          onUpdateNote={onUpdateNote}
          onSortRange={onSortRange}
          onProtectRange={onProtectRange}
          onUnProtectRange={onUnProtectRange}
          namedRanges={namedRanges}
          licenseKey={process.env.DOCS_SHEETS_KEY}
          onRequestSearch={onRequestSearch}
          users={users}
          userId={userName}
          getChartComponent={(props) => (
            <ChartComponent
              {...props}
              getSeriesValuesFromRange={getSeriesValuesFromRange}
              getDomainValuesFromRange={getDomainValuesFromRange}
              onRequestEdit={!isRevisionMode ? onRequestEditChart : undefined}
              onRequestCalculate={onRequestCalculate}
              readonly={isRevisionMode}
            />
          )}
          readonly={isRevisionMode}
        />
        <ChartEditorDialog>
          <ChartEditor sheetId={activeSheetId} chart={selectedChart} onSubmit={onUpdateChart} />
        </ChartEditorDialog>
        <BottomBar>
          {!isRevisionMode && <NewSheetButton onClick={onCreateNewSheet} />}
          <SheetSwitcher
            sheets={sheets}
            activeSheetId={activeSheetId}
            onChangeActiveSheet={onChangeActiveSheet}
            onShowSheet={onShowSheet}
          />
          <SheetTabs
            sheets={sheets}
            protectedRanges={protectedRanges}
            activeSheetId={activeSheetId}
            theme={theme}
            onChangeActiveSheet={onChangeActiveSheet}
            onRenameSheet={onRenameSheet}
            onChangeSheetTabColor={onChangeSheetTabColor}
            onDeleteSheet={onRequestDeleteSheet}
            onHideSheet={onHideSheet}
            onMoveSheet={onMoveSheet}
            onProtectSheet={onProtectSheet}
            onUnProtectSheet={onUnProtectSheet}
            onDuplicateSheet={onDuplicateSheet}
            readonly={isRevisionMode}
          />
          <SheetStatus
            sheetId={activeSheetId}
            activeCell={activeCell}
            selections={selections}
            onRequestCalculate={onRequestCalculate}
            rowCount={rowCount}
            columnCount={columnCount}
            merges={merges}
          />
        </BottomBar>
        <TableEditor sheetId={activeSheetId} onSubmit={onUpdateTable} theme={theme} />
        <DeleteSheetConfirmation sheetId={activeSheetId} onDeleteSheet={onDeleteSheet} />
        <NamedRangeEditor
          sheetId={activeSheetId}
          onCreateNamedRange={onCreateNamedRange}
          onUpdateNamedRange={onUpdateNamedRange}
        />
        <SheetSearch
          isActive={isSearchActive}
          onSubmit={onSearch}
          onReset={onResetSearch}
          onNext={onFocusNextResult}
          onPrevious={onFocusPreviousResult}
          disableNext={!hasNextResult}
          disablePrevious={!hasPreviousResult}
          currentResult={currentResult}
          totalResults={totalResults}
          searchQuery={searchQuery}
        />
      </div>
    </>
  )
})
