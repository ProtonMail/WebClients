import { useSheetsMessages } from '../../SheetsDependenciesProvider'
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
  CONDITION_NONE,
  type ConditionType,
  shouldShowFromValue,
  shouldShowToValue,
  type InterpolationPoint,
  getStringifiedColor,
} from '@rowsncolumns/spreadsheet'
import { Icon } from '../ui'
import * as Atoms from '../atoms'

import * as Ariakit from '@ariakit/react'
import omit from 'lodash/omit'
import { clsx } from 'clsx'

import { forwardRef, Fragment, useState, useMemo, useEffect } from 'react'
import * as Icons from '../icons'
import { SidebarDialog, SidebarDialogHeader } from './SidebarDialog'
import { produce } from 'immer'
import { useForm } from 'react-hook-form'
import { FUNCTION_DESCRIPTIONS } from '../../constants'
import { useEvent } from '../utils'
import { Button, FormGroup, FormLabel, Input, Select, SelectItem, SelectPopover } from './shared'
import { useUI } from '../../ui-store'
import { ColorPicker } from '../shared/ColorPicker'

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
    <Button
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
      render={<Button type="button" />}
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
  const messages = useSheetsMessages()

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
            <Tab id={TABS.SINGLE_COLOR}>{messages.conditionalFormatDialog['Single color']}</Tab>
            <Tab id={TABS.COLOR_SCALE}>{messages.conditionalFormatDialog['Color scale']}</Tab>
          </Ariakit.TabList>
        </div>

        <div className="grow overflow-y-auto px-4">
          <div className="py-4">
            <div className="flex flex-col gap-4">
              <FormGroup>
                <FormLabel className="text-sm font-semibold">
                  {messages.conditionalFormatDialog['Apply to range']}
                </FormLabel>

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
                              placeholder={messages.conditionalFormatDialog['Select a range']}
                              autoFocus={rangeIndex === formValue.ranges.length - 1}
                              className="mb-0 w-full"
                            />
                          </div>

                          {canDelete ? (
                            <button
                              type="button"
                              className="flex size-[36px] shrink-0 items-center justify-center"
                              aria-label={messages.conditionalFormatDialog['Delete range']}
                              onClick={() => {
                                form.setValue(
                                  'ranges',
                                  formValue.ranges.filter((_, i) => rangeIndex !== i),
                                )
                              }}
                            >
                              <Icon data={Icons.trash} />
                            </button>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>

                  <div>
                    <Button
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
                      {messages.conditionalFormatDialog['Add another range']}
                    </Button>
                  </div>
                </div>
              </FormGroup>

              <Ariakit.TabPanel tabId={TABS.SINGLE_COLOR} className="flex flex-col gap-4">
                <FormGroup>
                  <FormLabel>{messages.conditionalFormatDialog['Format rules']}</FormLabel>
                  <div className="flex flex-col gap-2">
                    <Ariakit.SelectProvider
                      value={booleanRule?.condition?.type ?? CONDITION_NONE}
                      setValue={(value: ConditionType) => {
                        form.setValue('booleanRule.condition.type', value)
                        form.setValue('booleanRule.condition.values', booleanRule?.condition?.values ?? [])
                      }}
                    >
                      <Select />
                      <SelectPopover sameWidth>
                        <Ariakit.SelectGroup className="py-2">
                          <SelectItem value={CONDITION_NONE}>{messages.conditionalFormatDialog.None}</SelectItem>
                          {CONDITION_LABELS.map(({ condition }) => {
                            return (
                              <SelectItem key={condition} value={condition}>
                                {messages.conditions[condition]}
                              </SelectItem>
                            )
                          })}
                        </Ariakit.SelectGroup>
                      </SelectPopover>
                    </Ariakit.SelectProvider>

                    {showFromValue ? (
                      booleanRule?.condition?.type === 'CUSTOM_FORMULA' ? (
                        <div className="flex items-center">
                          <FormulaInput
                            onChange={(value) => {
                              form.setValue(`booleanRule.condition.values.${0}.userEnteredValue`, value)
                            }}
                            value={fromValue ?? '='}
                            required
                            placeholder={messages.conditionalFormatDialog['Enter a formula']}
                            autoFocus
                            functionDescriptions={FUNCTION_DESCRIPTIONS}
                            className="mb-0 w-full"
                          />
                        </div>
                      ) : (
                        <Input
                          placeholder={messages.conditionalFormatDialog['Enter value']}
                          value={fromValue ?? ''}
                          onChange={(e) =>
                            form.setValue(`booleanRule.condition.values.${0}.userEnteredValue`, e.target.value)
                          }
                        />
                      )
                    ) : null}

                    {showToValue ? (
                      <Input
                        placeholder={messages.conditionalFormatDialog['Enter value']}
                        value={toValue ?? ''}
                        onChange={(e) =>
                          form.setValue(`booleanRule.condition.values.${1}.userEnteredValue`, e.target.value)
                        }
                      />
                    ) : null}
                  </div>
                </FormGroup>

                <FormGroup>
                  <FormLabel>{messages.conditionalFormatDialog['Format style']}</FormLabel>
                  <div className="flex items-center gap-1">
                    <FormatToggleButton
                      checked={Boolean(booleanRule?.format?.textFormat?.bold)}
                      onClick={() => {
                        form.setValue('booleanRule.format.textFormat.bold', !booleanRule?.format?.textFormat?.bold)
                      }}
                    >
                      <Icon data={Icons.textBold} />
                    </FormatToggleButton>

                    <FormatToggleButton
                      checked={Boolean(booleanRule?.format?.textFormat?.italic)}
                      onClick={() => {
                        form.setValue('booleanRule.format.textFormat.italic', !booleanRule?.format?.textFormat?.italic)
                      }}
                    >
                      <Icon data={Icons.textItalic} />
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
                      <Icon data={Icons.textUnderline} />
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
                      <Icon data={Icons.textStrikethrough} />
                    </FormatToggleButton>

                    <Ariakit.PopoverProvider>
                      <Ariakit.PopoverDisclosure render={<FormatButton />}>
                        <Icon
                          data={Icons.textColor}
                          style={{
                            '--selected-color': getStringifiedColor(booleanRule?.format?.textFormat?.color, theme),
                          }}
                        />
                      </Ariakit.PopoverDisclosure>

                      <Atoms.DropdownPopover className="p-2" render={<Ariakit.Popover />}>
                        <ColorPicker
                          selectedColor={booleanRule?.format?.textFormat?.color ?? undefined}
                          onChange={(value) => {
                            form.setValue('booleanRule.format.textFormat.color', value)
                          }}
                        />
                      </Atoms.DropdownPopover>
                    </Ariakit.PopoverProvider>

                    <Ariakit.PopoverProvider>
                      <Ariakit.PopoverDisclosure render={<FormatButton />}>
                        <Icon
                          data={Icons.bucketColor}
                          style={{
                            '--selected-color': getStringifiedColor(booleanRule?.format?.backgroundColor, theme),
                          }}
                        />
                      </Ariakit.PopoverDisclosure>

                      <Atoms.DropdownPopover className="p-2" render={<Ariakit.Popover />}>
                        <ColorPicker
                          selectedColor={booleanRule?.format?.backgroundColor ?? undefined}
                          onChange={(value) => {
                            form.setValue('booleanRule.format.backgroundColor', value)
                          }}
                        />
                      </Atoms.DropdownPopover>
                    </Ariakit.PopoverProvider>
                  </div>
                </FormGroup>

                <FormGroup>
                  <FormLabel>{messages.conditionalFormatDialog.Preview}</FormLabel>
                  <div
                    className="flex h-[48px] items-center justify-center rounded-lg bg-[#F5F4F2] [[data-theme-mode=dark]_&]:!bg-[--background-weak]"
                    style={createRulePreviewStyle(booleanRule?.format, theme)}
                  >
                    <span className="text-sm">AaBbCcYyZz</span>
                  </div>
                </FormGroup>
              </Ariakit.TabPanel>

              <Ariakit.TabPanel tabId={TABS.COLOR_SCALE} className="flex flex-col gap-4">
                <FormGroup>
                  <FormLabel>{messages.conditionalFormatDialog['Min point']}</FormLabel>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex grow basis-0 flex-col">
                      <Ariakit.SelectProvider
                        value={gradientRule?.minpoint?.type ?? 'MIN'}
                        setValue={(value) => {
                          form.setValue('gradientRule.minpoint', {
                            ...gradientRule?.minpoint,
                            type: value,
                            value: value === 'MIN' ? '' : gradientRule?.minpoint?.value,
                          } as InterpolationPoint)
                        }}
                      >
                        <Select />
                        <SelectPopover sameWidth>
                          <Ariakit.SelectGroup className="py-2">
                            <SelectItem value="MIN">{messages.conditionalFormatDialog['Min value']}</SelectItem>
                            <SelectItem value="NUMBER">{messages.conditionalFormatDialog.Number}</SelectItem>
                          </Ariakit.SelectGroup>
                        </SelectPopover>
                      </Ariakit.SelectProvider>
                    </div>

                    {gradientRule?.minpoint?.type === 'NUMBER' ? (
                      <div className="grow basis-0">
                        <Input
                          value={gradientRule?.minpoint?.value ?? ''}
                          onChange={(event) => form.setValue('gradientRule.minpoint.value', event.target.value)}
                        />
                      </div>
                    ) : null}

                    <div className="shrink-0">
                      <Ariakit.PopoverProvider>
                        <Ariakit.PopoverDisclosure render={<FormatButton className="border-[#EAE7E4]" />}>
                          <Icon
                            data={Icons.bucketColor}
                            style={{ '--selected-color': getStringifiedColor(gradientRule?.minpoint?.color, theme) }}
                          />
                        </Ariakit.PopoverDisclosure>

                        <Atoms.DropdownPopover className="p-2" render={<Ariakit.Popover />}>
                          <ColorPicker
                            selectedColor={gradientRule?.minpoint?.color}
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
                  <FormLabel>{messages.conditionalFormatDialog['Mid point']}</FormLabel>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex grow basis-0 flex-col">
                      <Ariakit.SelectProvider
                        value={gradientRule?.midpoint?.type ?? CONDITION_NONE}
                        setValue={(value) => {
                          form.setValue('gradientRule.midpoint.type', value as InterpolationPoint['type'])
                          if (value === CONDITION_NONE) {
                            form.setValue('gradientRule.midpoint.value', '')
                          }
                        }}
                      >
                        <Select />
                        <SelectPopover sameWidth>
                          <Ariakit.SelectGroup className="py-2">
                            <SelectItem value={CONDITION_NONE}>{messages.conditionalFormatDialog.None}</SelectItem>
                            <SelectItem value="NUMBER">{messages.conditionalFormatDialog.Number}</SelectItem>
                          </Ariakit.SelectGroup>
                        </SelectPopover>
                      </Ariakit.SelectProvider>
                    </div>

                    {gradientRule?.midpoint?.type === 'NUMBER' ? (
                      <div className="grow basis-0">
                        <Input
                          value={gradientRule?.midpoint?.value ?? ''}
                          onChange={(event) => form.setValue('gradientRule.midpoint.value', event.target.value)}
                        />
                      </div>
                    ) : null}

                    <div className="shrink-0">
                      <Ariakit.PopoverProvider>
                        <Ariakit.PopoverDisclosure render={<FormatButton className="border-[#EAE7E4]" />}>
                          <Icon
                            data={Icons.bucketColor}
                            style={{ '--selected-color': getStringifiedColor(gradientRule?.midpoint?.color, theme) }}
                          />
                        </Ariakit.PopoverDisclosure>

                        <Atoms.DropdownPopover className="p-2" render={<Ariakit.Popover />}>
                          <ColorPicker
                            selectedColor={gradientRule?.midpoint?.color}
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
                  <FormLabel>{messages.conditionalFormatDialog['Max point']}</FormLabel>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex grow basis-0 flex-col">
                      <Ariakit.SelectProvider
                        value={gradientRule?.maxpoint?.type ?? 'MAX'}
                        setValue={(value) => {
                          form.setValue('gradientRule.maxpoint.type', value as InterpolationPoint['type'])
                          if (value === 'MAX') {
                            form.setValue('gradientRule.maxpoint.value', '')
                          }
                        }}
                      >
                        <Select />
                        <SelectPopover sameWidth>
                          <Ariakit.SelectGroup className="py-2">
                            <SelectItem value="MAX">{messages.conditionalFormatDialog['Max value']}</SelectItem>
                            <SelectItem value="NUMBER">{messages.conditionalFormatDialog.Number}</SelectItem>
                          </Ariakit.SelectGroup>
                        </SelectPopover>
                      </Ariakit.SelectProvider>
                    </div>

                    {gradientRule?.maxpoint?.type === 'NUMBER' ? (
                      <div className="grow basis-0">
                        <Input
                          value={gradientRule?.maxpoint?.value ?? ''}
                          onChange={(event) => form.setValue('gradientRule.maxpoint.value', event.target.value)}
                        />
                      </div>
                    ) : null}

                    <div className="shrink-0">
                      <Ariakit.PopoverProvider>
                        <Ariakit.PopoverDisclosure render={<FormatButton className="border-[#EAE7E4]" />}>
                          <Icon
                            data={Icons.bucketColor}
                            style={{ '--selected-color': getStringifiedColor(gradientRule?.maxpoint?.color, theme) }}
                          />
                        </Ariakit.PopoverDisclosure>

                        <Atoms.DropdownPopover className="p-2" render={<Ariakit.Popover />}>
                          <ColorPicker
                            selectedColor={gradientRule?.maxpoint?.color}
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

          {/* <div className="mt-2 border-t-[0.5px] border-[#EAE7E4] py-2">
            <Button
              type="button"
              className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
              onClick={onAddRule}
            >
              <Icon data={plus} />
              {s('Add another rule')}
            </Button>
          </div> */}
        </div>

        <div className="mt-auto flex shrink-0 items-center justify-end gap-2 border-t-[0.5px] border-[#EAE7E4] px-4 py-2">
          <Button
            type="button"
            className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
            onClick={onCancel}
          >
            {messages.conditionalFormatDialog.Cancel}
          </Button>
          <Button
            type="button"
            className="inline-flex h-[36px] items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-4 text-[13px] text-[white]"
            onClick={handleSubmit}
          >
            {messages.conditionalFormatDialog.Save}
          </Button>
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
  const messages = useSheetsMessages()

  const title = rule.gradientRule
    ? messages.conditionalFormatDialog['Color scale']
    : messages.conditionalFormatDialog['Single color']
  const api = useSpreadsheetApi()
  const { rangeToFormula } = useFormulaRangeHelpers({
    sheetId,
  })

  return (
    <Button
      render={<div />}
      className="flex min-w-0 items-center gap-2"
      onClick={() => {
        api?.unmark()
        onSelect()
      }}
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
          className="relative isolate flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg text-sm ring-[0.5px] ring-inset ring-[black]/15 [[data-theme-mode=dark]_&]:!bg-[--background-weak] [[data-theme-mode=dark]_&]:!ring-[--border-weak]"
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
          <div className="flex min-w-0 !flex-wrap gap-1 truncate">
            {rule.ranges.map((range, rangeIndex) => {
              const address = rangeToFormula(range)
              return (
                <span key={`${address}${rangeIndex}`} className="shrink-0 text-sm text-[#5C5958]">
                  {address}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <Button
        type="button"
        className="flex size-[36px] shrink-0 items-center justify-center rounded-lg"
        aria-label={messages.conditionalFormatDialog['Delete rule']}
        onClick={(event) => {
          event.stopPropagation()
          api?.unmark()
          onDeleteRule(rule)
        }}
      >
        <Icon data={Icons.trash} />
      </Button>
    </Button>
  )
}

interface RulesProps extends Pick<
  ConditionalFormatEditorProps,
  'conditionalFormats' | 'sheetId' | 'onDeleteRule' | 'theme'
> {
  onNewRule: () => void
  onSelectRule: (rule: ConditionalFormatRule) => void
}

function Rules({ conditionalFormats, sheetId, onDeleteRule, theme, onNewRule, onSelectRule }: RulesProps) {
  const messages = useSheetsMessages()

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
        <Button
          type="button"
          className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
          onClick={onNewRule}
        >
          <Icon data={Icons.plus} />
          {conditionalFormats.length > 0
            ? messages.conditionalFormatDialog['Add another rule']
            : messages.conditionalFormatDialog['Add rule']}
        </Button>
      </div>
    </div>
  )
}

type ConditionalFormatState = { type: 'default' } | { type: 'editRule'; rule: ConditionalFormatRule }

function ConditionalFormat() {
  const sheetId = useUI((ui) => ui.legacy.activeSheetId)
  const conditionalFormats = useUI((ui) => ui.legacy.conditionalFormats)
  const theme = useUI((ui) => ui.legacy.theme)
  const onCreateRule = useUI((ui) => ui.legacy.onCreateConditionalFormattingRule)
  const onUpdateRule = useUI((ui) => ui.legacy.onUpdateConditionalFormattingRule)
  const onDeleteRule = useUI((ui) => ui.legacy.onDeleteConditionalFormattingRule)
  const onPreviewRule = useUI((ui) => ui.legacy.onPreviewConditionalFormattingRule)
  const api = useSpreadsheetApi()
  const [state, setState] = useState<ConditionalFormatState>(() => ({ type: 'default' }))

  const onNewRule = () => {
    const activeCell = api?.getActiveSheet()?.getActiveCell()
    const selections = api?.getActiveSheet()?.getSelections()
    const finalSelections = selections?.length ? selections : selectionFromActiveCell(activeCell as CellInterface)
    const id = uuid() // TODO: idCreationStrategy("conditional-format")?

    const newRule: ConditionalFormatRule = {
      id,
      ranges: finalSelections.map((sel) => ({ ...sel.range, sheetId })),
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

export function ConditionalFormatDialog() {
  const messages = useSheetsMessages()

  const [open, setOpen] = useConditionalFormatDialogState()

  return (
    <SidebarDialog open={open} setOpen={setOpen}>
      <div className="flex h-full min-h-0 flex-col">
        <SidebarDialogHeader title={messages.conditionalFormatDialog['Conditional formatting']} />
        <ConditionalFormat />
      </div>
    </SidebarDialog>
  )
}

export const conditionalFormatDialogMessages = {
  conditionalFormatDialog: {
    Close: `Close`,
    'Delete range': `Delete range`,
    'Delete rule': `Delete rule`,
    'Conditional formatting': `Conditional formatting`,
    'Single color': `Single color`,
    'Color scale': `Color scale`,
    'Apply to range': `Apply to range`,
    'Select a range': `Select a range`,
    'Add another range': `Add another range`,
    'Format rules': `Format rules`,
    None: `None`,
    'Enter a formula': `Enter a formula`,
    'Enter value': `Enter value`,
    'Format style': `Format style`,
    Preview: `Preview`,
    'Add another rule': `Add another rule`,
    'Add rule': `Add rule`,
    Cancel: `Cancel`,
    Save: `Save`,
    'Min point': `Min point`,
    'Min value': `Min value`,
    Number: `Number`,
    'Mid point': `Mid point`,
    'Max point': `Max point`,
    'Max value': `Max value`,
  },
}
