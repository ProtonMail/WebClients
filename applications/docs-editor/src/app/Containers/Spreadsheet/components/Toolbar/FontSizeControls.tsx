import * as Ariakit from '@ariakit/react'
import clsx from '@proton/utils/clsx'
import type { ComponentPropsWithoutRef } from 'react'
import { forwardRef, useEffect, useRef } from 'react'
import { c } from 'ttag'
import { FONT_SIZE_DEFAULT, FONT_SIZE_MAX, FONT_SIZE_MIN, FONT_SIZE_SUGGESTIONS } from '../../constants'
import { useStringifier } from '../../stringifier'
import type { ProtonSheetsUIState } from '../../ui-state'
import * as Atoms from '../atoms'
import * as UI from '../ui'
import * as T from './primitives'

export interface FontSizeControlsProps extends ComponentPropsWithoutRef<'div'> {
  ui: ProtonSheetsUIState
}

export const FontSizeControls = forwardRef<HTMLDivElement, FontSizeControlsProps>(function FontSizeControls(
  { ui, ...props },
  ref,
) {
  const s = useStrings()
  const realValue = ui.format.text.fontSize.value ?? FONT_SIZE_DEFAULT
  return (
    <div ref={ref} {...props} className={clsx('flex shrink-0 items-center gap-2', props.className)}>
      <T.Item
        variant="icon-small"
        legacyIconName="minus"
        onClick={ui.withFocusGrid(() => ui.format.text.fontSize.set(realValue - 1))}
        shortcut={
          <Atoms.KbdShortcut>
            <Atoms.Kbd>⌘</Atoms.Kbd>
            <Atoms.Kbd>Shift</Atoms.Kbd>
            <Atoms.Kbd>,</Atoms.Kbd>
          </Atoms.KbdShortcut>
        }
      >
        {s('Decrease font size')}
      </T.Item>
      <FontSizeCombobox ui={ui} realValue={realValue} />
      <T.Item
        variant="icon-small"
        legacyIconName="plus"
        onClick={ui.withFocusGrid(() => ui.format.text.fontSize.set(realValue + 1))}
        shortcut={
          <Atoms.KbdShortcut>
            <Atoms.Kbd>⌘</Atoms.Kbd>
            <Atoms.Kbd>Shift</Atoms.Kbd>
            <Atoms.Kbd>.</Atoms.Kbd>
          </Atoms.KbdShortcut>
        }
      >
        {s('Increase font size')}
      </T.Item>
    </div>
  )
})

type FontSizeComboboxProps = {
  ui: ProtonSheetsUIState
  realValue: number
}

function FontSizeCombobox({ ui, realValue }: FontSizeComboboxProps) {
  const s = useStrings()
  const comboboxRef = useRef<HTMLInputElement>(null)

  function commitValue(combobox: Ariakit.ComboboxStore) {
    if (!combobox) {
      return
    }
    const value = Number(combobox.getState().value)
    if (Number.isNaN(value)) {
      // If invalid, reset the input value to the real value.
      combobox.setValue(String(realValue))
      return
    }
    const clippedValue = Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, value))
    ui.format.text.fontSize.set(clippedValue)
  }

  // Create a combobox store with a few custom behaviors.
  const skipNextSelectRef = useRef(false)
  const combobox = Ariakit.useComboboxStore({
    includesBaseElement: false,
    defaultValue: String(realValue),
    // When the combobox popover opens, automatically make the option that matches the
    // current value active.
    setOpen(open) {
      if (open) {
        const { items, value } = combobox.getState()
        const item = items.find((item) => item.value === value)
        if (item) {
          skipNextSelectRef.current = true
          queueMicrotask(() => combobox.move(item.id))
        }
      }
    },
    // When an option becomes "active", select all text in the combobox input and
    // update the combobox value to the active option's value.
    setActiveId(id) {
      const { current: inputElement } = comboboxRef
      if (id && inputElement) {
        if (!skipNextSelectRef.current) {
          queueMicrotask(inputElement.select.bind(inputElement))
        }
        skipNextSelectRef.current = false
        const value = combobox.item(id)?.value
        if (value) {
          combobox.setValue(value)
        }
      }
    },
    // When an option is selected, commit the value.
    setSelectedValue(value) {
      if (value) {
        commitValue(combobox)
        queueMicrotask(ui.focusGrid)
      }
    },
  })

  // Sync the real value with the combobox value.
  useEffect(() => {
    combobox.setValue(String(realValue))
  }, [combobox, realValue])

  const mounted = Ariakit.useStoreState(combobox, 'mounted')
  const open = Ariakit.useStoreState(combobox, 'open')

  return (
    <Ariakit.ComboboxProvider store={combobox}>
      <Ariakit.TooltipProvider
        // TODO: remove once there's space for the default 'top' placement to kick in
        placement={open ? 'right' : 'top'}
      >
        <Ariakit.TooltipAnchor
          render={
            <Ariakit.ToolbarItem
              aria-label={s('Font size')}
              render={
                <Ariakit.Combobox
                  ref={comboboxRef}
                  className="border-weak h-[1.875rem] w-[2.875rem] shrink-0 rounded-[.5rem] border text-center text-[.875rem] focus:border focus:border-[#6D4AFF] focus:outline-none focus:ring-[.1875rem] focus:ring-[#6D4AFF]/20"
                  autoComplete="inline"
                  // On combobox blur, commit the value.
                  onBlur={() => commitValue(combobox)}
                  onKeyDown={(event) => {
                    let preventDefault = false
                    const { current: inputElement } = comboboxRef
                    if (!inputElement) {
                      return
                    }

                    // On enter, commit the value and focus the grid.
                    if (event.key === 'Enter') {
                      commitValue(combobox)
                      preventDefault = true
                      ui.focusGrid()
                    }

                    // On escape, reset the value to the real value.
                    if (event.key === 'Escape') {
                      combobox.setValue(String(realValue))
                      queueMicrotask(inputElement.select.bind(inputElement))
                      preventDefault = true
                    }

                    // On arrow left/right, if a range is selected, put the selection at the
                    // start or end of the input to allow the user to edit the value.
                    const isRangeSelected = inputElement.selectionStart !== inputElement.selectionEnd
                    const hasModifiers = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
                    if (isRangeSelected && !hasModifiers && event.key === 'ArrowLeft') {
                      inputElement.setSelectionRange(0, 0)
                      preventDefault = true
                    }
                    if (isRangeSelected && !hasModifiers && event.key === 'ArrowRight') {
                      inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length)
                      preventDefault = true
                    }

                    if (preventDefault) {
                      event.preventDefault()
                    }
                  }}
                />
              }
            />
          }
        />
        <UI.Tooltip>{s('Font size')}</UI.Tooltip>
      </Ariakit.TooltipProvider>
      {mounted && <FontSizeComboboxPopover />}
    </Ariakit.ComboboxProvider>
  )
}

function FontSizeComboboxPopover() {
  return (
    <UI.ComboboxPopover sameWidth className="w-[--popover-anchor-width]">
      {FONT_SIZE_SUGGESTIONS.map((size) => (
        <UI.ComboboxItem padding={false} className="text-center" key={size} value={String(size)}>
          {size}
        </UI.ComboboxItem>
      ))}
    </UI.ComboboxPopover>
  )
}

function useStrings() {
  return useStringifier(() => ({
    'Decrease font size': c('sheets_2025:Spreadsheet editor toolbar').t`Decrease font size`,
    'Font size': c('sheets_2025:Spreadsheet editor toolbar').t`Font size`,
    'Increase font size': c('sheets_2025:Spreadsheet editor toolbar').t`Increase font size`,
  }))
}
