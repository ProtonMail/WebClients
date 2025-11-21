import {
  FormulaInput,
  type SheetRange,
  useFormulaRangeHelpers,
  type EmbeddedChart,
  type ChartData,
  type ChartSpec,
} from '@rowsncolumns/spreadsheet'
import { defaultCellCoords } from '@rowsncolumns/spreadsheet-state'
import { useChartEditorDialogState } from '@rowsncolumns/charts'
import { SidebarDialog, SidebarDialogHeader } from './SidebarDialog'
import { Button, FormCheckbox, FormGroup, FormLabel, Input, Select, SelectPopover } from './shared'
import * as Ariakit from '@ariakit/react'
import { CHART_TYPES, getBaseChartSpecData, getChartTypeByName, getChartTypeBySpec } from './chartData'
import clsx from '@proton/utils/clsx'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { useUI } from '../../ui-store'
import { useEffect, useMemo, useState } from 'react'
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

  const dataRangeFormula = useMemo(() => {
    const dataRange = formValue.spec?.dataRange
    if (dataRange) {
      return rangeToFormula(dataRange)
    }

    return `=`
  }, [formValue.spec?.dataRange, rangeToFormula])

  const horizontalAxisFormula = useMemo(() => {
    const domains = formValue.spec?.domains
    if (domains) {
      return domains.map((domain) => {
        return {
          ...domain,
          sources: domain.sources.map((source) => rangeToFormula(source)),
        }
      })
    }

    return []
  }, [formValue.spec?.domains, rangeToFormula])

  const seriesFormula = useMemo(() => {
    const domains = formValue.spec?.series
    if (domains) {
      return domains.map((domain) => {
        return {
          ...domain,
          sources: domain.sources.map((source) => {
            return rangeToFormula(source)
          }),
        }
      })
    }

    return []
  }, [formValue.spec?.series, rangeToFormula])

  const selectedChartType = getChartTypeBySpec(formValue.spec)

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

            <FormGroup>
              <div className="flex items-center justify-between gap-2">
                <FormLabel>{s('Series')}</FormLabel>
                <Button
                  type="button"
                  className="shrink-0 rounded px-2 py-1 text-xs text-[#6D4AFF]"
                  onClick={() => {
                    const lastSeries = formValue.spec.series[formValue.spec.series.length - 1]
                    form.setValue('spec.series', [
                      ...formValue.spec.series,
                      {
                        sources: lastSeries ? lastSeries.sources : [formValue.spec.dataRange],
                      },
                    ] as ChartData[])
                  }}
                >
                  {s('Add')}
                </Button>
              </div>
              <div>
                {seriesFormula.map((domain, domainIdx) => {
                  return (
                    <div key={domainIdx} className="flex flex-col gap-2 border-b border-[black]/[0.12] py-4 first:pt-0">
                      <FormGroup>
                        <div className="flex items-center justify-between gap-2">
                          <Ariakit.Role.label className="text-[0.8125rem] text-[#5C5958]">
                            {s('Name')} ({s('Series')} {domainIdx + 1})
                          </Ariakit.Role.label>

                          <Button
                            type="button"
                            className="inline-flex size-6 items-center justify-center"
                            onClick={() => {
                              form.setValue(
                                'spec.series',
                                formValue.spec.series.filter((_, i) => i !== domainIdx),
                              )
                            }}
                          >
                            <Icon legacyName="trash" />
                          </Button>
                        </div>
                        <Input
                          placeholder={s('Name')}
                          value={formValue.spec.series[domainIdx].dataLabel ?? ''}
                          onChange={(e) => form.setValue(`spec.series.${domainIdx}.dataLabel`, e.target.value)}
                        />
                      </FormGroup>

                      {domain.sources.map((source, sourceIdx) => {
                        return (
                          <FormGroup key={sourceIdx}>
                            <Ariakit.Role.label className="text-[0.8125rem] text-[#5C5958]">
                              {s('Range')}
                            </Ariakit.Role.label>
                            <div className="flex items-center">
                              <FormulaInput
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
                        )
                      })}
                    </div>
                  )
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
                  form.setValue('spec.hiddenDimensionStrategy', checked ? 'SHOW_ALL' : 'SKIP_HIDDEN_ROWS_AND_COLUMNS')
                }}
              >
                <FormCheckbox>{s('Show data in hidden rows and columns')}</FormCheckbox>
              </Ariakit.CheckboxProvider>
            </FormGroup>
          </div>
        </div>
      </div>
    </form>
  )
}

interface ChartEditorRootProps {
  onDone: () => void
}

function ChartEditorRoot({ onDone }: ChartEditorRootProps) {
  const selectedChart = useUI((ui) => ui.charts.selected)
  const sheetId = useUI((ui) => ui.legacy.activeSheetId)

  const [defaultChart] = useState<EmbeddedChart>(() => ({
    chartId: uuid(),
    position: {
      sheetId,
      overlayPosition: { anchorCell: defaultCellCoords },
    },
    spec: { chartType: 'line', series: [], domains: [] },
  }))
  const chart = selectedChart || defaultChart

  return <ChartEditor key={chart.chartId} chart={chart} onDone={onDone} />
}

export function ChartEditorDialog() {
  const [open, setOpen] = useChartEditorDialogState()

  return (
    <SidebarDialog open={open} setOpen={setOpen}>
      <div className="flex h-full min-h-0 flex-col">
        <SidebarDialogHeader title={s('Chart editor')} />
        <ChartEditorRoot onDone={() => setOpen(false)} />
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
  }
}
