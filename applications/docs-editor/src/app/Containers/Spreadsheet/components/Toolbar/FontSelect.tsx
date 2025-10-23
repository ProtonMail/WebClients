import * as Ariakit from '@ariakit/react'
import type { ReactElement } from 'react'
import { c } from 'ttag'
import type { FontValue } from '../../constants'
import { FONTS, FONT_FAMILY_DEFAULT, FONT_LABEL_BY_VALUE } from '../../constants'
import * as UI from '../ui'
import { useUI } from '../../ui-store'

// A special value to represent the default font.
const DEFAULT_VALUE = '$default$' as const
function renderDefaultLabel() {
  const defaultFont = FONT_LABEL_BY_VALUE[FONT_FAMILY_DEFAULT]
  return c('sheets_2025:Spreadsheet editor toolbar').t`Default (${defaultFont})`
}

export type FontSelectValue = FontValue | typeof DEFAULT_VALUE
export interface FontSelectProps extends Ariakit.SelectProviderProps<FontSelectValue> {
  renderSelect: ReactElement
}

// Extracted in order to use the select context.
function InnerSelect(props: Ariakit.SelectProps) {
  const select = Ariakit.useSelectContext()
  const value = Ariakit.useStoreState(select, 'value')
  if (!value) {
    throw new Error('Unexpected missing value in FontSelect renderLabel')
  }
  let label = value === DEFAULT_VALUE ? renderDefaultLabel() : FONT_LABEL_BY_VALUE[value as FontValue]
  if (!label) {
    label = value as string
  }
  return <Ariakit.Select {...props}>{label}</Ariakit.Select>
}

export function FontSelect({ renderSelect, ...props }: FontSelectProps) {
  const setFont = useUI.$.format.text.fontFamily.set
  const select = Ariakit.useSelectStore({
    value: useUI((ui) => ui.format.text.fontFamily.value) ?? DEFAULT_VALUE,
    focusLoop: true,
    setValue(value) {
      setFont(value === DEFAULT_VALUE ? undefined : value)
    },
  })
  const mounted = Ariakit.useStoreState(select, 'mounted')
  return (
    <Ariakit.SelectProvider store={select} {...props}>
      <InnerSelect render={renderSelect} disabled={useUI((ui) => ui.info.isReadonly)} />
      {mounted && <SelectPopover />}
    </Ariakit.SelectProvider>
  )
}

function SelectPopover() {
  const disabled = useUI((ui) => ui.info.isReadonly)
  return (
    <UI.SelectPopover>
      <UI.SelectGroup bottomSeparator>
        <UI.SelectItem value={DEFAULT_VALUE}>{renderDefaultLabel()}</UI.SelectItem>
      </UI.SelectGroup>
      <UI.SelectGroup>
        {FONTS.map(({ value, label }) => (
          <UI.SelectItem key={value} value={value} disabled={disabled}>
            {label}
          </UI.SelectItem>
        ))}
      </UI.SelectGroup>
    </UI.SelectPopover>
  )
}
