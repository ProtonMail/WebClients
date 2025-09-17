import {
  CellFormatEditor,
  CellFormatEditorDialog,
  ConditionalFormatDialog,
  ConditionalFormatEditor,
  DataValidationEditor,
  DataValidationEditorDialog,
  DeleteSheetConfirmation,
  InsertLinkDialog,
  InsertLinkEditor,
  NamedRangeEditor,
  TableEditor,
} from '@rowsncolumns/spreadsheet-state'
import type { ProtonSheetsState } from '../../state'
import { functionDescriptions } from '@rowsncolumns/functions'
import { SheetSearch } from '@rowsncolumns/spreadsheet'
import { ChartEditor, ChartEditorDialog } from '@rowsncolumns/charts'

export type LegacyDialogsProps = {
  state: ProtonSheetsState
}

export function LegacyDialogs({ state }: LegacyDialogsProps) {
  return (
    <>
      <ChartEditorDialog>
        <ChartEditor
          sheetId={state.activeSheetId}
          chart={state.chartsState.selectedChart}
          onSubmit={state.chartsState.onUpdateChart}
        />
      </ChartEditorDialog>
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
      <InsertLinkDialog>
        <InsertLinkEditor
          sheetId={state.activeSheetId}
          activeCell={state.activeCell}
          selections={state.selections}
          onInsertLink={state.onInsertLink}
        />
      </InsertLinkDialog>
    </>
  )
}
