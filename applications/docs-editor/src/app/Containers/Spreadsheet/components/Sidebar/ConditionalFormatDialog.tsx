/* eslint-disable no-nested-ternary */

import {
  type ConditionalFormatEditorProps,
  createRulePreviewStyle,
  useConditionalFormatDialogState,
} from '@rowsncolumns/spreadsheet-state'
import { type CellInterface, selectionFromActiveCell } from '@rowsncolumns/grid'
import { uuid } from '@rowsncolumns/utils'
import {
  getGradientColors,
  type GradientRule,
  type SpreadsheetTheme,
  useFormulaRangeHelpers,
  useSpreadsheetApi,
  type ConditionalFormatRule,
  FormulaInput,
  type SheetRange,
  CONDITION_LABELS,
  CONDTION_NONE,
  type ConditionType,
  shouldShowFromValue,
  shouldShowToValue,
  ColorSelector,
  type InterpolationPoint,
} from '@rowsncolumns/spreadsheet'
import { Icon } from '../ui'
import * as Atoms from '../atoms'
import { c } from 'ttag'
import * as Ariakit from '@ariakit/react'
import omit from 'lodash/omit'
import clsx from '@proton/utils/clsx'
import { createStringifier } from '../../stringifier'
import { forwardRef, Fragment, useState, useMemo, useEffect } from 'react'
import * as Icons from '../icons'
import { SidebarDialog, SidebarDialogHeader } from './SidebarDialog'
import { produce } from 'immer'
import { useForm } from 'react-hook-form'
import { FUNCTION_DESCRIPTIONS } from '../../constants'
import { useEvent } from '../utils'
import { FormGroup, FormLabel, NativeSelect } from './shared'

const { s } = createStringifier(strings)

const Tab = forwardRef<HTMLButtonElement, Ariakit.TabProps>(function Tab({ className, ...props }, ref) {
  return (
    <Ariakit.Tab
      render={<div />}
      className={clsx(
        'flex h-[44px] cursor-pointer items-center justify-center border-b-[2px] border-[transparent] text-center text-sm text-[#5C5958] aria-selected:border-[#6D4AFF] aria-selected:font-semibold aria-selected:text-[#0C0C14]',
        className,
      )}
      {...props}
      ref={ref}
    />
  )
})

const TABS = {
  SINGLE_COLOR: 'SINGLE_COLOR',
  COLOR_SCALE: 'COLOR_SCALE',
} as const
type TabId = (typeof TABS)[keyof typeof TABS]

const FormatButton = forwardRef<HTMLButtonElement, Ariakit.ButtonProps>(function FormatButton(
  { className, ...props },
  ref,
) {
  return (
    <Ariakit.Button
      type="button"
      className={clsx('flex size-[36px] items-center justify-center rounded-lg', className)}
      {...props}
      ref={ref}
    />
  )
})

const FormatToggleButton = forwardRef<HTMLInputElement, Ariakit.CheckboxProps>(function FormatButton(
  { className, ...props },
  ref,
) {
  return (
    <Ariakit.Checkbox
      // eslint-disable-next-line jsx-a11y/control-has-associated-label
      render={<button type="button" />}
      className={clsx(
        'flex size-[36px] items-center justify-center rounded-lg aria-checked:bg-[#C2C0BE59]/35',
        className,
      )}
      {...props}
      ref={ref}
    />
  )
})

interface RuleEditorProps {
  rule: ConditionalFormatRule
  sheetId: number
  theme: SpreadsheetTheme
  onChange: (rule: ConditionalFormatRule) => void
  onSubmit: (rule: ConditionalFormatRule) => void
  onCancel: () => void
  onNewRule: () => void
}

function RuleEditor({ rule, sheetId, theme, onChange, onCancel, onSubmit, onNewRule: onAddRule }: RuleEditorProps) {
  const { rangeToFormula, formulaToRange } = useFormulaRangeHelpers({ sheetId })
  const form = useForm<ConditionalFormatRule>({ defaultValues: rule })
  const { subscribe } = form
  const formValue = form.watch()
  const { booleanRule, gradientRule } = formValue
  const fromValue = booleanRule?.condition?.values?.[0]?.userEnteredValue
  const toValue = booleanRule?.condition?.values?.[1]?.userEnteredValue
  const [selectedTab, setSelectedTab] = useState<TabId>(() =>
    rule.gradientRule ? TABS.COLOR_SCALE : TABS.SINGLE_COLOR,
  )

  const showFromValue = useMemo(() => {
    return shouldShowFromValue(booleanRule?.condition?.type ?? undefined)
  }, [booleanRule?.condition?.type])

  const showToValue = useMemo(() => {
    return shouldShowToValue(booleanRule?.condition?.type ?? undefined)
  }, [booleanRule?.condition?.type])

  const normalizeRuleData = useEvent((rule: ConditionalFormatRule) => {
    return omit(rule, selectedTab === TABS.SINGLE_COLOR ? 'gradientRule' : 'booleanRule')
  })

  const handleChange = useEvent((rule: ConditionalFormatRule) => {
    onChange(normalizeRuleData(rule))
  })
  useEffect(() => {
    return subscribe({ formState: { values: true }, callback: (data) => handleChange(data.values) })
  }, [subscribe, handleChange])

  const handleSubmit = () => {
    onSubmit(normalizeRuleData(form.getValues()))
  }

  return (
    <Ariakit.TabProvider selectedId={selectedTab} setSelectedId={(value) => setSelectedTab(value as TabId)}>
      <div className="flex min-h-0 grow flex-col">
        <div className="shrink-0 px-4">
          <Ariakit.TabList className="grid grid-cols-2 border-b-[0.5px] border-[#EAE7E4]">
            <Tab id={TABS.SINGLE_COLOR}>Single color</Tab>
            <Tab id={TABS.COLOR_SCALE}>Color scale</Tab>
          </Ariakit.TabList>
        </div>

        <div className="grow overflow-y-auto px-4">
          <div className="py-4">
            <div className="flex flex-col gap-4">
              <FormGroup>
                <FormLabel className="text-sm font-semibold">Apply to range</FormLabel>

                <div className="flex flex-col gap-1">
                  <div className="flex flex-col gap-1">
                    {formValue.ranges.map((range, rangeIndex) => {
                      const canDelete = formValue.ranges.length > 1

                      return (
                        <div key={rangeIndex} className="flex items-center gap-1">
                          <div className="flex grow items-center">
                            <FormulaInput
                              onChange={(value) => {
                                const formulaValue = formulaToRange(value)
                                if (formulaValue) {
                                  form.setValue(
                                    'ranges',
                                    produce(formValue.ranges, (draft) => {
                                      draft[rangeIndex] = formulaValue as SheetRange
                                    }),
                                  )
                                }
                              }}
                              value={rangeToFormula(range)}
                              required
                              placeholder="Select a range"
                              autoFocus={rangeIndex === formValue.ranges.length - 1}
                              className="mb-0 w-full"
                            />
                          </div>

                          {canDelete ? (
                            <button
                              type="button"
                              className="flex size-[36px] shrink-0 items-center justify-center"
                              aria-label={s('Delete range')}
                              onClick={() => {
                                form.setValue(
                                  'ranges',
                                  formValue.ranges.filter((_, i) => rangeIndex !== i),
                                )
                              }}
                            >
                              <Icon legacyName="trash" />
                            </button>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>

                  <div>
                    <button
                      type="button"
                      className="py-1 text-sm text-[#6243E6]"
                      onClick={() => {
                        form.setValue(
                          'ranges',
                          produce(formValue.ranges, (draft) => {
                            draft.push({
                              startRowIndex: 1,
                              endRowIndex: 1,
                              startColumnIndex: 1,
                              endColumnIndex: 1,
                              sheetId,
                            } as SheetRange)
                          }),
                        )
                      }}
                    >
                      Add another range
                    </button>
                  </div>
                </div>
              </FormGroup>

              <Ariakit.TabPanel tabId={TABS.SINGLE_COLOR} className="flex flex-col gap-4">
                <FormGroup>
                  <FormLabel>Format rules</FormLabel>
                  <div className="flex flex-col gap-2">
                    <NativeSelect
                      value={booleanRule?.condition?.type ?? CONDTION_NONE}
                      onChange={(event) => {
                        form.setValue('booleanRule.condition.type', event.target.value as ConditionType)
                        form.setValue('booleanRule.condition.values', booleanRule?.condition?.values ?? [])
                      }}
                    >
                      <option value={CONDTION_NONE}>None</option>
                      {CONDITION_LABELS.map(({ condition, label }) => {
                        return (
                          <option key={condition} value={condition}>
                            {label}
                          </option>
                        )
                      })}
                    </NativeSelect>

                    {showFromValue ? (
                      booleanRule?.condition?.type === 'CUSTOM_FORMULA' ? (
                        <div className="flex items-center">
                          <FormulaInput
                            onChange={(value) => {
                              form.setValue(`booleanRule.condition.values.${0}.userEnteredValue`, value)
                            }}
                            value={fromValue ?? '='}
                            required
                            placeholder="Enter a formula"
                            autoFocus
                            functionDescriptions={FUNCTION_DESCRIPTIONS}
                            className="mb-0 w-full"
                          />
                        </div>
                      ) : (
                        <label
                          aria-label="formula"
                          className="flex h-[36px] grow items-center gap-0.5 rounded-lg border border-[#ADABA8] px-3"
                        >
                          <input
                            placeholder="Enter value"
                            value={fromValue}
                            onChange={(e) =>
                              form.setValue(`booleanRule.condition.values.${0}.userEnteredValue`, e.target.value)
                            }
                            className="h-full grow truncate text-sm !outline-none"
                          />
                        </label>
                      )
                    ) : null}

                    {showToValue ? (
                      <label
                        aria-label="formula"
                        className="flex h-[36px] grow items-center gap-0.5 rounded-lg border border-[#ADABA8] px-3"
                      >
                        <input
                          placeholder="Enter value"
                          value={toValue}
                          onChange={(e) =>
                            form.setValue(`booleanRule.condition.values.${1}.userEnteredValue`, e.target.value)
                          }
                          className="h-full grow truncate text-sm !outline-none"
                        />
                      </label>
                    ) : null}
                  </div>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Format style</FormLabel>
                  <div className="flex items-center gap-1">
                    <FormatToggleButton
                      checked={Boolean(booleanRule?.format?.textFormat?.bold)}
                      onClick={() => {
                        form.setValue('booleanRule.format.textFormat.bold', !booleanRule?.format?.textFormat?.bold)
                      }}
                    >
                      <Icon legacyName="text-bold" />
                    </FormatToggleButton>

                    <FormatToggleButton
                      checked={Boolean(booleanRule?.format?.textFormat?.italic)}
                      onClick={() => {
                        form.setValue('booleanRule.format.textFormat.italic', !booleanRule?.format?.textFormat?.italic)
                      }}
                    >
                      <Icon legacyName="text-italic" />
                    </FormatToggleButton>

                    <FormatToggleButton
                      checked={Boolean(booleanRule?.format?.textFormat?.underline)}
                      onClick={() => {
                        form.setValue(
                          'booleanRule.format.textFormat.underline',
                          !booleanRule?.format?.textFormat?.underline,
                        )
                      }}
                    >
                      <Icon legacyName="text-underline" />
                    </FormatToggleButton>

                    <FormatToggleButton
                      checked={Boolean(booleanRule?.format?.textFormat?.strikethrough)}
                      onClick={() => {
                        form.setValue(
                          'booleanRule.format.textFormat.strikethrough',
                          !booleanRule?.format?.textFormat?.strikethrough,
                        )
                      }}
                    >
                      <Icon legacyName="text-strikethrough" />
                    </FormatToggleButton>

                    <Ariakit.PopoverProvider>
                      <Ariakit.PopoverDisclosure render={<FormatButton />}>
                        <Icon legacyName="text-style" />
                      </Ariakit.PopoverDisclosure>

                      <Atoms.DropdownPopover className="p-2" render={<Ariakit.Popover />}>
                        <ColorSelector
                          color={booleanRule?.format?.textFormat?.color}
                          theme={theme}
                          onChange={(value) => {
                            form.setValue('booleanRule.format.textFormat.color', value)
                          }}
                        />
                      </Atoms.DropdownPopover>
                    </Ariakit.PopoverProvider>

                    <Ariakit.PopoverProvider>
                      <Ariakit.PopoverDisclosure render={<FormatButton />}>
                        <Icon data={Icons.bucketColor} />
                      </Ariakit.PopoverDisclosure>

                      <Atoms.DropdownPopover className="p-2" render={<Ariakit.Popover />}>
                        <ColorSelector
                          color={booleanRule?.format?.backgroundColor}
                          theme={theme}
                          onChange={(value) => {
                            form.setValue('booleanRule.format.backgroundColor', value)
                          }}
                        />
                      </Atoms.DropdownPopover>
                    </Ariakit.PopoverProvider>
                  </div>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Preview</FormLabel>
                  <div
                    className="flex h-[48px] items-center justify-center rounded-lg bg-[#F5F4F2]"
                    style={createRulePreviewStyle(booleanRule?.format, theme)}
                  >
                    <span className="text-sm">AaBbCcYyZz</span>
                  </div>
                </FormGroup>
              </Ariakit.TabPanel>

              <Ariakit.TabPanel tabId={TABS.COLOR_SCALE} className="flex flex-col gap-4">
                <FormGroup>
                  <FormLabel>Min point</FormLabel>
                  <div className="flex items-center gap-3">
                    <div className="grow basis-0">
                      <NativeSelect
                        value={gradientRule?.minpoint?.type ?? 'MIN'}
                        onChange={(event) => {
                          const value = event.target.value
                          form.setValue('gradientRule.minpoint', {
                            ...gradientRule?.minpoint,
                            type: value,
                            value: value === 'MIN' ? '' : gradientRule?.minpoint?.value,
                          } as InterpolationPoint)
                        }}
                      >
                        <option value="MIN">Min value</option>
                        <option value="NUMBER">Number</option>
                      </NativeSelect>
                    </div>

                    {gradientRule?.minpoint?.type === 'NUMBER' ? (
                      <div className="grow basis-0">
                        <label
                          aria-label="formula"
                          className="flex h-[36px] grow items-center gap-0.5 rounded-lg border border-[#ADABA8] px-3 has-[:disabled]:border-none has-[:disabled]:bg-[#F5F4F2]"
                        >
                          <input
                            value={gradientRule?.minpoint?.value ?? ''}
                            onChange={(event) => form.setValue('gradientRule.minpoint.value', event.target.value)}
                            className="h-full grow truncate text-sm !outline-none"
                          />
                        </label>
                      </div>
                    ) : null}

                    <div className="shrink-0">
                      <Ariakit.PopoverProvider>
                        <Ariakit.PopoverDisclosure
                          render={<FormatButton className="ring-[1px] ring-inset ring-[#EAE7E4]" />}
                        >
                          <Icon data={Icons.bucketColor} />
                        </Ariakit.PopoverDisclosure>

                        <Atoms.DropdownPopover className="p-2" render={<Ariakit.Popover />}>
                          <ColorSelector
                            color={gradientRule?.minpoint?.color}
                            theme={theme}
                            onChange={(value) => {
                              form.setValue('gradientRule.minpoint.color', value)
                            }}
                          />
                        </Atoms.DropdownPopover>
                      </Ariakit.PopoverProvider>
                    </div>
                  </div>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Mid point</FormLabel>
                  <div className="flex items-center gap-3">
                    <div className="grow basis-0">
                      <NativeSelect
                        value={gradientRule?.midpoint?.type ?? CONDTION_NONE}
                        onChange={(event) => {
                          const value = event.target.value
                          form.setValue('gradientRule.midpoint.type', value as InterpolationPoint['type'])
                          if (value === CONDTION_NONE) {
                            form.setValue('gradientRule.midpoint.value', '')
                          }
                        }}
                      >
                        <option value={CONDTION_NONE}>None</option>
                        <option value="NUMBER">Number</option>
                      </NativeSelect>
                    </div>

                    {gradientRule?.midpoint?.type === 'NUMBER' ? (
                      <div className="grow basis-0">
                        <label
                          aria-label="formula"
                          className="flex h-[36px] grow items-center gap-0.5 rounded-lg border border-[#ADABA8] px-3 has-[:disabled]:border-none has-[:disabled]:bg-[#F5F4F2]"
                        >
                          <input
                            value={gradientRule?.midpoint?.value ?? ''}
                            onChange={(event) => form.setValue('gradientRule.midpoint.value', event.target.value)}
                            className="h-full grow truncate text-sm !outline-none"
                          />
                        </label>
                      </div>
                    ) : null}

                    <div className="shrink-0">
                      <Ariakit.PopoverProvider>
                        <Ariakit.PopoverDisclosure
                          render={<FormatButton className="ring-[1px] ring-inset ring-[#EAE7E4]" />}
                        >
                          <Icon data={Icons.bucketColor} />
                        </Ariakit.PopoverDisclosure>

                        <Atoms.DropdownPopover className="p-2" render={<Ariakit.Popover />}>
                          <ColorSelector
                            color={gradientRule?.midpoint?.color}
                            theme={theme}
                            onChange={(value) => {
                              form.setValue('gradientRule.midpoint.color', value)
                            }}
                          />
                        </Atoms.DropdownPopover>
                      </Ariakit.PopoverProvider>
                    </div>
                  </div>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Max point</FormLabel>
                  <div className="flex items-center gap-3">
                    <div className="grow basis-0">
                      <NativeSelect
                        value={gradientRule?.maxpoint?.type ?? 'MAX'}
                        onChange={(event) => {
                          const value = event.target.value
                          form.setValue('gradientRule.maxpoint.type', value as InterpolationPoint['type'])
                          if (value === 'MAX') {
                            form.setValue('gradientRule.maxpoint.value', '')
                          }
                        }}
                      >
                        <option value="MAX">Max value</option>
                        <option value="NUMBER">Number</option>
                      </NativeSelect>
                    </div>

                    {gradientRule?.maxpoint?.type === 'NUMBER' ? (
                      <div className="grow basis-0">
                        <label
                          aria-label="formula"
                          className="flex h-[36px] grow items-center gap-0.5 rounded-lg border border-[#ADABA8] px-3 has-[:disabled]:border-none has-[:disabled]:bg-[#F5F4F2]"
                        >
                          <input
                            value={gradientRule?.maxpoint?.value ?? ''}
                            onChange={(event) => form.setValue('gradientRule.maxpoint.value', event.target.value)}
                            className="h-full grow truncate text-sm !outline-none"
                          />
                        </label>
                      </div>
                    ) : null}

                    <div className="shrink-0">
                      <Ariakit.PopoverProvider>
                        <Ariakit.PopoverDisclosure
                          render={<FormatButton className="ring-[1px] ring-inset ring-[#EAE7E4]" />}
                        >
                          <Icon data={Icons.bucketColor} />
                        </Ariakit.PopoverDisclosure>

                        <Atoms.DropdownPopover className="p-2" render={<Ariakit.Popover />}>
                          <ColorSelector
                            color={gradientRule?.maxpoint?.color}
                            theme={theme}
                            onChange={(value) => {
                              form.setValue('gradientRule.maxpoint.color', value)
                            }}
                          />
                        </Atoms.DropdownPopover>
                      </Ariakit.PopoverProvider>
                    </div>
                  </div>
                </FormGroup>
              </Ariakit.TabPanel>
            </div>
          </div>

          <div className="mt-2 border-t-[0.5px] border-[#EAE7E4] py-2">
            <button
              type="button"
              className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
              onClick={onAddRule}
            >
              <Icon legacyName="plus" />
              Add another rule
            </button>
          </div>
        </div>

        <div className="mt-auto flex shrink-0 items-center justify-end gap-2 border-t-[0.5px] border-[#EAE7E4] px-4 py-2">
          <button
            type="button"
            className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex h-[36px] items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-4 text-[13px] text-[white]"
            onClick={handleSubmit}
          >
            Save
          </button>
        </div>
      </div>
    </Ariakit.TabProvider>
  )
}

interface SampleGradientColorsProps {
  gradientRule: GradientRule
  theme: SpreadsheetTheme
}

function SampleGradientColors({ gradientRule, theme }: SampleGradientColorsProps) {
  const sampleGradientColors = getGradientColors([[...Array(5)].map((_, idx) => [idx * 20])], gradientRule, theme).flat(
    2,
  )

  return (
    <div className="grid h-full w-full grid-cols-5">
      {sampleGradientColors.map((backgroundColor, idx) => {
        return (
          <div
            key={idx}
            style={{
              backgroundColor,
            }}
          />
        )
      })}
    </div>
  )
}

interface RuleProps extends Pick<ConditionalFormatEditorProps, 'sheetId' | 'onDeleteRule' | 'theme'> {
  rule: ConditionalFormatRule
  onSelect: () => void
}

function Rule({ rule, sheetId, onDeleteRule, theme, onSelect }: RuleProps) {
  const title = rule.gradientRule ? 'Color scale' : 'Single color'
  const api = useSpreadsheetApi()
  const { rangeToFormula } = useFormulaRangeHelpers({
    sheetId,
  })

  return (
    <Ariakit.Button
      render={<div />}
      className="flex min-w-0 items-center gap-2"
      onClick={onSelect}
      onMouseEnter={() => {
        api?.mark?.(rule.ranges)
      }}
      onMouseLeave={() => {
        api?.unmark()
      }}
      onFocusCapture={() => {
        api?.mark?.(rule.ranges)
      }}
      onBlurCapture={() => {
        api?.unmark()
      }}
    >
      <div className="flex min-w-0 grow items-center gap-3">
        <div
          style={createRulePreviewStyle(rule.booleanRule?.format, theme)}
          className="relative isolate flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg text-sm ring-[0.5px] ring-inset ring-[black]/15"
        >
          {rule.gradientRule ? (
            <div className="absolute inset-0 -z-10">
              <SampleGradientColors gradientRule={rule.gradientRule} theme={theme} />
            </div>
          ) : null}
          123
        </div>

        <div className="flex min-w-0 grow flex-col gap-1">
          <p className="text-sm font-semibold">{title}</p>
          <div className="flex min-w-0 !flex-wrap gap-1">
            {rule.ranges.map((range, rangeIndex) => {
              const address = rangeToFormula(range)
              return (
                <span key={`${address}${rangeIndex}`} className="shrink-0 whitespace-nowrap text-sm text-[#5C5958]">
                  {address}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="flex size-[36px] shrink-0 items-center justify-center"
        aria-label={s('Delete rule')}
        onClick={(event) => {
          event.stopPropagation()
          api?.unmark()
          onDeleteRule(rule)
        }}
      >
        <Icon legacyName="trash" />
      </button>
    </Ariakit.Button>
  )
}

interface RulesProps
  extends Pick<ConditionalFormatEditorProps, 'conditionalFormats' | 'sheetId' | 'onDeleteRule' | 'theme'> {
  onNewRule: () => void
  onSelectRule: (rule: ConditionalFormatRule) => void
}

function Rules({ conditionalFormats, sheetId, onDeleteRule, theme, onNewRule, onSelectRule }: RulesProps) {
  return (
    <div className="min-h-0 grow overflow-y-auto p-4">
      <div className="flex flex-col gap-3 border-b-[0.5px] border-[#EAE7E4] py-2 empty:hidden">
        {conditionalFormats.map((rule) => (
          <Rule
            key={rule.id}
            rule={rule}
            sheetId={sheetId}
            onDeleteRule={onDeleteRule}
            theme={theme}
            onSelect={() => onSelectRule(rule)}
          />
        ))}
      </div>

      <div className="py-2">
        <button
          type="button"
          className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
          onClick={onNewRule}
        >
          <Icon legacyName="plus" />
          {conditionalFormats.length > 0 ? 'Add another rule' : 'Add rule'}
        </button>
      </div>
    </div>
  )
}

type ConditionalFormatState = { type: 'default' } | { type: 'editRule'; rule: ConditionalFormatRule }

function ConditionalFormat({
  conditionalFormats,
  sheetId,
  onDeleteRule,
  theme,
  idCreationStrategy,
  onCreateRule,
  onPreviewRule,
  onUpdateRule,
}: ConditionalFormatEditorProps) {
  const api = useSpreadsheetApi()
  const [state, setState] = useState<ConditionalFormatState>(() => ({ type: 'default' }))

  const onNewRule = () => {
    const activeCell = api?.getActiveSheet()?.getActiveCell()
    const selections = api?.getActiveSheet()?.getSelections()
    const finalSelections = selections?.length ? selections : selectionFromActiveCell(activeCell as CellInterface)
    const id = idCreationStrategy?.('conditional-format') ?? uuid()
    const newRule: ConditionalFormatRule = {
      id,
      ranges: finalSelections.map((sel) => {
        return {
          ...sel.range,
          sheetId,
        }
      }),
      booleanRule: {
        condition: {},
        format: {},
      },
    }

    onCreateRule(newRule)
    setState({ type: 'editRule', rule: newRule })
  }

  return (
    <Fragment>
      {state.type === 'default' ? (
        <Rules
          conditionalFormats={conditionalFormats}
          sheetId={sheetId}
          onDeleteRule={onDeleteRule}
          theme={theme}
          onSelectRule={(rule) => setState({ type: 'editRule', rule })}
          onNewRule={onNewRule}
        />
      ) : null}

      {state.type === 'editRule' ? (
        <RuleEditor
          key={state.rule.id}
          rule={state.rule}
          sheetId={sheetId}
          theme={theme}
          onChange={onPreviewRule}
          onCancel={() => {
            // Cancel editing by reverting rule to original state
            onPreviewRule(state.rule)
            setState({ type: 'default' })
          }}
          onSubmit={(rule) => {
            onUpdateRule(rule, state.rule)
            setState({ type: 'default' })
          }}
          onNewRule={onNewRule}
        />
      ) : null}
    </Fragment>
  )
}

export function ConditionalFormatDialog(props: ConditionalFormatEditorProps) {
  const [open, setOpen] = useConditionalFormatDialogState()

  return (
    <SidebarDialog open={open} setOpen={setOpen}>
      <div className="flex h-full min-h-0 flex-col">
        <SidebarDialogHeader title="Conditional formatting" />
        <ConditionalFormat {...props} />
      </div>
    </SidebarDialog>
  )
}

function strings() {
  return {
    Close: c('sheets_2025:Spreadsheet sidebar conditional format dialog close').t`Close`,
    'Delete range': c('sheets_2025:Spreadsheet sidebar conditional format dialog delete range').t`Delete range`,
    'Delete rule': c('sheets_2025:Spreadsheet sidebar conditional format dialog delete rule').t`Delete rule`,
  }
}
