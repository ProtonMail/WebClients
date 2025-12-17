import * as Ariakit from '@ariakit/react'
import {
  CONDITION_NONE,
  CONDITION_LABELS,
  type ConditionType,
  shouldShowToValue,
  shouldShowFromValue,
} from '@rowsncolumns/spreadsheet'
import { FormGroup, FormLabel, Input, Select, SelectItem, SelectPopover } from '../Sidebar/shared'
import { useLayoutEffect } from 'react'
import { c } from 'ttag'
import { createStringifier } from '../../stringifier'

const { s } = createStringifier(strings)

type FilterByConditionProps = {
  conditionType?: ConditionType
  onChangeConditionType?: (type: ConditionType | undefined) => void
  toValue: string
  onChangeToValue: (value: string) => void
  fromValue: string
  onChangeFromValue: (value: string) => void
}

export function FilterByCondition({
  conditionType,
  onChangeConditionType,
  fromValue,
  onChangeFromValue,
  toValue,
  onChangeToValue,
}: FilterByConditionProps) {
  const showToValue = shouldShowToValue(conditionType)
  const showFromValue = shouldShowFromValue(conditionType)

  useLayoutEffect(() => {
    if (!showToValue) {
      onChangeToValue('')
    }
  }, [showToValue, onChangeToValue])

  return (
    <FormGroup>
      <FormLabel>{s('Filter by condition')}</FormLabel>

      <div className="flex flex-col gap-2">
        <Ariakit.SelectProvider
          value={conditionType ?? CONDITION_NONE}
          setValue={(value: ConditionType | typeof CONDITION_NONE) => {
            onChangeConditionType?.(value === CONDITION_NONE ? undefined : value)
          }}
        >
          <Select />
          <SelectPopover sameWidth>
            <Ariakit.SelectGroup className="py-2">
              <SelectItem value={CONDITION_NONE}>None</SelectItem>
              {CONDITION_LABELS.map(({ condition, label }) => {
                return (
                  <SelectItem key={condition} value={condition}>
                    {label}
                  </SelectItem>
                )
              })}
            </Ariakit.SelectGroup>
          </SelectPopover>
        </Ariakit.SelectProvider>

        {showFromValue ? (
          <Input
            value={fromValue}
            onChange={(e) => onChangeFromValue?.(e.target.value)}
            placeholder={s('Enter value')}
          />
        ) : null}

        {showToValue ? (
          <Input value={toValue} onChange={(e) => onChangeToValue?.(e.target.value)} placeholder={s('Enter value')} />
        ) : null}
      </div>
    </FormGroup>
  )
}

function strings() {
  return {
    'Filter by condition': c('sheets_2025:Spreadsheet filter menu').t`Filter by condition`,
    'Enter value': c('sheets_2025:Spreadsheet filter menu').t`Enter value`,
  }
}
