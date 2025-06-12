/* eslint-disable monorepo-cop/no-relative-import-outside-package */

import type { ForwardedRef } from 'react'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import type { useSpreadsheetState } from '@rowsncolumns/spreadsheet-state'
import {
  CellFormatEditor,
  CellFormatEditorDialog,
  ConditionalFormatDialog,
  ConditionalFormatEditor,
  DataValidationEditor,
  DataValidationEditorDialog,
  DeleteSheetConfirmation,
  NamedRangeEditor,
  pattern_currency_decimal,
  pattern_percent_decimal,
  TableEditor,
} from '@rowsncolumns/spreadsheet-state'
import {
  ButtonInsertChart,
  CanvasGrid,
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
import { ChartComponent, ChartEditor, ChartEditorDialog } from '@rowsncolumns/charts'
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
import { functionDescriptions, functions } from '@rowsncolumns/functions'
import { MagnifyingGlassIcon, DownloadIcon, ImageIcon } from '@rowsncolumns/icons'
import { createCSVFromSheetData, createExcelFile } from '@rowsncolumns/toolkit'
import type {
  EditorInitializationConfig,
  DocStateInterface,
  SheetImportData,
  DataTypesThatDocumentCanBeExportedAs,
} from '@proton/docs-shared'
import { EditorSystemMode, SheetImportDestination, SheetImportEvent } from '@proton/docs-shared'
import { DocProvider, TranslatedResult } from '@proton/docs-shared'
import { useYSpreadsheetV2 } from '@rowsncolumns/y-spreadsheet'
import { useSyncedState } from '../../Hooks/useSyncedState'
import '@rowsncolumns/spreadsheet/dist/spreadsheet.min.css'
import type { EditorLoadResult } from '../../Lib/EditorLoadResult'
import { SupportedProtonDocsMimeTypes } from '@proton/shared/lib/drive/constants'
import { useApplication } from '../ApplicationProvider'
import { downloadLogsAsJSON } from '../../../../../docs/src/app/utils/downloadLogs'
import type { EditorControllerInterface } from '@proton/docs-core'
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding'
import { splitExtension } from '@proton/shared/lib/helpers/file'
import { c } from 'ttag'
import { useLogState, useProtonSheetsState } from './state'

const CURRENCY = 'USD'
const LOCALE = 'en-GB'

export type SpreadsheetRef = {
  exportData: (format: DataTypesThatDocumentCanBeExportedAs) => Promise<Uint8Array>
}

export type SpreadsheetProps = {
  docState: DocStateInterface
  hidden: boolean
  onEditorLoadResult: EditorLoadResult
  editorInitializationConfig: EditorInitializationConfig | undefined
  systemMode: EditorSystemMode
  editingLocked: boolean
  updateLatestStateToLog: (state: unknown) => void
}

export const Spreadsheet = forwardRef(function Spreadsheet(
  {
    docState,
    hidden,
    onEditorLoadResult,
    editorInitializationConfig,
    systemMode,
    editingLocked,
    updateLatestStateToLog,
  }: SpreadsheetProps,
  ref: ForwardedRef<SpreadsheetRef>,
) {
  const { application } = useApplication()
  const { userName } = useSyncedState()

  const didImportFromExcelFile = useRef(false)
  const yDoc = useMemo(() => docState.getDoc(), [docState])

  const isRevisionMode = systemMode === EditorSystemMode.Revision
  const isReadonly = editingLocked || isRevisionMode

  const state = useProtonSheetsState({
    locale: LOCALE,
    functions,
    onChangeHistory(patches) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      onBroadcastPatch(patches)
    },
  })
  const { getStateToLog } = useLogState(state, updateLatestStateToLog)

  const exportData = async (format: DataTypesThatDocumentCanBeExportedAs) => {
    if (format === 'yjs') {
      return docState.getDocState()
    } else if (format === 'xlsx') {
      const buffer = await createExcelFile(state)
      return new Uint8Array(buffer)
    } else if (format === 'csv') {
      const csv = createCSVFromSheetData(state.sheetData[state.activeSheetId])
      return stringToUint8Array(csv)
    } else if (format === 'tsv') {
      const tsv = createCSVFromSheetData(state.sheetData[state.activeSheetId], {
        delimiter: '\t',
      })
      return stringToUint8Array(tsv)
    }
    throw new Error(`Spreadsheet cannot be export to format ${format}`)
  }
  useImperativeHandle(ref, () => ({ exportData }))

  const provider = useMemo(() => {
    const provider = new DocProvider(docState)
    // useYSpreadsheet checks for either a "synced" event from the provider
    // or for a true `synced` property before it starts listening to changes
    // to the doc
    provider.synced = true
    return provider
  }, [docState])

  const { users, onBroadcastPatch } = useYSpreadsheetV2({
    ...state,

    provider,
    doc: yDoc,
    sheetId: state.activeSheetId,
    initialSheets: [],

    // User info
    userId: userName,
    title: userName,
  })

  useEffect(() => {
    onEditorLoadResult(TranslatedResult.ok())
  }, [onEditorLoadResult])

  const { onInsertFile } = state
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
  }, [editorInitializationConfig, onInsertFile])

  const { onCreateNewSheet, onRenameSheet, calculateNow } = state
  useEffect(
    () =>
      application.eventBus.addEventCallback((data: SheetImportData) => {
        let sheetId = undefined
        let cellCoords = undefined
        if (data.destination === SheetImportDestination.InsertAsNewSheet) {
          const newSheet = onCreateNewSheet()
          if (!newSheet) {
            return
          }
          const [name] = splitExtension(data.file.name)
          onRenameSheet(newSheet.sheetId, name, newSheet.title)
          sheetId = newSheet.sheetId
          cellCoords = { rowIndex: 1, columnIndex: 1 }
        }
        onInsertFile(data.file, sheetId, cellCoords, {
          preserveFormatting: data.shouldConvertCellContents,
          replaceSheetData: data.destination === SheetImportDestination.ReplaceCurrentSheet,
        })
          .then(() => {
            calculateNow({
              shouldResetCellDependencyGraph: true,
            })
          })
          .catch(console.error)
      }, SheetImportEvent),
    [application.eventBus, calculateNow, onCreateNewSheet, onInsertFile, onRenameSheet],
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

  const handleDownloadLogs = () => {
    const editorAdapter = {
      async getYDocAsJSON() {
        return docState.getDoc().toJSON()
      },
      async getLatestSpreadsheetStateToLogJSON() {
        return getStateToLog()
      },
    } as Pick<EditorControllerInterface, 'getYDocAsJSON' | 'getLatestSpreadsheetStateToLogJSON'>

    downloadLogsAsJSON(editorAdapter as EditorControllerInterface, 'sheet').catch(console.error)
  }

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
              onClick={() =>
                state.onChangeDecimals(state.activeSheetId, state.activeCell, state.selections, 'decrement')
              }
            />
            <ButtonIncreaseDecimal
              onClick={() =>
                state.onChangeDecimals(state.activeSheetId, state.activeCell, state.selections, 'increment')
              }
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
                state.onChangeFormatting(
                  state.activeSheetId,
                  state.activeCell,
                  state.selections,
                  'backgroundColor',
                  color,
                )
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

            <InsertImageMenu onInsertFile={onInsertFile} />
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
              <IconButton onClick={handleDownloadLogs}>
                <DownloadIcon />
              </IconButton>
            </SimpleTooltip>
          </Toolbar>
        )}
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
        <CanvasGrid
          {...state.spreadsheetColors}
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
        />
        <ChartEditorDialog>
          <ChartEditor
            sheetId={state.activeSheetId}
            chart={state.chartsState.selectedChart}
            onSubmit={state.chartsState.onUpdateChart}
          />
        </ChartEditorDialog>
        <BottomBar>
          {!isRevisionMode && <NewSheetButton onClick={onCreateNewSheet} disabled={isReadonly} />}
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
        </BottomBar>
        <ConditionalFormatDialog>
          <ConditionalFormatEditor
            sheetId={state.activeSheetId}
            theme={state.theme}
            conditionalFormats={state.conditionalFormats}
            functionDescriptions={functionDescriptions}
            onCreateRule={state.onCreateConditionalFormattingRule}
            onDeleteRule={state.onDeleteConditionalFormattingRule}
            onUpdateRule={state.onUpdateConditionalFormattingRule}
            onPreviewRule={state.onPreviewConditionalFormattingRule}
          />
        </ConditionalFormatDialog>
        <TableEditor sheetId={state.activeSheetId} onSubmit={state.onUpdateTable} theme={state.theme} />
        <DeleteSheetConfirmation sheetId={state.activeSheetId} onDeleteSheet={state.onDeleteSheet} />
        <NamedRangeEditor
          sheetId={state.activeSheetId}
          onCreateNamedRange={state.onCreateNamedRange}
          onUpdateNamedRange={state.onUpdateNamedRange}
        />
        <SheetSearch
          isActive={state.searchState.isSearchActive}
          onSubmit={state.searchState.onSearch}
          onReset={state.searchState.onResetSearch}
          onNext={state.searchState.onFocusNextResult}
          onPrevious={state.searchState.onFocusPreviousResult}
          disableNext={!state.searchState.hasNextResult}
          disablePrevious={!state.searchState.hasPreviousResult}
          currentResult={state.searchState.currentResult}
          totalResults={state.searchState.totalResults}
          searchQuery={state.searchState.searchQuery}
        />
        <DataValidationEditorDialog>
          <DataValidationEditor
            dataValidations={state.dataValidations}
            sheetId={state.activeSheetId}
            functionDescriptions={functionDescriptions}
            onDeleteRules={state.onDeleteDataValidationRules}
            onDeleteRule={state.onDeleteDataValidationRule}
            onCreateRule={state.onCreateDataValidationRule}
            onUpdateRule={state.onUpdateDataValidationRule}
          />
        </DataValidationEditorDialog>
        <CellFormatEditorDialog>
          <CellFormatEditor
            sheetId={state.activeSheetId}
            activeCell={state.activeCell}
            selections={state.selections}
            onChangeFormatting={state.onChangeFormatting}
            cellFormat={state.currentCellFormat}
            getEffectiveValue={state.getEffectiveValue}
            onMergeCells={state.onMergeCells}
            theme={state.theme}
            onChangeBorder={state.onChangeBorder}
          />
        </CellFormatEditorDialog>
      </div>
    </>
  )
})

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
