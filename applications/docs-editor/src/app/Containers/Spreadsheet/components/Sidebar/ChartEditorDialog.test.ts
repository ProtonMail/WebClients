import type { EmbeddedChart } from '@rowsncolumns/spreadsheet'
import { mergeChartEditorChanges } from './chartData'

describe('mergeChartEditorChanges', () => {
  it('preserves the latest chart position when saving form changes', () => {
    const currentChart = {
      chartId: 'chart-1',
      position: { sheetId: 1, overlayPosition: { anchorCell: { rowIndex: 2, columnIndex: 8 } } },
      spec: { chartType: 'pie', title: 'Old title', series: [], domains: [] },
    } as EmbeddedChart
    const formChart = {
      ...currentChart,
      position: { sheetId: 1, overlayPosition: { anchorCell: { rowIndex: 2, columnIndex: 1 } } },
      spec: { ...currentChart.spec, title: 'New title' },
    } as EmbeddedChart

    expect(mergeChartEditorChanges(currentChart, formChart)).toEqual({
      ...currentChart,
      spec: formChart.spec,
    })
  })
})
