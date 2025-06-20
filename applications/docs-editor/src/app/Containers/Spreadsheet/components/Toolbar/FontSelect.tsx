import type { ReactElement } from 'react'
import type { FontValue } from '../../constants'
import { FONT_LABEL_BY_VALUE, DEFAULT_FONT, AVAILABLE_FONTS } from '../../constants'
import type { ProtonSheetsUIState } from '../../ui-state'
import * as UI from '../ui'
import { c } from 'ttag'
import * as Ariakit from '@ariakit/react'

// A special value to represent the default font.
const DEFAULT_VALUE = '$default$' as const
function renderDefaultLabel() {
  const defaultFont = FONT_LABEL_BY_VALUE[DEFAULT_FONT]
  return c('sheets_2025:Spreadsheet editor toolbar').t`Default (${defaultFont})`
}

export type FontSelectValue = FontValue | typeof DEFAULT_VALUE
export interface FontSelectProps extends UI.SelectProviderProps<FontSelectValue> {
  ui: ProtonSheetsUIState
  render: ReactElement
}

// Extracted in order to use the select context.
function InnerSelect(props: UI.SelectProps) {
  const select = Ariakit.useSelectContext()
  const value = Ariakit.useStoreState(select, 'value')
  if (!value) {
    throw new Error('Unexpected missing value in FontSelect renderLabel')
  }
  const label = value === DEFAULT_VALUE ? renderDefaultLabel() : FONT_LABEL_BY_VALUE[value as FontValue]

  return <UI.Select {...props}>{label}</UI.Select>
}

export function FontSelect({ ui, render: renderSelect, ...props }: FontSelectProps) {
  return (
    <UI.SelectProvider
      value={ui.format.font ?? DEFAULT_VALUE}
      setValue={(value) => ui.format.setFont(value === DEFAULT_VALUE ? undefined : value)}
      {...props}
    >
      <InnerSelect render={renderSelect} />
      <UI.SelectPopover>
        <UI.SelectGroup bottomSeparator>
          <UI.SelectItem value={DEFAULT_VALUE}>{renderDefaultLabel()}</UI.SelectItem>
        </UI.SelectGroup>
        <UI.SelectGroup>
          {AVAILABLE_FONTS.map(({ value, label }) => (
            <UI.SelectItem key={value} value={value}>
              {label}
            </UI.SelectItem>
          ))}
        </UI.SelectGroup>
      </UI.SelectPopover>
    </UI.SelectProvider>
  )
}
