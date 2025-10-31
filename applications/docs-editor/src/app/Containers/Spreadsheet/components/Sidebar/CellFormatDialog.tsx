import * as Ariakit from '@ariakit/react'
import { useFormatCellsDialogState, type useSpreadsheetState } from '@rowsncolumns/spreadsheet-state'
import type {
  BorderStyle,
  CellFormat,
  CellInterface,
  Color,
  HorizontalAlign,
  NumberFormat,
  NumberFormatType,
  SelectionArea,
  WrapStrategy,
} from '@rowsncolumns/common-types'
import { SidebarDialog, SidebarDialogHeader } from './SidebarDialog'
import {
  type BorderLocation,
  ColorSelector,
  getStringifiedColor,
  type SelectionAttributes,
  type SpreadsheetTheme,
  type VerticalAlign,
} from '@rowsncolumns/spreadsheet'
import { MdBorderClear } from '@rowsncolumns/icons'
import { getDefaultDateFormat, getDefaultTimeFormat, ssfFormat, ssfFormatColor, supplant } from '@rowsncolumns/utils'
import { forwardRef, Fragment, useMemo, useState } from 'react'
import * as Icons from '../icons'
import clsx from '@proton/utils/clsx'
import { type SubmitHandler, useForm } from 'react-hook-form'
import {
  FormCheckbox,
  FormGroup,
  FormLabel,
  Input,
  Menu,
  MenuItem,
  Select,
  SelectItem,
  SelectPopover,
  ToggleButton,
} from './shared'
import { Icon } from '../ui'
import * as Atoms from '../atoms'
// Replace this file when exports are available
import {
  addThousandSeparator,
  changeDecimals,
  getCurrentDecimalCountInPattern,
  hasThousandsSeparator,
  removeThousandSeparator,
} from './decimals'
import { createComponent } from '../utils'
import { useUI } from '../../ui-store'
import { FONT_FAMILY_DEFAULT, FONT_LABEL_BY_VALUE, FONT_SIZE_SUGGESTIONS, FONTS } from '../../constants'
import { BORDER_LINE_STYLES, BORDER_LOCATIONS } from './borderData'

const FONT_FAMILY_DEFAULT_VALUE = '$default$' as const

function renderDefaultFontLabel() {
  const defaultFont = FONT_LABEL_BY_VALUE[FONT_FAMILY_DEFAULT]
  return `Default (${defaultFont})`
}

interface CellFormatDialogProps {
  sheetId: number
  activeCell: CellInterface
  selections: SelectionArea<SelectionAttributes>[]
  cellFormat?: CellFormat | null
  locale?: string
  theme: SpreadsheetTheme
  currencySymbol?: string
  isDarkMode?: boolean
  onChangeBorder: ReturnType<typeof useSpreadsheetState>['onChangeBorder']
  onChangeFormatting: ReturnType<typeof useSpreadsheetState>['onChangeFormatting']
  getEffectiveValue: ReturnType<typeof useSpreadsheetState>['getEffectiveValue']
  onMergeCells: ReturnType<typeof useSpreadsheetState>['onMergeCells']
  onCancel?(): void
}

const BorderLocationButton = createComponent(function BorderLocationButton(props: Ariakit.RadioProps) {
  return (
    <Ariakit.Radio
      render={<Ariakit.Button />}
      {...props}
      className={clsx(
        'flex size-[44px] items-center justify-center rounded-lg aria-checked:bg-[#C2C0BE59]',
        props.className,
      )}
    />
  )
})

type NumberFormatCategory = {
  name: string
  value: NumberFormatType | string
  description?: string
  pattern?: string
  options?: string[]
}

const getNumberFormatCategories = (locale?: string): NumberFormatCategory[] => [
  {
    name: 'General',
    value: 'GENERAL',
    description: 'General format cells have no specific number format.',
  },
  {
    name: 'Number',
    value: 'NUMBER',
    description: 'Number is used for general display of numbers.',
    pattern: '#.00',
    options: ['Decimal', 'ThousandSeparator'],
  },
  {
    name: 'Currency',
    value: 'CURRENCY',
    description: 'Currency formats are used for general monetary values.',
    pattern: `"{currencySymbol}"* #,##0.00;"{currencySymbol}"* (#,##0.00);"{currencySymbol}"* "-"??;@`,
    options: ['CurrencySymbol', 'Decimal'],
  },
  {
    name: 'Accounting',
    value: 'ACCOUNTING',
    pattern: `"{currencySymbol}"* #,##0.00;"{currencySymbol}"* (#,##0.00);"{currencySymbol}"* "-"??;@`,
    options: ['CurrencySymbol', 'Decimal'],
  },
  {
    name: 'Date',
    value: 'DATE',
    description: 'Date formats display date and time serial numbers as date values.',
    pattern: getDefaultDateFormat(locale),
  },
  {
    name: 'Time',
    value: 'DATE_TIME',
    description: 'Time formats display date and time serial numbers as date values.',
    pattern: getDefaultTimeFormat(),
  },
  {
    name: 'Percentage',
    value: 'PERCENT',
    pattern: '0%',
    options: ['Decimal'],
  },
  {
    name: 'Fraction',
    value: 'FRACTION',
    pattern: '#/#',
  },
  {
    name: 'Scientific',
    value: 'SCIENTIFIC',
    pattern: '0.00E+00',
    options: ['Decimal'],
  },
  {
    name: 'Text',
    value: 'TEXT',
  },
  {
    name: 'Custom',
    value: 'CUSTOM',
    pattern: 'General',
  },
]

const customFormats: NumberFormat[] = [
  {
    type: 'GENERAL',
  },
  {
    type: 'NUMBER',
    pattern: '0',
  },
  {
    type: 'NUMBER',
    pattern: '##.00',
  },
  {
    type: 'NUMBER',
    pattern: '#,##0',
  },
  {
    type: 'NUMBER',
    pattern: '#,##0.00',
  },
  {
    type: 'NUMBER',
    pattern: '#,##0;(#,##0)',
  },
  {
    type: 'NUMBER',
    pattern: '#,##0;[Red](#,##0)',
  },
  {
    type: 'NUMBER',
    pattern: '#,##0.00;(#,##0.00)',
  },
  {
    type: 'NUMBER',
    pattern: '#,##0.00;[Red](#,##0.00)',
  },
  {
    type: 'CURRENCY',
    pattern: '"{currencySymbol}"#,##0;("{currencySymbol}"#,##0)',
  },
  {
    type: 'CURRENCY',
    pattern: '"{currencySymbol}"#,##0;[Red]("{currencySymbol}"#,##0)',
  },
  {
    type: 'CURRENCY',
    pattern: '"{currencySymbol}"#,##0.00;("{currencySymbol}"#,##0.00)',
  },
  {
    type: 'CURRENCY',
    pattern: '"{currencySymbol}"#,##0.00;[Red]("{currencySymbol}"#,##0.00)',
  },
  {
    type: 'PERCENT',
    pattern: '0%',
  },
  {
    type: 'PERCENT',
    pattern: '0.00%',
  },
  {
    type: 'SCIENTIFIC',
    pattern: '0.00E+00',
  },
  {
    type: 'SCIENTIFIC',
    pattern: '##0.0E+0',
  },
  {
    type: 'FRACTION',
    pattern: '# ?/?',
  },
  {
    type: 'FRACTION',
    pattern: '# ??/??',
  },
  {
    type: 'DATE',
    pattern: 'd/m/yy',
  },
  {
    type: 'DATE',
    pattern: 'd-mmm-yy',
  },
  {
    type: 'DATE',
    pattern: 'd-mmm',
  },
  {
    type: 'DATE',
    pattern: 'mmm-yy',
  },
  {
    type: 'DATE_TIME',
    pattern: 'h:mm AM/PM',
  },
  {
    type: 'DATE_TIME',
    pattern: 'h:mm:ss AM/PM',
  },
  {
    type: 'DATE_TIME',
    pattern: 'h:mm',
  },
  {
    type: 'DATE_TIME',
    pattern: 'h:mm:ss',
  },
  {
    type: 'DATE',
    pattern: 'd/m/yy h:mm',
  },
  {
    type: 'DATE_TIME',
    pattern: 'mm:ss',
  },
  {
    type: 'DATE_TIME',
    pattern: 'mm:ss.0',
  },
  {
    type: 'TEXT',
    pattern: '@',
  },
  {
    type: 'DATE_TIME',
    pattern: '[h]:mm:ss',
  },
  {
    type: 'CURRENCY',
    pattern: '"{currencySymbol}"* #,##0;"{currencySymbol}"* (#,##0);"{currencySymbol}"* "-";@',
  },
  {
    type: 'ACCOUNTING',
    pattern: '* #,##0;* (#,##0);* "-";@',
  },
  {
    type: 'CURRENCY',
    pattern: `"{currencySymbol}"* #,##0.00;"{currencySymbol}"* (#,##0.00);"{currencySymbol}"* "-"??;@`,
  },
  {
    type: 'ACCOUNTING',
    pattern: '* #,##0.00;* (#,##0.00);* "-"??;@',
  },
  {
    type: 'DATE_TIME',
    pattern: '[$-en-US]h:mm:ss AM/PM',
  },
  {
    type: 'DATE_TIME',
    pattern: '[$-en-US]hh:mm:ss AM/PM;@',
  },
  {
    type: 'DATE',
    pattern: '[$-en-US]m/d/yy h:mm AM/PM;@',
  },
  {
    type: 'DATE_TIME',
    pattern: '[$-en-US]h:mm AM/PM;@',
  },
  {
    type: 'DATE',
    pattern: 'd/m/yyyy',
  },
  {
    type: 'NUMBER',
    pattern: '00000',
  },
]

const dateFormats: NumberFormat[] = [
  {
    pattern: 'dd/m/yy',
    type: 'DATE',
  },
  {
    pattern: 'dddd, dd mmmm yyyy',
    type: 'DATE',
  },
  {
    pattern: 'dd/mm/yyyy',
    type: 'DATE',
  },
  {
    pattern: 'dd/mm/yy',
    type: 'DATE',
  },
  {
    pattern: 'dd\\.mm\\.yyyy',
    type: 'DATE',
  },
  {
    pattern: 'yyyy-mm-dd',
    type: 'DATE',
  },
  {
    pattern: 'dd mmmm yyyy',
    type: 'DATE',
  },
  {
    pattern: 'dd-mmm',
    type: 'DATE',
  },
  {
    pattern: 'dd-mmm-yy',
    type: 'DATE',
  },
  {
    pattern: 'mmm-dd',
    type: 'DATE',
  },
  {
    pattern: 'mmmm-dd',
    type: 'DATE',
  },
  {
    pattern: 'mmm-dd, yyyy',
    type: 'DATE',
  },
]

const timeFormats: NumberFormat[] = [
  {
    pattern: 'hh:mm',
    type: 'DATE_TIME',
  },
  {
    pattern: 'h:mm AM/PM',
    type: 'DATE_TIME',
  },
  {
    pattern: 'hh:mm:ss',
    type: 'DATE_TIME',
  },
  {
    pattern: 'h:mm:ss AM/PM',
    type: 'DATE_TIME',
  },
  {
    pattern: 'd/m/yy h:mm AM/PM',
    type: 'DATE',
  },
  {
    pattern: 'd/m/yy hh:mm',
    type: 'DATE',
  },
]

const horizontalAlignments: { name: string; value: HorizontalAlign | 'General'; icon?: JSX.Element }[] = [
  {
    name: 'General',
    value: 'General',
  },
  {
    name: 'Left',
    value: 'left',
    icon: <Icon className="shrink-0" legacyName="text-align-left" />,
  },
  {
    name: 'Center',
    value: 'center',
    icon: <Icon className="shrink-0" legacyName="text-align-center" />,
  },
  {
    name: 'Right',
    value: 'right',
    icon: <Icon className="shrink-0" legacyName="text-align-right" />,
  },
]

const verticalAlignments: { name: string; value: VerticalAlign; icon?: JSX.Element }[] = [
  {
    name: 'Top',
    value: 'top',
    icon: <Icon className="shrink-0" data={Icons.alignTop} />,
  },
  {
    name: 'Center',
    value: 'middle',
    icon: <Icon className="shrink-0" data={Icons.alignVerticalCenter} />,
  },
  {
    name: 'Bottom',
    value: 'bottom',
    icon: <Icon className="shrink-0" data={Icons.alignBottom} />,
  },
]

const wrapStrategies: { name: string; value: WrapStrategy; icon?: JSX.Element }[] = [
  {
    name: 'Overflow',
    value: 'overflow',
    icon: <Icon className="shrink-0" data={Icons.textOverflow} />,
  },
  {
    name: 'Clip',
    value: 'clip',
    icon: <Icon className="shrink-0" data={Icons.textClip} />,
  },
  {
    name: 'Wrap',
    value: 'wrap',
    icon: <Icon className="shrink-0" data={Icons.textWrap} />,
  },
]

const Tab = forwardRef<HTMLButtonElement, Ariakit.TabProps>(function Tab({ className, ...props }, ref) {
  return (
    <Ariakit.Tab
      render={<div />}
      className={clsx(
        'flex h-[44px] cursor-pointer items-center border-b-[2px] border-[transparent] text-[13px] text-[#5C5958] aria-selected:border-[#6D4AFF] aria-selected:font-semibold aria-selected:text-[#0C0C14]',
        className,
      )}
      {...props}
      ref={ref}
    />
  )
})

const TABS = {
  NUMBER: 'NUMBER',
  ALIGNMENT: 'ALIGNMENT',
  FONT: 'FONT',
  BORDER: 'BORDER',
} as const
// type TabId = (typeof TABS)[keyof typeof TABS]

interface CellFormatEditorProps extends CellFormatDialogProps {
  onDone: () => void
}

function CellFormatEditor({
  getEffectiveValue,
  cellFormat,
  sheetId,
  theme,
  currencySymbol = '$',
  onDone,
  selections,
  onChangeFormatting,
  activeCell,
  locale,
}: CellFormatEditorProps) {
  const form = useForm({ defaultValues: cellFormat || {} })
  const formValue = form.watch()
  const pattern = formValue.numberFormat?.pattern
  const type = formValue.numberFormat?.type
  const fontFamily = formValue?.textFormat?.fontFamily

  const effectiveValue = getEffectiveValue(sheetId, activeCell.rowIndex, activeCell.columnIndex)
  const formattedValue = ssfFormat(pattern ?? 'General', effectiveValue) || '\u00A0'
  const formattedColor = ssfFormatColor(pattern ?? 'General', effectiveValue)

  const numberCategories = useMemo(() => getNumberFormatCategories(locale), [locale])
  const selectedNumberFormat = type ?? 'GENERAL'
  const [isCustom, setIsCustom] = useState(false)
  const isNotCustom = !isCustom
  const [customFormatValue, setCustomFormatValue] = useState<NumberFormat | null>()

  const selectedCategory = numberCategories.find((c) => c.value === selectedNumberFormat)
  const selectedHAlignment = horizontalAlignments.find((a) => a.value === (formValue?.horizontalAlignment ?? 'General'))
  const selectedVAlignment = verticalAlignments.find((a) => a.value === formValue?.verticalAlignment)
  const selectedWrapStrategy = wrapStrategies.find((s) => s.value === cellFormat?.wrapStrategy)

  const decimalCount = getCurrentDecimalCountInPattern(pattern ?? undefined)
  const usingThousandsSeparator = hasThousandsSeparator(pattern ?? undefined)
  const sampleDate = new Date()

  const canMergeAll = useUI((ui) => ui.format.merge.can.all)
  const mergeAll = useUI.$.withFocusGrid(useUI.$.format.merge.all)
  const canMergeVertically = useUI((ui) => ui.format.merge.can.vertically)
  const mergeVertically = useUI.$.withFocusGrid(useUI.$.format.merge.vertically)
  const canMergeHorizontally = useUI((ui) => ui.format.merge.can.horizontally)
  const mergeHorizontally = useUI.$.withFocusGrid(useUI.$.format.merge.horizontally)
  const canUnmerge = useUI((ui) => ui.format.merge.can.unmerge)
  const unmerge = useUI.$.withFocusGrid(useUI.$.format.merge.unmerge)
  const setWrapping = useUI.$.format.wrapping.set
  const setBorder = useUI.$.format.borders.set

  const [selectedColor, setSelectedColor] = useState<Color | undefined>(undefined)
  const [selectedBorderStyle, setSelectedBorderStyle] = useState<BorderStyle>('solid')
  const [selectedBorderLocation, setSelectedBorderLocation] = useState<BorderLocation>('all')

  const onSubmit: SubmitHandler<CellFormat> = (data) => {
    onChangeFormatting?.(sheetId, activeCell, selections, data)
    onDone()
  }

  return (
    <Ariakit.TabProvider>
      <form className="flex min-h-0 grow flex-col" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="shrink-0 px-4">
          <Ariakit.TabList className="flex gap-4 border-b-[0.5px] border-[#EAE7E4]">
            <Tab id={TABS.NUMBER}>Number</Tab>
            <Tab id={TABS.ALIGNMENT}>Alignment</Tab>
            <Tab id={TABS.FONT}>Font</Tab>
            <Tab id={TABS.BORDER}>Border</Tab>
          </Ariakit.TabList>
        </div>

        <div className="grow overflow-y-auto px-4">
          <div className="py-4">
            <Ariakit.TabPanel id={TABS.NUMBER} focusable={false}>
              <div className="flex min-w-0 flex-col gap-4">
                <FormGroup>
                  <FormLabel render={<p />}>Preview</FormLabel>
                  <div
                    style={{ color: formattedColor }}
                    className="flex h-[48px] min-w-0 items-center justify-center rounded-lg bg-[#F5F4F2] px-4 text-center text-sm"
                  >
                    <span className="truncate">{formattedValue}</span>
                  </div>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Choose Category</FormLabel>

                  <Ariakit.SelectProvider
                    focusLoop
                    value={isCustom ? 'CUSTOM' : selectedNumberFormat}
                    setValue={(value) => {
                      const format = numberCategories.find((n) => n.value === value)
                      if (format?.value === 'CUSTOM') {
                        setIsCustom(true)
                        setCustomFormatValue(formValue.numberFormat)
                      } else if (format) {
                        setIsCustom(false)

                        form.setValue('numberFormat', {
                          pattern: format.pattern ? supplant(format.pattern, { currencySymbol }) : undefined,
                          type: format.value as NumberFormatType,
                        })
                      }
                    }}
                  >
                    <Select>{isCustom ? 'Custom' : (selectedCategory?.name ?? 'Choose Category')}</Select>
                    <SelectPopover sameWidth>
                      <Ariakit.SelectGroup className="py-2">
                        {numberCategories.map(({ name, value }) => {
                          return (
                            <SelectItem value={value} key={name}>
                              {name}
                            </SelectItem>
                          )
                        })}
                      </Ariakit.SelectGroup>
                    </SelectPopover>
                  </Ariakit.SelectProvider>
                </FormGroup>

                {isNotCustom
                  ? selectedCategory?.options?.map((opt) => {
                      if (opt === 'Decimal') {
                        return (
                          <FormGroup key={opt}>
                            <FormLabel>Decimal places</FormLabel>
                            <Input
                              type="number"
                              min={0}
                              max={10}
                              value={decimalCount}
                              onChange={(event) => {
                                const numDecimals = parseInt(event.target.value, 10)
                                if (type) {
                                  form.setValue('numberFormat', {
                                    type,
                                    pattern: changeDecimals(pattern ?? '#,##0.00', numDecimals, false),
                                  })
                                }
                              }}
                            />
                          </FormGroup>
                        )
                      }

                      if (opt === 'ThousandSeparator') {
                        return (
                          <FormGroup key={opt}>
                            <FormLabel>Thousands separator</FormLabel>
                            <Ariakit.CheckboxProvider
                              value={usingThousandsSeparator}
                              setValue={(checked) => {
                                const newPattern = checked
                                  ? addThousandSeparator(pattern ?? undefined)
                                  : removeThousandSeparator(pattern ?? undefined)

                                form.setValue('numberFormat', {
                                  type: type ?? 'NUMBER',
                                  pattern: newPattern,
                                })
                              }}
                            >
                              <FormCheckbox>Use 1000 Separator (,)</FormCheckbox>
                            </Ariakit.CheckboxProvider>
                          </FormGroup>
                        )
                      }

                      if (opt === 'CurrencySymbol') {
                        return (
                          <FormGroup key={opt}>
                            <FormLabel>Currency Symbol</FormLabel>
                            <Input
                              defaultValue={currencySymbol}
                              onChange={(event) => {
                                const currencyPattern = numberCategories.find((n) => n.value === 'CURRENCY')
                                if (currencyPattern && currencyPattern.pattern) {
                                  form.setValue('numberFormat', {
                                    type: 'CURRENCY',
                                    pattern: supplant(currencyPattern.pattern, {
                                      currencySymbol: event.target.value,
                                    }),
                                  })
                                }
                              }}
                            />
                          </FormGroup>
                        )
                      }

                      return null
                    })
                  : null}

                {isCustom ? (
                  <FormGroup>
                    <FormLabel>Type</FormLabel>
                    <div className="flex min-w-0 flex-col gap-2">
                      <Input
                        value={customFormatValue?.pattern ?? ''}
                        onChange={(e) => {
                          setCustomFormatValue((prev) => {
                            return {
                              type: prev?.type ?? 'GENERAL',
                              pattern: e.target.value,
                            }
                          })

                          form.setValue('numberFormat', {
                            type: customFormatValue?.type ?? 'GENERAL',
                            pattern: e.target.value,
                          })
                        }}
                      />

                      <div className="flex max-h-[300px] min-w-0 flex-col overflow-y-auto rounded-lg border border-[black]/10 py-2">
                        {customFormats.map((format, idx) => {
                          return (
                            <Ariakit.Button
                              key={idx}
                              className="flex h-[32px] min-w-0 shrink-0 items-center truncate px-4 text-left text-sm text-[#281D1B] hover:bg-[black]/5"
                              onPointerDown={(event) => event.preventDefault()}
                              onClick={() => {
                                form.setValue('numberFormat', {
                                  type: format.type,
                                  pattern: supplant(format.pattern ?? 'General', {
                                    currencySymbol,
                                  }),
                                })

                                setCustomFormatValue({
                                  type: format.type,
                                  pattern: supplant(format.pattern ?? 'General', {
                                    currencySymbol,
                                  }),
                                })
                              }}
                            >
                              {supplant(format.pattern ?? format.type, {
                                currencySymbol,
                              })}
                            </Ariakit.Button>
                          )
                        })}
                      </div>
                    </div>
                  </FormGroup>
                ) : null}

                {type === 'DATE' && isNotCustom ? (
                  <FormGroup>
                    <Ariakit.RadioProvider>
                      <Ariakit.RadioGroup className="flex max-h-[300px] min-w-0 flex-col overflow-y-auto rounded-lg border border-[black]/10 py-2">
                        {dateFormats.map((format, idx) => {
                          return (
                            <Ariakit.Radio
                              render={<Ariakit.Button />}
                              key={idx}
                              value={idx}
                              className="flex h-[32px] min-w-0 shrink-0 items-center truncate px-4 text-left text-sm text-[#281D1B] hover:bg-[black]/5 aria-checked:bg-[black]/[.08]"
                              onClick={() => {
                                form.setValue('numberFormat', {
                                  type: format.type,
                                  pattern: supplant(format.pattern ?? 'General', {
                                    currencySymbol,
                                  }),
                                })
                              }}
                            >
                              {ssfFormat(format.pattern ?? getDefaultDateFormat(), sampleDate)}
                            </Ariakit.Radio>
                          )
                        })}
                      </Ariakit.RadioGroup>
                    </Ariakit.RadioProvider>
                  </FormGroup>
                ) : null}

                {type === 'DATE_TIME' && isNotCustom ? (
                  <FormGroup>
                    <Ariakit.RadioProvider>
                      <Ariakit.RadioGroup className="flex max-h-[300px] min-w-0 flex-col overflow-y-auto rounded-lg border border-[black]/10 py-2">
                        {timeFormats.map((format, idx) => {
                          return (
                            <Ariakit.Radio
                              render={<Ariakit.Button />}
                              key={idx}
                              value={idx}
                              className="flex h-[32px] min-w-0 shrink-0 items-center truncate px-4 text-left text-sm text-[#281D1B] hover:bg-[black]/5 aria-checked:bg-[black]/[.08]"
                              onClick={() => {
                                form.setValue('numberFormat', {
                                  type: format.type,
                                  pattern: supplant(format.pattern ?? 'General', { currencySymbol }),
                                })
                              }}
                            >
                              {ssfFormat(format.pattern ?? getDefaultDateFormat(), sampleDate)}
                            </Ariakit.Radio>
                          )
                        })}
                      </Ariakit.RadioGroup>
                    </Ariakit.RadioProvider>
                  </FormGroup>
                ) : null}
              </div>
            </Ariakit.TabPanel>

            <Ariakit.TabPanel id={TABS.ALIGNMENT} focusable={false}>
              <div className="flex flex-col gap-4">
                <FormGroup>
                  <FormLabel>Horizontal Alignment</FormLabel>
                  <Ariakit.SelectProvider
                    value={formValue?.horizontalAlignment ?? 'General'}
                    setValue={(value) => form.setValue('horizontalAlignment', value as HorizontalAlign)}
                  >
                    <Select>
                      {selectedHAlignment ? (
                        <Fragment>
                          {selectedHAlignment.icon} {selectedHAlignment.name}
                        </Fragment>
                      ) : (
                        'General'
                      )}
                    </Select>
                    <SelectPopover sameWidth>
                      <Ariakit.SelectGroup className="py-2">
                        {horizontalAlignments.map(({ name, value, icon }) => {
                          return (
                            <SelectItem value={value} key={value}>
                              {icon}
                              {name}
                            </SelectItem>
                          )
                        })}
                      </Ariakit.SelectGroup>
                    </SelectPopover>
                  </Ariakit.SelectProvider>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Indent</FormLabel>
                  <Ariakit.SelectProvider
                    value={(formValue?.indent ?? 0).toString()}
                    setValue={(value) => {
                      form.setValue('indent', Number(value))
                    }}
                  >
                    <Select>{formValue?.indent ?? 0}</Select>
                    <SelectPopover sameWidth>
                      <Ariakit.SelectGroup className="py-2">
                        {Array.from({ length: 11 }).map((_, index) => (
                          <SelectItem value={index.toString()} key={index}>
                            {index}
                          </SelectItem>
                        ))}
                      </Ariakit.SelectGroup>
                    </SelectPopover>
                  </Ariakit.SelectProvider>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Vertical Alignment</FormLabel>
                  <Ariakit.SelectProvider
                    value={formValue?.verticalAlignment ?? 'bottom'}
                    setValue={(value) => form.setValue('verticalAlignment', value as VerticalAlign)}
                  >
                    <Select>
                      {selectedVAlignment ? (
                        <Fragment>
                          {selectedVAlignment.icon} {selectedVAlignment.name}
                        </Fragment>
                      ) : (
                        'General'
                      )}
                    </Select>
                    <SelectPopover sameWidth>
                      <Ariakit.SelectGroup className="py-2">
                        {verticalAlignments.map(({ name, value, icon }) => {
                          return (
                            <SelectItem value={value} key={value}>
                              {icon}
                              {name}
                            </SelectItem>
                          )
                        })}
                      </Ariakit.SelectGroup>
                    </SelectPopover>
                  </Ariakit.SelectProvider>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Text control</FormLabel>
                  <div className="grid grid-cols-2 items-center gap-2">
                    <Ariakit.SelectProvider
                      value={cellFormat?.wrapStrategy ?? 'overflow'}
                      setValue={(value: WrapStrategy) => setWrapping(value === 'overflow' ? undefined : value)}
                    >
                      <Select>
                        {selectedWrapStrategy ? (
                          <Fragment>
                            {selectedWrapStrategy.icon} {selectedWrapStrategy.name}
                          </Fragment>
                        ) : (
                          'Overflow'
                        )}
                      </Select>
                      <SelectPopover>
                        <Ariakit.SelectGroup className="py-2">
                          {wrapStrategies.map(({ name, value, icon }) => {
                            return (
                              <SelectItem value={value} key={value}>
                                {icon}
                                {name}
                              </SelectItem>
                            )
                          })}
                        </Ariakit.SelectGroup>
                      </SelectPopover>
                    </Ariakit.SelectProvider>

                    <div className="flex items-center">
                      <Ariakit.Button
                        disabled={!canMergeAll}
                        onClick={mergeAll}
                        className={clsx(
                          'flex h-[36px] grow items-center gap-2 rounded-l-lg border border-[#ADABA8] px-3 text-sm text-[#0C0C14] hover:bg-[black]/[0.03] aria-disabled:opacity-50',
                          '!outline-none transition focus-visible:border-[#6D4AFF] focus-visible:ring-[3px] focus-visible:ring-[#6D4AFF33]',
                        )}
                      >
                        <Icon className="shrink-0" data={Icons.merge} />
                        Merge
                      </Ariakit.Button>
                      <Ariakit.MenuProvider>
                        <Ariakit.MenuButton
                          className={clsx(
                            'flex h-[36px] items-center justify-center rounded-r-lg border border-l-0 border-[#ADABA8] bg-[#C2C0BE59] px-1',
                            '!outline-none transition focus-visible:border-[#6D4AFF] focus-visible:ring-[3px] focus-visible:ring-[#6D4AFF33]',
                          )}
                        >
                          <Icon className="shrink-0" legacyName="chevron-down-filled" />
                        </Ariakit.MenuButton>
                        <Menu>
                          <Ariakit.MenuGroup className="py-2">
                            <MenuItem disabled={!canMergeAll} onClick={mergeAll}>
                              Merge all
                            </MenuItem>
                            <MenuItem disabled={!canMergeVertically} onClick={mergeVertically}>
                              Merge vertically
                            </MenuItem>
                            <MenuItem disabled={!canMergeHorizontally} onClick={mergeHorizontally}>
                              Merge horizontally
                            </MenuItem>
                            <MenuItem disabled={!canUnmerge} onClick={unmerge}>
                              Unmerge
                            </MenuItem>
                          </Ariakit.MenuGroup>
                        </Menu>
                      </Ariakit.MenuProvider>
                    </div>
                  </div>
                </FormGroup>
              </div>
            </Ariakit.TabPanel>

            <Ariakit.TabPanel id={TABS.FONT} focusable={false}>
              <div className="flex flex-col gap-4">
                <FormGroup>
                  <FormLabel>Font size</FormLabel>
                  <Ariakit.SelectProvider
                    value={formValue?.textFormat?.fontSize?.toString()}
                    setValue={(fontSize: string) => {
                      form.setValue('textFormat.fontSize', Number(fontSize))
                    }}
                  >
                    <Select>{formValue?.textFormat?.fontSize ?? '-'}</Select>
                    <SelectPopover sameWidth>
                      <Ariakit.SelectGroup className="py-2">
                        {FONT_SIZE_SUGGESTIONS.map((fontSize) => (
                          <SelectItem key={fontSize} value={fontSize.toString()}>
                            {fontSize}
                          </SelectItem>
                        ))}
                      </Ariakit.SelectGroup>
                    </SelectPopover>
                  </Ariakit.SelectProvider>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Font</FormLabel>
                  <Ariakit.SelectProvider
                    value={fontFamily ?? FONT_FAMILY_DEFAULT_VALUE}
                    setValue={(f) => {
                      form.setValue('textFormat.fontFamily', f === FONT_FAMILY_DEFAULT_VALUE ? undefined : f)
                    }}
                  >
                    <Select>{fontFamily ? FONT_LABEL_BY_VALUE[fontFamily] : renderDefaultFontLabel()}</Select>
                    <SelectPopover sameWidth>
                      <Ariakit.FormGroup className="border-b border-[#D1CFCD] py-2">
                        <SelectItem value={FONT_FAMILY_DEFAULT_VALUE}>{renderDefaultFontLabel()}</SelectItem>
                      </Ariakit.FormGroup>
                      <Ariakit.FormGroup className="py-2">
                        {FONTS.map(({ value, label = value }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </Ariakit.FormGroup>
                    </SelectPopover>
                  </Ariakit.SelectProvider>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Effects</FormLabel>
                  <div className="flex !flex-wrap items-center gap-3">
                    <ToggleButton
                      checked={formValue?.textFormat?.bold ?? false}
                      onChange={(event) => {
                        form.setValue('textFormat.bold', event.target.checked)
                      }}
                    >
                      <Icon className="shrink-0" legacyName="text-bold" />
                      Bold
                    </ToggleButton>
                    <ToggleButton
                      checked={formValue?.textFormat?.italic ?? false}
                      onChange={(event) => {
                        form.setValue('textFormat.italic', event.target.checked)
                      }}
                    >
                      <Icon className="shrink-0" legacyName="text-italic" />
                      Italic
                    </ToggleButton>
                    <ToggleButton
                      checked={formValue?.textFormat?.underline ?? false}
                      onChange={(event) => {
                        form.setValue('textFormat.underline', event.target.checked)
                      }}
                    >
                      <Icon className="shrink-0" legacyName="text-underline" />
                      Underline
                    </ToggleButton>
                    <ToggleButton
                      checked={formValue?.textFormat?.strikethrough ?? false}
                      onChange={(event) => {
                        form.setValue('textFormat.strikethrough', event.target.checked)
                      }}
                    >
                      <Icon className="shrink-0" legacyName="text-strikethrough" />
                      Strikethrough
                    </ToggleButton>
                  </div>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Color</FormLabel>
                  <div>
                    <Ariakit.PopoverProvider>
                      <Ariakit.PopoverDisclosure className="flex size-[36px] items-center justify-center rounded-lg border border-[#EAE7E4]">
                        <Icon legacyName="text-style" />
                      </Ariakit.PopoverDisclosure>

                      <Atoms.DropdownPopover className="p-2" render={<Ariakit.Popover gutter={4} />}>
                        <ColorSelector
                          color={formValue?.textFormat?.color}
                          theme={theme}
                          onChange={(color) => {
                            form.setValue('textFormat.color', color)
                          }}
                        />
                      </Atoms.DropdownPopover>
                    </Ariakit.PopoverProvider>
                  </div>
                </FormGroup>
              </div>
            </Ariakit.TabPanel>

            <Ariakit.TabPanel id={TABS.BORDER} focusable={false}>
              <div className="flex flex-col gap-4">
                <FormGroup>
                  <Ariakit.RadioProvider>
                    <div className="grid grid-cols-6">
                      {BORDER_LOCATIONS.map(({ location, icon: BorderIcon }) => {
                        return (
                          <BorderLocationButton
                            key={location}
                            value={location}
                            onClick={() => {
                              setSelectedBorderLocation(location)
                              setBorder(location ? location : 'all', selectedColor, selectedBorderStyle)
                            }}
                          >
                            <BorderIcon />
                          </BorderLocationButton>
                        )
                      })}

                      <BorderLocationButton
                        value="clear"
                        onClick={() => {
                          setBorder('all', undefined, undefined)
                        }}
                      >
                        <MdBorderClear />
                      </BorderLocationButton>
                    </div>
                  </Ariakit.RadioProvider>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Border style</FormLabel>
                  <Ariakit.RadioProvider>
                    <div className="grid grid-cols-3 gap-2 rounded-lg border border-[#ADABA8] p-4">
                      {BORDER_LINE_STYLES.map(({ icon, style }) => {
                        return (
                          <Ariakit.Radio
                            key={style}
                            value={style}
                            render={<Ariakit.Button />}
                            className="flex h-[20px] items-center justify-center rounded px-2.5 aria-checked:bg-[#C2C0BE59]"
                            onClick={() => {
                              setSelectedBorderStyle(style)
                              setBorder(selectedBorderLocation, selectedColor, style)
                            }}
                          >
                            {icon}
                          </Ariakit.Radio>
                        )
                      })}
                    </div>
                  </Ariakit.RadioProvider>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Color</FormLabel>
                  <div>
                    <Ariakit.PopoverProvider>
                      <Ariakit.PopoverDisclosure className="flex size-[36px] items-center justify-center rounded-lg">
                        <span
                          style={{
                            backgroundColor: selectedColor ? getStringifiedColor(selectedColor, theme) : undefined,
                          }}
                          className="size-4 rounded-full bg-[#E3E2E2]"
                        />
                      </Ariakit.PopoverDisclosure>

                      <Atoms.DropdownPopover className="p-2" render={<Ariakit.Popover gutter={4} />}>
                        <ColorSelector
                          color={selectedColor}
                          theme={theme}
                          onChange={(color) => {
                            setSelectedColor(color)
                            setBorder(selectedBorderLocation, color, selectedBorderStyle)
                          }}
                        />
                      </Atoms.DropdownPopover>
                    </Ariakit.PopoverProvider>
                  </div>
                </FormGroup>
              </div>
            </Ariakit.TabPanel>
          </div>
        </div>

        <div className="mt-auto flex shrink-0 items-center justify-end gap-2 border-t-[0.5px] border-[#EAE7E4] px-4 py-2">
          <button
            type="button"
            className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
            onClick={onDone}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex h-[36px] items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-4 text-[13px] text-[white]"
          >
            Save
          </button>
        </div>
      </form>
    </Ariakit.TabProvider>
  )
}

export function CellFormatDialog(props: CellFormatDialogProps) {
  const [open, setOpen] = useFormatCellsDialogState()

  return (
    <SidebarDialog open={open} setOpen={setOpen}>
      <div className="flex h-full min-h-0 flex-col">
        <SidebarDialogHeader title="Format cells" />
        <CellFormatEditor {...props} onDone={() => setOpen(false)} />
      </div>
    </SidebarDialog>
  )
}
