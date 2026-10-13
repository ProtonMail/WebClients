import { useSheetsMessages } from '../../SheetsDependenciesProvider'
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
  const messages = useSheetsMessages()

  const showToValue = shouldShowToValue(conditionType)
  const showFromValue = shouldShowFromValue(conditionType)

  useLayoutEffect(() => {
    if (!showToValue) {
      onChangeToValue('')
    }
  }, [showToValue, onChangeToValue])

  return (
    <FormGroup>
      <FormLabel>{messages.filterByCondition['Filter by condition']}</FormLabel>

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
              <SelectItem value={CONDITION_NONE}>{messages.filterByCondition.None}</SelectItem>
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
          <Input
            value={fromValue}
            onChange={(e) => onChangeFromValue?.(e.target.value)}
            placeholder={messages.filterByCondition['Enter value']}
          />
        ) : null}

        {showToValue ? (
          <Input
            value={toValue}
            onChange={(e) => onChangeToValue?.(e.target.value)}
            placeholder={messages.filterByCondition['Enter value']}
          />
        ) : null}
      </div>
    </FormGroup>
  )
}

export const conditionsMessages = {
  conditions: {
    NUMBER_GREATER_THAN_PREVIOUS: 'Greater than previous',
    NUMBER_GREATER_THAN_EQ_PREVIOUS: 'Greater than or equal to previous',
    NUMBER_LESS_THAN_PREVIOUS: 'Less than previous',
    NUMBER_LESS_THAN_EQ_PREVIOUS: 'Less than or equal to previous',
    DATE_NOT_EQ: 'Date is not equal to',
    NUMBER_GREATER: 'Greater than',
    NUMBER_GREATER_THAN_EQ: 'Greater than or equal to',
    NUMBER_LESS: 'Less than',
    NUMBER_LESS_THAN_EQ: 'Less than or equal to',
    NUMBER_EQ: 'Equal to',
    NUMBER_NOT_EQ: 'Not equal to',
    NUMBER_BETWEEN: 'Between',
    NUMBER_NOT_BETWEEN: 'Not between',
    NUMBER_ABOVE_AVERAGE: 'Above average',
    NUMBER_BELOW_AVERAGE: 'Below average',
    TEXT_CONTAINS: 'Text contains',
    TEXT_NOT_CONTAINS: 'Text does not contain',
    TEXT_STARTS_WITH: 'Text starts with',
    TEXT_ENDS_WITH: 'Text ends with',
    TEXT_EQ: 'Text is exactly',
    TEXT_NOT_EQ: 'Text is not equal',
    TEXT_IS_EMAIL: 'Text is email',
    TEXT_IS_URL: 'Text is URL',
    DATE_EQ: 'Date is equal to',
    DATE_BEFORE: 'Date is before',
    DATE_AFTER: 'Date is after',
    DATE_ON_OR_BEFORE: 'Date is on or before',
    DATE_ON_OR_AFTER: 'Date is on or after',
    DATE_BETWEEN: 'Date is between',
    DATE_NOT_BETWEEN: 'Date is not between',
    DATE_IS_VALID: 'Date is valid',
    DATE_TODAY: 'Today',
    DATE_YESTERDAY: 'Yesterday',
    DATE_TOMORROW: 'Tomorrow',
    DATE_LAST_7_DAYS: 'Last 7 days',
    DATE_LAST_WEEK: 'Last week',
    DATE_THIS_WEEK: 'This week',
    DATE_NEXT_WEEK: 'Next week',
    DATE_LAST_MONTH: 'Last month',
    DATE_THIS_MONTH: 'This month',
    DATE_NEXT_MONTH: 'Next month',
    NUMBER_TOP_N: 'Top N items',
    NUMBER_BOTTOM_N: 'Bottom N items',
    NUMBER_TOP_PERCENT: 'Top N percent',
    NUMBER_BOTTOM_PERCENT: 'Bottom N percent',
    DATE_LAST_QUARTER: 'Last quarter',
    DATE_THIS_QUARTER: 'This quarter',
    DATE_NEXT_QUARTER: 'Next quarter',
    DATE_LAST_YEAR: 'Last year',
    DATE_THIS_YEAR: 'This year',
    DATE_NEXT_YEAR: 'Next year',
    DATE_YEAR_TO_DATE: 'Year to date',
    DATE_IN_Q1: 'Quarter 1',
    DATE_IN_Q2: 'Quarter 2',
    DATE_IN_Q3: 'Quarter 3',
    DATE_IN_Q4: 'Quarter 4',
    DATE_IN_M1: 'January',
    DATE_IN_M2: 'February',
    DATE_IN_M3: 'March',
    DATE_IN_M4: 'April',
    DATE_IN_M5: 'May',
    DATE_IN_M6: 'June',
    DATE_IN_M7: 'July',
    DATE_IN_M8: 'August',
    DATE_IN_M9: 'September',
    DATE_IN_M10: 'October',
    DATE_IN_M11: 'November',
    DATE_IN_M12: 'December',
    BLANK: 'Is empty',
    NOT_BLANK: 'Is not empty',
    ERROR: 'Errors',
    NOT_ERROR: 'No errors',
    CUSTOM_FORMULA: 'Custom formula',
    ONE_OF_LIST: 'Dropdown',
    ONE_OF_RANGE: 'Dropdown (from a range)',
    BOOLEAN: 'Checkbox',
  },
}

export const filterByConditionMessages = {
  filterByCondition: {
    'Filter by condition': `Filter by condition`,
    'Enter value': `Enter value`,

    None: 'None',
  },
}
