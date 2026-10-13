import { c } from 'ttag'
import type { SheetsMessages } from '../../../Spreadsheet/public'

export function createChartsMessages(): Pick<SheetsMessages, 'chartEditorDialog' | 'chartTypes' | 'chartAggregates'> {
  return {
    chartEditorDialog: {
      seriesLabel: (seriesNumber) => c('sheets_2025:Spreadsheet sidebar chart editor dialog').t`Series ${seriesNumber}`,
      seriesNameLabel: (seriesNumber) =>
        c('sheets_2025:Spreadsheet sidebar chart editor dialog').t`Series ${seriesNumber} Name`,
      seriesRangeLabel: (seriesNumber) =>
        c('sheets_2025:Spreadsheet sidebar chart editor dialog').t`Series ${seriesNumber} Range`,
      seriesAggregateLabel: (seriesNumber) =>
        c('sheets_2025:Spreadsheet sidebar chart editor dialog').t`Series ${seriesNumber} Aggregate`,

      'Chart editor': c('sheets_2025:Spreadsheet sidebar chart editor dialog').t`Chart editor`,
      'Chart type': c('sheets_2025:Spreadsheet sidebar chart editor dialog').t`Chart type`,
      'Chart title': c('sheets_2025:Spreadsheet sidebar chart editor dialog').t`Chart title`,
      'Select a range': c('sheets_2025:Spreadsheet sidebar chart editor dialog').t`Select a range`,
      'Chart data range': c('sheets_2025:Spreadsheet sidebar chart editor dialog').t`Chart data range`,
      Series: c('sheets_2025:Spreadsheet sidebar chart editor dialog').t`Series`,
      Add: c('sheets_2025:Spreadsheet sidebar chart editor dialog').t`Add`,
      Name: c('sheets_2025:Spreadsheet sidebar chart editor dialog').t`Name`,
      Save: c('sheets_2025:Spreadsheet sidebar chart editor dialog').t`Save`,
      Cancel: c('sheets_2025:Spreadsheet sidebar chart editor dialog').t`Cancel`,
      Range: c('sheets_2025:Spreadsheet sidebar chart editor dialog').t`Range`,
      'Horizontal (category) axis labels': c('sheets_2025:Spreadsheet sidebar chart editor dialog')
        .t`Horizontal (category) axis labels`,
      'Vertical axis title': c('sheets_2025:Spreadsheet sidebar chart editor dialog').t`Vertical axis title`,
      'Horizontal axis title': c('sheets_2025:Spreadsheet sidebar chart editor dialog').t`Horizontal axis title`,
      'Show data in hidden rows and columns': c('sheets_2025:Spreadsheet sidebar chart editor dialog')
        .t`Show data in hidden rows and columns`,
      Aggregate: c('sheets_2025:Spreadsheet sidebar chart editor dialog').t`Aggregate`,
      Value: c('sheets_2025:Spreadsheet sidebar chart editor dialog').t`Value`,
      'Enter title': c('sheets_2025:Spreadsheet sidebar chart editor dialog').t`Enter title`,

      None: c('sheets_2025:Spreadsheet chartEditorDialog').t`None`,
    },
    chartTypes: {
      'Clustered Column': c('sheets_2025:Spreadsheet chartTypes').t`Clustered Column`,
      'Stacked column': c('sheets_2025:Spreadsheet chartTypes').t`Stacked column`,
      Line: c('sheets_2025:Spreadsheet chartTypes').t`Line`,
      'Stacked line': c('sheets_2025:Spreadsheet chartTypes').t`Stacked line`,
      'Smooth line': c('sheets_2025:Spreadsheet chartTypes').t`Smooth line`,
      '2D Pie': c('sheets_2025:Spreadsheet chartTypes').t`2D Pie`,
      Doughnut: c('sheets_2025:Spreadsheet chartTypes').t`Doughnut`,
      Treemap: c('sheets_2025:Spreadsheet chartTypes').t`Treemap`,
      Sunburst: c('sheets_2025:Spreadsheet chartTypes').t`Sunburst`,
      Column: c('sheets_2025:Spreadsheet chartTypes').t`Column`,
      Pie: c('sheets_2025:Spreadsheet chartTypes').t`Pie`,
      Hierarchy: c('sheets_2025:Spreadsheet chartTypes').t`Hierarchy`,
    },
    chartAggregates: {
      SUM: c('sheets_2025:Spreadsheet chartAggregates').t`Sum`,
      AVERAGE: c('sheets_2025:Spreadsheet chartAggregates').t`Average`,
      COUNT: c('sheets_2025:Spreadsheet chartAggregates').t`Count`,
      MEDIAN: c('sheets_2025:Spreadsheet chartAggregates').t`Median`,
      MIN: c('sheets_2025:Spreadsheet chartAggregates').t`Min`,
      MAX: c('sheets_2025:Spreadsheet chartAggregates').t`Max`,
    },
  }
}
