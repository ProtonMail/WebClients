import type { ComponentPropsWithRef } from 'react'
import { c } from 'ttag'
import { useStringifier } from '../../stringifier'
import type { ProtonSheetsUIState } from '../../ui-state'
import * as Atoms from '../atoms'
import * as Icons from '../icons'
import { FontSelect } from './FontSelect'
import { FontSizeControls } from './FontSizeControls'
import { MoreFormatsMenu } from './MoreFormatsMenu'
import { ZoomCombobox } from './ZoomCombobox'
import * as T from './primitives'

export interface ToolbarProps extends ComponentPropsWithRef<'div'> {
  ui: ProtonSheetsUIState
}

export function Toolbar({ ui, ...props }: ToolbarProps) {
  const s = useStrings()
  return (
    <T.Container {...props}>
      <T.Item
        legacyIconName="arrow-up-and-left"
        onClick={ui.history.undo}
        disabled={ui.history.undoDisabled}
        shortcut={
          <Atoms.KbdShortcut>
            <Atoms.Kbd>⌘</Atoms.Kbd>
            <Atoms.Kbd>Z</Atoms.Kbd>
          </Atoms.KbdShortcut>
        }
      >
        {s('Undo')}
      </T.Item>
      <T.Item
        legacyIconName="arrow-up-and-left"
        // Hack to flip the icon horizontally.
        className="[&_svg]:-scale-x-100"
        onClick={ui.history.redo}
        disabled={ui.history.redoDisabled}
        shortcut={
          <Atoms.KbdShortcut>
            <Atoms.Kbd>⌘</Atoms.Kbd>
            <Atoms.Kbd>Y</Atoms.Kbd>
          </Atoms.KbdShortcut>
        }
      >
        {s('Redo')}
      </T.Item>
      <ZoomCombobox ui={ui} />
      <T.Item legacyIconName="magnifier" onClick={ui.search.open}>
        {s('Search')}
      </T.Item>
      <T.Item legacyIconName="eraser" onClick={ui.format.clear}>
        {s('Clear formatting')}
      </T.Item>
      <T.Separator />
      <T.Item icon={Icons.currencyDollar} onClick={ui.format.pattern.currency.default.set}>
        {s('Format as currency')}
      </T.Item>
      <T.Item legacyIconName="percent" onClick={ui.format.pattern.percent.set}>
        {s('Format as percent')}
      </T.Item>
      <T.Item icon={Icons.decreaseDecimalPlaces} onClick={ui.format.decreaseDecimalPlaces}>
        {s('Decrease decimal places')}
      </T.Item>
      <T.Item icon={Icons.increaseDecimalPlaces} onClick={ui.format.increaseDecimalPlaces}>
        {s('Increase decimal places')}
      </T.Item>
      <MoreFormatsMenu ui={ui} renderMenuButton={<T.Item icon={Icons.numbers}>{s('More formats')}</T.Item>} />
      <T.Separator />
      <FontSelect
        ui={ui}
        renderSelect={<T.Item variant="label" dropdownIndicator className="w-[8rem]" accessibilityLabel={s('Font')} />}
      />
      <FontSizeControls ui={ui} />
      <T.Separator />
      <T.Item legacyIconName="text-bold" pressed={ui.format.text.bold.active} onClick={ui.format.text.bold.toggle}>
        {s('Bold')}
      </T.Item>
      <T.Item
        legacyIconName="text-italic"
        pressed={ui.format.text.italic.active}
        onClick={ui.format.text.italic.toggle}
      >
        {s('Italic')}
      </T.Item>
      <T.Item
        legacyIconName="text-underline"
        pressed={ui.format.text.underline.active}
        onClick={ui.format.text.underline.toggle}
      >
        {s('Underline')}
      </T.Item>
      <T.Item
        legacyIconName="text-strikethrough"
        pressed={ui.format.text.strikethrough.active}
        onClick={ui.format.text.strikethrough.toggle}
      >
        {s('Strikethrough')}
      </T.Item>
      {/* TODO: text color */}
      <T.Separator />
      {/* TODO: fill color */}
      {/* TODO: borders */}
      {/* TODO: merge cells */}
      <T.Separator />
      {/* TODO: horizontal align */}
      {/* TODO: vertical align */}
      {/* TODO: text wrapping */}
      <T.Separator />
      {/* TODO: insert link */}
      {/* TODO: functions */}
      {/* TODO: create a filter */}
      {/* TODO: insert image */}
      {/* TODO: insert note */}
      {/* TODO: toolbar overflow popover? */}
    </T.Container>
  )
}

function useStrings() {
  return useStringifier(() => ({
    Undo: c('sheets_2025:Spreadsheet editor toolbar').t`Undo`,
    Redo: c('sheets_2025:Spreadsheet editor toolbar').t`Redo`,
    Search: c('sheets_2025:Spreadsheet editor toolbar').t`Search`,
    'Clear formatting': c('sheets_2025:Spreadsheet editor toolbar').t`Clear formatting`,
    Bold: c('sheets_2025:Spreadsheet editor toolbar').t`Bold`,
    Italic: c('sheets_2025:Spreadsheet editor toolbar').t`Italic`,
    Underline: c('sheets_2025:Spreadsheet editor toolbar').t`Underline`,
    Strikethrough: c('sheets_2025:Spreadsheet editor toolbar').t`Strikethrough`,
    'Format as currency': c('sheets_2025:Spreadsheet editor toolbar').t`Format as currency`,
    'Format as percent': c('sheets_2025:Spreadsheet editor toolbar').t`Format as percent`,
    'Decrease decimal places': c('sheets_2025:Spreadsheet editor toolbar').t`Decrease decimal places`,
    'Increase decimal places': c('sheets_2025:Spreadsheet editor toolbar').t`Increase decimal places`,
    'More formats': c('sheets_2025:Spreadsheet editor toolbar').t`More formats`,
    Font: c('sheets_2025:Spreadsheet editor toolbar').t`Font`,
  }))
}
