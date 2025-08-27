import * as Ariakit from '@ariakit/react'
import clsx from '@proton/utils/clsx'
import type {} from 'react'
import { type ComponentPropsWithoutRef, forwardRef, useEffect, useRef } from 'react'
import { c } from 'ttag'
import { ZOOM_DEFAULT, ZOOM_MAX, ZOOM_MIN, ZOOM_SUGGESTIONS } from '../../constants'
import { useStringifier } from '../../stringifier'
import type { ProtonSheetsUIState } from '../../ui-state'
import * as UI from '../ui'

export interface ZoomComboboxProps extends ComponentPropsWithoutRef<'div'> {
  ui: ProtonSheetsUIState
}

export const ZoomCombobox = forwardRef<HTMLDivElement, ZoomComboboxProps>(function ZoomCombobox({ ui, ...props }, ref) {
  const s = useStrings()
  const realValue = ui.zoom.value ?? ZOOM_DEFAULT
  const comboboxRef = useRef<HTMLInputElement>(null)

  function commitValue(combobox: Ariakit.ComboboxStore) {
    if (!combobox) {
      return
    }
    const value = Number.parseFloat(combobox.getState().value)
    if (Number.isNaN(value)) {
      // If invalid, reset the input value to the real value.
      combobox.setValue(scaleToPercentage(realValue))
      return
    }
    const roundedValue = Math.round(value)
    const scaleValue = zoomToScale(roundedValue)
    const clippedValue = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, scaleValue))
    ui.zoom.set(clippedValue)
  }

  // Create a combobox store with a few custom behaviors.
  const skipNextSelectRef = useRef(false)
  const combobox = Ariakit.useComboboxStore({
    includesBaseElement: false,
    defaultValue: scaleToPercentage(realValue),
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
    combobox.setValue(scaleToPercentage(realValue))
  }, [combobox, realValue])

  const mounted = Ariakit.useStoreState(combobox, 'mounted')
  const open = Ariakit.useStoreState(combobox, 'open')

  return (
    <Ariakit.ComboboxProvider store={combobox}>
      <div ref={ref} {...props} className={clsx('relative flex w-[5.5rem] shrink-0', props.className)}>
        <Ariakit.TooltipProvider
          // TODO: remove once there's space for the default 'top' placement to kick in
          placement={open ? 'right' : 'top'}
        >
          <Ariakit.TooltipAnchor
            render={
              <Ariakit.ToolbarItem
                aria-label={s('Zoom')}
                render={
                  <Ariakit.Combobox
                    ref={comboboxRef}
                    className="h-[2.25rem] w-full shrink-0 rounded-[.5rem] border border-solid border-[transparent] px-3 pe-9 text-[.875rem] focus:border focus:border-[#6D4AFF] focus:outline-none focus:ring-[.1875rem] focus:ring-[#6D4AFF]/20 [&:not(:focus)]:hover:bg-[#C2C1C0]/20"
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
                        combobox.setValue(scaleToPercentage(realValue))
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
          <UI.Tooltip>{s('Zoom')}</UI.Tooltip>
        </Ariakit.TooltipProvider>

        <div className="pointer-events-none absolute end-0 top-0 flex h-full items-center pe-3 text-[#0C0C14]">
          <UI.Icon legacyName="chevron-down-filled" />
        </div>
      </div>
      {mounted && <ComboboxPopover />}
    </Ariakit.ComboboxProvider>
  )
})

function ComboboxPopover() {
  return (
    <UI.ComboboxPopover sameWidth className="w-[--popover-anchor-width]">
      {ZOOM_SUGGESTIONS.map((scale) => (
        <UI.ComboboxItem key={scale} value={scaleToPercentage(scale)}>
          {scaleToPercentage(scale)}
        </UI.ComboboxItem>
      ))}
    </UI.ComboboxPopover>
  )
}

function scaleToZoom(scale: number) {
  return scale * 100
}

function zoomToScale(zoom: number) {
  return zoom / 100
}

function scaleToPercentage(scale: number) {
  return `${scaleToZoom(scale)}%`
}

function useStrings() {
  return useStringifier(() => ({
    Zoom: c('sheets_2025:Spreadsheet editor toolbar').t`Zoom`,
  }))
}
