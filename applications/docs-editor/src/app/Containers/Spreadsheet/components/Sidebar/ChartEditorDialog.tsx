/* eslint-disable no-nested-ternary */

import {
  FormulaInput,
  type SheetRange,
  useFormulaRangeHelpers,
  type EmbeddedChart,
  type ChartData,
  type ChartSpec,
  type ChartAggregateType,
} from '@rowsncolumns/spreadsheet'
import { defaultCellCoords } from '@rowsncolumns/spreadsheet-state'
import { useChartEditorDialogState } from '@rowsncolumns/charts'
import { SidebarDialog, SidebarDialogHeader } from './SidebarDialog'
import { Button, FormCheckbox, FormGroup, FormLabel, Input, Select, SelectItem, SelectPopover } from './shared'
import * as Ariakit from '@ariakit/react'
import {
  AGGREGATE_OPTIONS,
  CHART_TYPES,
  type ChartDataFormula,
  getBaseChartSpecData,
  getChartTypeByName,
  getChartTypeBySpec,
  isBasicChartSpec,
} from './chartData'
import clsx from '@proton/utils/clsx'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { useUI } from '../../ui-store'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { uuid } from '@rowsncolumns/utils'
import { c } from 'ttag'
import { createStringifier } from '../../stringifier'
import { Icon } from '../ui'
import { useEvent } from '../utils'
import debounce from 'lodash/debounce'

const { s } = createStringifier(strings)

interface ChartEditorProps {
  chart: EmbeddedChart
  onDone: () => void
}

function ChartEditor({ chart, onDone }: ChartEditorProps) {
  const form = useForm({ defaultValues: chart })
  const { subscribe, handleSubmit } = form
  const formValue = form.watch()
  const sheetId = useUI((ui) => ui.legacy.activeSheetId)
  const updateChart = useUI((ui) => ui.charts.update)
  const { rangeToFormula, formulaToRange } = useFormulaRangeHelpers({
    sheetId,
  })

  const _saveChanges = useEvent((data: EmbeddedChart) => {
    updateChart(data)
  })
  const saveChanges = useMemo(() => debounce(_saveChanges, 250), [_saveChanges])

  useEffect(() => {
    return subscribe({
      formState: { values: true },
      callback() {
        handleSubmit((data) => {
          saveChanges(data)
        })()
          .then(() => {})
          .catch(() => {})
      },
    })
  }, [subscribe, handleSubmit, saveChanges])

  const chartDataToFormula = useCallback(
    (data?: ChartData[]): ChartDataFormula[] => {
      if (!data) {
        return []
      }
      return data.map((item) => {
        return {
          ...item,
          sources: item.sources.map((source) => {
            return rangeToFormula(source)
          }),
        }
      })
    },
    [rangeToFormula],
  )

  const dataRangeFormula = useMemo(() => {
    const dataRange = formValue.spec?.dataRange
    if (dataRange) {
      return rangeToFormula(dataRange)
    }

    return `=`
  }, [formValue.spec?.dataRange, rangeToFormula])

  const basicSpec = isBasicChartSpec(formValue.spec) ? formValue.spec : undefined

  const horizontalAxisFormula = useMemo(() => {
    if (!basicSpec) {
      return []
    }
    return chartDataToFormula(basicSpec.domains)
  }, [basicSpec, chartDataToFormula])
  const seriesFormula = basicSpec ? chartDataToFormula(basicSpec.series) : []

  const selectedChartType = getChartTypeBySpec(formValue.spec)
  const isAggregateType = basicSpec ? basicSpec.series.some((serie: ChartData) => serie.aggregateType) : false

  const onSubmit: SubmitHandler<EmbeddedChart> = (data) => {
    saveChanges(data)
  }

  return (
    <form className="flex min-h-0 grow flex-col" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grow overflow-y-auto px-4">
        <div className="py-4">
          <div className="flex flex-col gap-4">
            <FormGroup>
              <FormLabel className="text-sm font-semibold">{s('Chart type')}</FormLabel>
              <Ariakit.SelectProvider
                value={selectedChartType?.name}
                setValue={(value: string) => {
                  const chartType = getChartTypeByName(value)
                  // if (chartType) {
                  //   form.setValue(
                  //     'spec',
                  //     mergeChartSpecWithConfig(
                  //       formValue.spec,
                  //       chartType.spec as Partial<EmbeddedChart['spec']>,
                  //     ) as ChartSpec,
                  //   )
                  // }

                  if (chartType) {
                    form.setValue('spec', {
                      ...getBaseChartSpecData(formValue.spec),
                      ...chartType.spec,
                    } as ChartSpec)
                  }
                }}
              >
                <Select />
                <SelectPopover sameWidth className="py-2">
                  {CHART_TYPES.map(([category, types]) => {
                    return (
                      <Ariakit.SelectGroup key={category} className="px-3 py-2">
                        <Ariakit.SelectGroupLabel className="mb-1 text-xs">{category}</Ariakit.SelectGroupLabel>
                        <Ariakit.SelectRow className="grid grid-cols-3 gap-2.5">
                          {types.map(({ name, icon }) => {
                            return (
                              <Ariakit.SelectItem
                                key={name}
                                value={name}
                                className={clsx(
                                  'cursor-pointer rounded border border-[#EAE7E4] !outline-none transition',
                                  'data-[active-item]:border-[#D1CFCD] data-[active-item]:bg-[#C2C1C033]',
                                  'aria-selected:border-[#D1CFCD] aria-selected:bg-[#C2C0BE59]',
                                  'aria-selected:data-[active-item]:border-[#D1CFCD] aria-selected:data-[active-item]:bg-[#C2C0BE59]',
                                  'data-[focus-visible]:!border-[#6D4AFF] data-[focus-visible]:ring-[3px] data-[focus-visible]:ring-[#6D4AFF33]',
                                )}
                              >
                                <Ariakit.VisuallyHidden>{name}</Ariakit.VisuallyHidden>
                                {icon}
                              </Ariakit.SelectItem>
                            )
                          })}
                        </Ariakit.SelectRow>
                      </Ariakit.SelectGroup>
                    )
                  })}
                </SelectPopover>
              </Ariakit.SelectProvider>
            </FormGroup>

            <FormGroup>
              <FormLabel>{s('Chart title')}</FormLabel>
              <Input
                value={formValue?.spec.title ?? ''}
                onChange={(e) => form.setValue('spec.title', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <FormLabel>{s('Chart data range')}</FormLabel>
              <div className="flex items-center">
                <FormulaInput
                  onChange={(value) => {
                    form.setValue('spec.dataRange', formulaToRange(value) as SheetRange | undefined)
                  }}
                  value={dataRangeFormula}
                  required
                  placeholder={s('Select a range')}
                  autoFocus
                  className="mb-0 w-full"
                />
              </div>
            </FormGroup>

            {basicSpec ? (
              <Fragment>
                <FormGroup>
                  <Ariakit.CheckboxProvider
                    value={isAggregateType}
                    setValue={(checked) => {
                      const nextSeries = basicSpec.series.map((serie: ChartData) => ({
                        ...serie,
                        aggregateType: checked ? 'SUM' : undefined,
                      }))
                      form.setValue('spec.series', nextSeries as ChartData[])
                    }}
                  >
                    <FormCheckbox>{s('Aggregate')}</FormCheckbox>
                  </Ariakit.CheckboxProvider>
                </FormGroup>

                <FormGroup className="border-y border-[black]/[.1] py-3">
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel>{s('Value')}</FormLabel>
                    <Button
                      type="button"
                      className="shrink-0 rounded px-2 py-1 text-xs text-[#6D4AFF]"
                      onClick={() => {
                        const nextSeries = basicSpec.series
                        const lastSeries = nextSeries[nextSeries.length - 1]
                        form.setValue('spec.series', [
                          ...nextSeries,
                          {
                            sources: lastSeries
                              ? lastSeries.sources
                              : formValue.spec.dataRange
                                ? [formValue.spec.dataRange]
                                : [],
                            dataLabel: '',
                          },
                        ] as ChartData[])
                      }}
                    >
                      {s('Add')}
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {seriesFormula.map((domain, domainIdx) => {
                      return domain.sources.map((source, sourceIdx) => {
                        return (
                          <div key={`${domainIdx}-${sourceIdx}`} className="flex flex-col gap-2">
                            <FormGroup>
                              <div className="flex items-center justify-between gap-2">
                                <Ariakit.Role.label className="text-[0.8125rem] text-[#5C5958]">
                                  {s('Series')} {domainIdx + 1}
                                </Ariakit.Role.label>

                                <Button
                                  type="button"
                                  className="inline-flex size-6 items-center justify-center"
                                  onClick={() => {
                                    const currentSeries = basicSpec.series
                                    form.setValue(
                                      'spec.series',
                                      currentSeries.filter((_, seriesIndex) => seriesIndex !== domainIdx),
                                    )
                                  }}
                                >
                                  <Icon legacyName="trash" />
                                </Button>
                              </div>
                              <Input
                                placeholder={s('Enter title')}
                                value={domain.dataLabel ?? ''}
                                onChange={(e) => form.setValue(`spec.series.${domainIdx}.dataLabel`, e.target.value)}
                              />
                            </FormGroup>

                            <FormGroup>
                              <div className="flex items-center">
                                <FormulaInput
                                  key={`${domainIdx}-${sourceIdx}-series`}
                                  value={source}
                                  onChange={(value) => {
                                    form.setValue(
                                      `spec.series.${domainIdx}.sources.${sourceIdx}`,
                                      formulaToRange(value) as SheetRange,
                                    )
                                  }}
                                  required
                                  placeholder={s('Select a range')}
                                  autoFocus
                                  className="mb-0 w-full"
                                />
                              </div>
                            </FormGroup>

                            {isAggregateType ? (
                              <FormGroup>
                                <Ariakit.SelectProvider
                                  value={domain.aggregateType ?? ''}
                                  setValue={(value) => {
                                    const aggregateType = value as ChartAggregateType | ''
                                    form.setValue(`spec.series.${domainIdx}.aggregateType`, aggregateType || undefined)
                                  }}
                                >
                                  <Select />
                                  <SelectPopover sameWidth>
                                    <Ariakit.SelectGroup className="py-2">
                                      <SelectItem value="">None</SelectItem>
                                      {AGGREGATE_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </Ariakit.SelectGroup>
                                  </SelectPopover>
                                </Ariakit.SelectProvider>
                              </FormGroup>
                            ) : null}
                          </div>
                        )
                      })
                    })}
                  </div>
                </FormGroup>

                <FormGroup>
                  <FormLabel>{s('Horizontal (category) axis labels')}</FormLabel>
                  {horizontalAxisFormula.map((domain, domainIndex) => {
                    return domain.sources.map((source, sourceIdx) => {
                      return (
                        <div key={sourceIdx} className="flex items-center">
                          <FormulaInput
                            value={source}
                            onChange={(value) => {
                              form.setValue(
                                `spec.domains.${domainIndex}.sources.${sourceIdx}`,
                                formulaToRange(value) as SheetRange,
                              )
                            }}
                            required
                            placeholder={s('Select a range')}
                            autoFocus
                            className="mb-0 w-full"
                          />
                        </div>
                      )
                    })
                  })}
                </FormGroup>

                <FormGroup>
                  <FormLabel>{s('Vertical axis title')}</FormLabel>
                  <Input
                    value={formValue?.spec.verticalAxisTitle ?? ''}
                    onChange={(e) => form.setValue(`spec.verticalAxisTitle`, e.target.value)}
                    placeholder={s('Vertical axis title')}
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel>{s('Horizontal axis title')}</FormLabel>
                  <Input
                    value={formValue?.spec.horizontalAxisTitle ?? ''}
                    onChange={(e) => form.setValue(`spec.horizontalAxisTitle`, e.target.value)}
                    placeholder={s('Horizontal axis title')}
                  />
                </FormGroup>

                <FormGroup>
                  <Ariakit.CheckboxProvider
                    value={formValue.spec.hiddenDimensionStrategy === 'SHOW_ALL'}
                    setValue={(checked) => {
                      form.setValue(
                        'spec.hiddenDimensionStrategy',
                        checked ? 'SHOW_ALL' : 'SKIP_HIDDEN_ROWS_AND_COLUMNS',
                      )
                    }}
                  >
                    <FormCheckbox>{s('Show data in hidden rows and columns')}</FormCheckbox>
                  </Ariakit.CheckboxProvider>
                </FormGroup>
              </Fragment>
            ) : null}
          </div>
        </div>
      </div>
    </form>
  )
}

// We determine if a chart has been deleted by checking if its ID is still present
// in the list of charts in the UI state. Technically not foolproof, but sufficient
// for our use case here.
function isChartDeleted(charts: EmbeddedChart[], chartId: EmbeddedChart['chartId']) {
  return !charts.some((chart) => chart.chartId === chartId)
}

function ChartEditorRoot() {
  const [open, setOpen] = useChartEditorDialogState()
  const selectedChart = useUI((ui) => ui.charts.selected)
  const sheetId = useUI((ui) => ui.legacy.activeSheetId)
  const charts = useUI((ui) => ui.legacy.charts)

  const [defaultChart] = useState<EmbeddedChart>(() => ({
    chartId: uuid(),
    position: {
      sheetId,
      overlayPosition: { anchorCell: defaultCellCoords },
    },
    spec: { chartType: 'line', series: [], domains: [] },
  }))
  const chart = selectedChart || defaultChart

  // Close the dialog if the selected chart has been deleted
  // This can happen if the user deletes the chart while the editor is open
  // We check for chart deletion by verifying if the chart ID is still present in the charts list
  // in the UI state
  if (chart === selectedChart && open && isChartDeleted(charts, selectedChart.chartId)) {
    setOpen(false)
  }

  return <ChartEditor key={chart.chartId} chart={chart} onDone={() => setOpen(false)} />
}

export function ChartEditorDialog() {
  const [open, setOpen] = useChartEditorDialogState()

  return (
    <SidebarDialog open={open} setOpen={setOpen}>
      <div className="flex h-full min-h-0 flex-col">
        <SidebarDialogHeader title={s('Chart editor')} />
        <ChartEditorRoot />
      </div>
    </SidebarDialog>
  )
}

function strings() {
  return {
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
  }
}
