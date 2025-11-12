/* eslint-disable no-nested-ternary */

import * as Ariakit from '@ariakit/react'
import { getInitialDataValidationValues, useDataValidationDialogState } from '@rowsncolumns/spreadsheet-state'
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
import { Button, FormCheckbox, FormGroup, FormLabel, Input, Select, SelectItem, SelectPopover } from './shared'
import { FUNCTION_DESCRIPTIONS } from '../../constants'
import { useUI } from '../../ui-store'

const { s } = createStringifier(strings)

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
    <Button
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

        <Button
          type="button"
          className="flex size-[36px] shrink-0 items-center justify-center rounded-lg"
          aria-label={s('Delete data validation rule')}
          onClick={(event) => {
            event.stopPropagation()
            api?.unmark()
            onDelete()
          }}
        >
          <Icon legacyName="trash" />
        </Button>
      </div>
    </Button>
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
        <Button
          type="button"
          className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
          onClick={onNewRule}
        >
          <Icon legacyName="plus" />
          {rules.length > 0 ? s('Add another named range') : s('Add named range')}
        </Button>
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
              <FormLabel>{s('Apply to range')}</FormLabel>
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
                            placeholder={s('Select a range')}
                            autoFocus={rangeIndex === formValue.ranges.length - 1}
                            className="mb-0 w-full"
                          />
                        </div>

                        {canDelete ? (
                          <Button
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
                          </Button>
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
                    {s('Add another range')}
                  </Button>
                </div>
              </div>
            </FormGroup>

            <FormGroup>
              <FormLabel>{s('Validation rules')}</FormLabel>
              <div className="flex flex-col gap-2">
                <Ariakit.SelectProvider
                  value={formValue?.condition?.type ?? CONDITION_NONE}
                  setValue={(value: ConditionType) => {
                    form.setValue('condition.type', value)
                    form.setValue(
                      'condition.values',
                      getInitialDataValidationValues(value, formValue.condition?.values ?? []),
                    )
                  }}
                >
                  <Select />
                  <SelectPopover sameWidth>
                    <Ariakit.SelectGroup className="py-2">
                      {VALIDATION_CONDITION_LABELS.map(({ condition, label }) => (
                        <SelectItem key={condition} value={condition}>
                          {label}
                        </SelectItem>
                      ))}
                    </Ariakit.SelectGroup>
                  </SelectPopover>
                </Ariakit.SelectProvider>

                {showFromValue ? (
                  formValue.condition?.type === 'CUSTOM_FORMULA' || formValue.condition?.type === 'ONE_OF_RANGE' ? (
                    <div className="flex items-center">
                      <FormulaInput
                        onChange={(value) => {
                          form.setValue(`condition.values.${0}.userEnteredValue`, value)
                        }}
                        value={fromValue ?? '='}
                        required
                        placeholder={s('Enter a formula')}
                        autoFocus
                        functionDescriptions={FUNCTION_DESCRIPTIONS}
                        className="mb-0 w-full"
                      />
                    </div>
                  ) : (
                    <Input
                      placeholder={s('Enter value')}
                      value={fromValue}
                      onChange={(e) => form.setValue(`condition.values.${0}.userEnteredValue`, e.target.value)}
                    />
                  )
                ) : null}

                {showToValue ? (
                  <Input
                    placeholder={s('Enter value')}
                    value={toValue}
                    onChange={(event) => form.setValue(`condition.values.${1}.userEnteredValue`, event.target.value)}
                  />
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
                <FormCheckbox>{s('Allow blanks')}</FormCheckbox>
              </Ariakit.CheckboxProvider>
            </FormGroup>

            <div className="mt-2 border-t-[0.5px] border-[#EAE7E4] py-2">
              <Button
                ref={addAnotherButtonRef}
                type="submit"
                className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
              >
                <Icon legacyName="plus" />
                {s('Add another named range')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto flex shrink-0 items-center justify-end gap-2 border-t-[0.5px] border-[#EAE7E4] px-4 py-2">
        <Button
          type="button"
          className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
          onClick={onDone}
        >
          {s('Cancel')}
        </Button>
        <Button
          type="submit"
          className="inline-flex h-[36px] items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-4 text-[13px] text-[white]"
        >
          {s('Save')}
        </Button>
      </div>
    </form>
  )
}

type DataValidationState = { type: 'list' } | { type: 'editRule'; rule: DataValidationRuleRecord }

function DataValidation() {
  const dataValidations = useUI((ui) => ui.legacy.dataValidations)
  const sheetId = useUI((ui) => ui.legacy.activeSheetId)
  const onCreateRule = useUI((ui) => ui.legacy.onCreateDataValidationRule)
  const onUpdateRule = useUI((ui) => ui.legacy.onUpdateDataValidationRule)
  const onDeleteRule = useUI((ui) => ui.legacy.onDeleteDataValidationRule)

  const [state, setState] = useState<DataValidationState>({ type: 'list' })
  const api = useSpreadsheetApi()

  const onNewRule = () => {
    const id = uuid() // TODO: idCreationStrategy("data-validation")?
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

export function DataValidationDialog() {
  const [open, setOpen] = useDataValidationDialogState()

  return (
    <SidebarDialog open={open} setOpen={setOpen}>
      <div className="flex h-full min-h-0 flex-col">
        <SidebarDialogHeader title={s('Data validation')} />
        <DataValidation />
      </div>
    </SidebarDialog>
  )
}

function strings() {
  return {
    'Delete data validation rule': c('sheets_2025:Spreadsheet sidebar data validation dialog')
      .t`Delete data validation rule`,
    'Data validation': c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Data validation`,
    'Add another named range': c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Add another named range`,
    'Add named range': c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Add named range`,
    'Apply to range': c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Apply to range`,
    'Select a range': c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Select a range`,
    'Add another range': c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Add another range`,
    'Validation rules': c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Validation rules`,
    'Enter a formula': c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Enter a formula`,
    'Enter value': c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Enter value`,
    'Allow blanks': c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Allow blanks`,
    Formula: c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Formula`,
    Cancel: c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Cancel`,
    Save: c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Save`,
  }
}
