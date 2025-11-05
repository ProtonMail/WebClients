/* eslint-disable no-nested-ternary */

import * as Ariakit from '@ariakit/react'
import {
  getInitialDataValidationValues,
  useDataValidationDialogState,
  type UseSpreadsheetProps,
  type useSpreadsheetState,
} from '@rowsncolumns/spreadsheet-state'
import { uuid } from '@rowsncolumns/utils'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { SidebarDialog, SidebarDialogHeader } from './SidebarDialog'
import {
  CONDITION_LABELS,
  FormulaInput,
  getUserSelections,
  type SheetRange,
  useFormulaRangeHelpers,
  useSpreadsheetApi,
  type CanvasGridProps,
  type DataValidationRuleRecord,
  CONDITION_NONE,
  VALIDATION_CONDITION_LABELS,
  type ConditionType,
  shouldShowFromValue,
  shouldShowToValue,
} from '@rowsncolumns/spreadsheet'
import { produce } from 'immer'
import { Fragment, useMemo, useRef, useState } from 'react'
import { Icon } from '../ui'
import { createStringifier } from '../../stringifier'
import { c } from 'ttag'
import { FormCheckbox, FormGroup, FormLabel, NativeSelect } from './shared'
import { FUNCTION_DESCRIPTIONS } from '../../constants'

const { s } = createStringifier(strings)

interface DataValidationDialogProps {
  dataValidations: DataValidationRuleRecord[]
  sheetId: number
  functionDescriptions?: CanvasGridProps['functionDescriptions']
  onDeleteRules: ReturnType<typeof useSpreadsheetState>['onDeleteDataValidationRules']
  onUpdateRule: ReturnType<typeof useSpreadsheetState>['onUpdateDataValidationRule']
  onCreateRule: ReturnType<typeof useSpreadsheetState>['onCreateDataValidationRule']
  onDeleteRule: ReturnType<typeof useSpreadsheetState>['onDeleteDataValidationRule']
  idCreationStrategy?: UseSpreadsheetProps['idCreationStrategy']
}

interface DataValidationRuleProps {
  sheetId: number
  rule: DataValidationRuleRecord
  onDelete: () => void
  onSelect: () => void
}

function DataValidationRule({ sheetId, rule, onDelete, onSelect }: DataValidationRuleProps) {
  const api = useSpreadsheetApi()
  const { rangeToFormula } = useFormulaRangeHelpers({ sheetId })

  const label =
    CONDITION_LABELS.find((condition) => condition.condition === rule.condition?.type)?.label ?? rule.condition?.type
  const values = rule.condition?.values?.map((value) => value.userEnteredValue).join(',')

  return (
    <Ariakit.Button
      render={<div />}
      onClick={() => {
        api?.unmark()
        onSelect()
      }}
      className="px-4 hover:bg-[#C2C1C033]/20"
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
      <div className="flex items-center border-b-[0.5px] border-[#EAE7E4] py-3">
        <div className="flex min-w-0 grow flex-col gap-1">
          {label ? <span className="text-sm font-semibold">{label}</span> : null}
          <span className="text-sm">{values}</span>
          <div className="flex !flex-wrap gap-1">
            {rule.ranges.map((range, rangeIndex) => {
              const address = rangeToFormula(range)
              const key = `${rangeIndex}`
              return (
                <span key={key} className="text-sm text-[#5C5958]">
                  {address}
                </span>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          className="flex size-[36px] shrink-0 items-center justify-center"
          aria-label={s('Delete data validation rule')}
          onClick={(event) => {
            event.stopPropagation()
            api?.unmark()
            onDelete()
          }}
        >
          <Icon legacyName="trash" />
        </button>
      </div>
    </Ariakit.Button>
  )
}

interface DataValidationListProps {
  rules: DataValidationRuleRecord[]
  sheetId: number
  onDeleteRule: (rule: DataValidationRuleRecord) => void
  onSelectRule: (rule: DataValidationRuleRecord) => void
  onNewRule: () => void
}

function DataValidationList({ rules, sheetId, onDeleteRule, onSelectRule, onNewRule }: DataValidationListProps) {
  return (
    <div className="min-h-0 grow overflow-y-auto">
      <div className="flex flex-col empty:hidden">
        {rules.map((rule) => (
          <DataValidationRule
            key={rule.id}
            sheetId={sheetId}
            rule={rule}
            onDelete={() => onDeleteRule(rule)}
            onSelect={() => onSelectRule(rule)}
          />
        ))}
      </div>

      <div className="px-4 py-2">
        <button
          type="button"
          className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
          onClick={onNewRule}
        >
          <Icon legacyName="plus" />
          {rules.length > 0 ? 'Add another named range' : 'Add named range'}
        </button>
      </div>
    </div>
  )
}

interface DataValidationRuleEditorProps {
  rule: DataValidationRuleRecord
  sheetId: number
  onSave: (rule: DataValidationRuleRecord) => void
  onDone: () => void
  onNewRule: () => void
}

function DataValidationRuleEditor({ rule, sheetId, onDone, onSave, onNewRule }: DataValidationRuleEditorProps) {
  const form = useForm({ defaultValues: rule })
  const formValue = form.watch()
  const fromValue = formValue.condition?.values?.[0]?.userEnteredValue
  const toValue = formValue.condition?.values?.[1]?.userEnteredValue
  const { formulaToRange, rangeToFormula } = useFormulaRangeHelpers({ sheetId })
  const addAnotherButtonRef = useRef<HTMLButtonElement | null>(null)

  const showFromValue = useMemo(() => {
    return shouldShowFromValue(formValue?.condition?.type ?? undefined)
  }, [formValue?.condition?.type])

  const showToValue = useMemo(() => {
    return shouldShowToValue(formValue?.condition?.type ?? undefined)
  }, [formValue?.condition?.type])

  const onSubmit: SubmitHandler<DataValidationRuleRecord> = (data, event) => {
    onSave(data)

    const addAnother =
      event?.nativeEvent instanceof SubmitEvent && event.nativeEvent.submitter === addAnotherButtonRef.current
    if (addAnother) {
      onNewRule()
    } else {
      onDone()
    }
  }

  return (
    <form className="flex min-h-0 grow flex-col" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grow overflow-y-auto px-4">
        <div className="py-4">
          <div className="flex flex-col gap-4">
            <FormGroup>
              <FormLabel>Apply to range</FormLabel>
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

            <FormGroup>
              <FormLabel>Validation rules</FormLabel>
              <div className="flex flex-col gap-2">
                <NativeSelect
                  value={formValue?.condition?.type ?? CONDITION_NONE}
                  onChange={(event) => {
                    const value = event.target.value as ConditionType
                    form.setValue('condition.type', value)
                    form.setValue(
                      'condition.values',
                      getInitialDataValidationValues(value, formValue.condition?.values ?? []),
                    )
                  }}
                >
                  {VALIDATION_CONDITION_LABELS.map(({ condition, label }) => (
                    <option key={condition} value={condition}>
                      {label}
                    </option>
                  ))}
                </NativeSelect>

                {showFromValue ? (
                  formValue.condition?.type === 'CUSTOM_FORMULA' || formValue.condition?.type === 'ONE_OF_RANGE' ? (
                    <div className="flex items-center">
                      <FormulaInput
                        onChange={(value) => {
                          form.setValue(`condition.values.${0}.userEnteredValue`, value)
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
                        onChange={(e) => form.setValue(`condition.values.${0}.userEnteredValue`, e.target.value)}
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
                      onChange={(event) => form.setValue(`condition.values.${1}.userEnteredValue`, event.target.value)}
                      className="h-full grow truncate text-sm !outline-none"
                    />
                  </label>
                ) : null}
              </div>
            </FormGroup>

            <FormGroup>
              <Ariakit.CheckboxProvider
                value={formValue.allowBlank ?? false}
                setValue={(value) => {
                  form.setValue('allowBlank', value)
                }}
              >
                <FormCheckbox>Allow blanks</FormCheckbox>
              </Ariakit.CheckboxProvider>
            </FormGroup>

            <div className="mt-2 border-t-[0.5px] border-[#EAE7E4] py-2">
              <button
                ref={addAnotherButtonRef}
                type="submit"
                className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
              >
                <Icon legacyName="plus" />
                Add another named range
              </button>
            </div>
          </div>
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
  )
}

type DataValidationState = { type: 'list' } | { type: 'editRule'; rule: DataValidationRuleRecord }

function DataValidation({
  dataValidations,
  sheetId,
  onDeleteRule,
  idCreationStrategy,
  onCreateRule,
  onUpdateRule,
}: DataValidationDialogProps) {
  const [state, setState] = useState<DataValidationState>({ type: 'list' })
  const api = useSpreadsheetApi()

  const onNewRule = () => {
    const id = idCreationStrategy?.('data-validation') ?? uuid()
    const activeCell = api?.getActiveSheet()?.getActiveCell()
    const selections = api?.getActiveSheet()?.getSelections()
    const finalSelections = getUserSelections(activeCell, selections)
    const rule: DataValidationRuleRecord = {
      condition: {},
      id,
      ranges: finalSelections.map((sel) => ({
        ...sel.range,
        sheetId,
      })),
    }
    onCreateRule(rule)
    setState({ type: 'editRule', rule })
  }

  return (
    <Fragment>
      {state.type === 'list' ? (
        <DataValidationList
          rules={dataValidations}
          sheetId={sheetId}
          onDeleteRule={onDeleteRule}
          onSelectRule={(rule) => setState({ type: 'editRule', rule })}
          onNewRule={onNewRule}
        />
      ) : null}

      {state.type === 'editRule' ? (
        <DataValidationRuleEditor
          key={state.rule.id}
          rule={state.rule}
          sheetId={sheetId}
          onDone={() => setState({ type: 'list' })}
          onSave={(updatedRule) => onUpdateRule(updatedRule, state.rule)}
          onNewRule={onNewRule}
        />
      ) : null}
    </Fragment>
  )
}

export function DataValidationDialog(props: DataValidationDialogProps) {
  const [open, setOpen] = useDataValidationDialogState()

  return (
    <SidebarDialog open={open} setOpen={setOpen}>
      <div className="flex h-full min-h-0 flex-col">
        <SidebarDialogHeader title="Data validation" />
        <DataValidation {...props} />
      </div>
    </SidebarDialog>
  )
}

function strings() {
  return {
    'Delete data validation rule': c(
      'sheets_2025:Spreadsheet sidebar data validation dialog delete data validation rule',
    ).t`Delete data validation rule`,
  }
}
