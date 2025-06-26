import clsx from '@proton/utils/clsx'
import type { ComponentPropsWithoutRef } from 'react'
import { forwardRef } from 'react'
import * as Ariakit from '@ariakit/react'
import { useStringifier } from '../../stringifier'
import { c } from 'ttag'
import type { ProtonSheetsUIState } from '../../ui-state'
import * as T from './primitives'
import * as UI from '../ui'
import { DEFAULT_FONT_SIZE, FONT_SIZE_MAX_VALUE, FONT_SIZE_MIN_VALUE, FONT_SIZE_SUGGESTIONS } from '../../constants'

export interface FontSizeInputProps extends ComponentPropsWithoutRef<'div'> {
  ui: ProtonSheetsUIState
}

export const FontSizeInput = forwardRef<HTMLDivElement, FontSizeInputProps>(function FontSizeInput(
  { ui, ...props },
  ref,
) {
  const s = useStrings()
  const value = ui.format.text.fontSize.value ?? DEFAULT_FONT_SIZE
  return (
    <div ref={ref} {...props} className={clsx('flex items-center gap-2', props.className)}>
      <T.Item variant="icon-small" legacyIconName="minus" onClick={() => ui.format.text.fontSize.set(value - 1)}>
        {s('Decrease font size')}
      </T.Item>
      <UI.ComboboxProvider
        value={String(value)}
        setValue={(value) => {
          // TODO: this validation stuff and setting the value actually needs to happen on blur
          const valueNumber = Number(value)
          if (Number.isNaN(valueNumber) || valueNumber < FONT_SIZE_MIN_VALUE || valueNumber > FONT_SIZE_MAX_VALUE) {
            return
          }
          ui.format.text.fontSize.set(valueNumber)
        }}
      >
        <Ariakit.ToolbarItem render={<UI.Combobox className="w-16 rounded border p-1" />} />
        <UI.ComboboxPopover>
          {FONT_SIZE_SUGGESTIONS.map((size) => (
            <UI.ComboboxItem key={size} value={String(size)}>
              {size}
            </UI.ComboboxItem>
          ))}
        </UI.ComboboxPopover>
      </UI.ComboboxProvider>
      <T.Item variant="icon-small" legacyIconName="plus" onClick={() => ui.format.text.fontSize.set(value + 1)}>
        {s('Increase font size')}
      </T.Item>
    </div>
  )
})

function useStrings() {
  return useStringifier(() => ({
    'Decrease font size': c('sheets_2025:Spreadsheet editor toolbar').t`Decrease font size`,
    'Increase font size': c('sheets_2025:Spreadsheet editor toolbar').t`Increase font size`,
  }))
}
