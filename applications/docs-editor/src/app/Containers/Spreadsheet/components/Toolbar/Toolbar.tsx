import type { ComponentPropsWithRef } from 'react'
import { c } from 'ttag'
import { createStringifier } from '../../stringifier'
import * as Atoms from '../atoms'
import * as Icons from '../icons'
import { FontSelect } from './FontSelect'
import { FontSizeControls } from './FontSizeControls'
import { MoreFormatsMenu } from './MoreFormatsMenu'
import { ZoomCombobox } from './ZoomCombobox'
import * as T from './primitives'
import { useUI } from '../../ui-store'
import { createComponent } from '../utils'

export interface ToolbarProps extends ComponentPropsWithRef<'div'> {}

const { s } = createStringifier(strings)

export const Toolbar = createComponent(function Toolbar(props: ToolbarProps) {
  return (
    <T.Container {...props}>
      <Undo />
      <Redo />
      <ZoomCombobox />
      <Search />
      <ClearFormatting />
      <T.Separator />
      <FormatAsCurrency />
      <FormatAsPercent />
      <DecreaseDecimalPlaces />
      <IncreaseDecimalPlaces />
      <MoreFormatsMenu renderMenuButton={<T.Item icon={Icons.numbers}>{s('More formats')}</T.Item>} />
      <T.Separator />
      <FontSelect
        renderSelect={<T.Item variant="label" dropdownIndicator className="w-[8rem]" accessibilityLabel={s('Font')} />}
      />
      <FontSizeControls />
      <T.Separator />
      <Bold />
      <Italic />
      <Underline />
      <Strikethrough />
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
})

function Undo() {
  return (
    <T.Item
      legacyIconName="arrow-up-and-left"
      onClick={useUI.$.history.undo}
      disabled={useUI((ui) => ui.history.undoDisabled)}
      shortcut={
        <Atoms.KbdShortcut>
          <Atoms.Kbd>⌘</Atoms.Kbd>
          <Atoms.Kbd>Z</Atoms.Kbd>
        </Atoms.KbdShortcut>
      }
    >
      {s('Undo')}
    </T.Item>
  )
}

function Redo() {
  return (
    <T.Item
      legacyIconName="arrow-up-and-left"
      // Hack to flip the icon horizontally.
      className="[&_svg]:-scale-x-100"
      onClick={useUI.$.history.redo}
      disabled={useUI((ui) => ui.history.redoDisabled)}
      shortcut={
        <Atoms.KbdShortcut>
          <Atoms.Kbd>⌘</Atoms.Kbd>
          <Atoms.Kbd>Y</Atoms.Kbd>
        </Atoms.KbdShortcut>
      }
    >
      {s('Redo')}
    </T.Item>
  )
}

function Search() {
  return (
    <T.Item legacyIconName="magnifier" onClick={useUI.$.search.open}>
      {s('Search')}
    </T.Item>
  )
}

// TODO: broken
function ClearFormatting() {
  return (
    <T.Item legacyIconName="eraser" onClick={useUI.$.format.clear}>
      {s('Clear formatting')}
    </T.Item>
  )
}

function FormatAsCurrency() {
  return (
    <T.Item icon={Icons.currencyDollar} onClick={useUI.$.format.pattern.currency.default.set}>
      {s('Format as currency')}
    </T.Item>
  )
}

function FormatAsPercent() {
  return (
    <T.Item legacyIconName="percent" onClick={useUI.$.format.pattern.percent.set}>
      {s('Format as percent')}
    </T.Item>
  )
}

function DecreaseDecimalPlaces() {
  return (
    <T.Item icon={Icons.decreaseDecimalPlaces} onClick={useUI.$.format.decreaseDecimalPlaces}>
      {s('Decrease decimal places')}
    </T.Item>
  )
}

function IncreaseDecimalPlaces() {
  return (
    <T.Item icon={Icons.increaseDecimalPlaces} onClick={useUI.$.format.increaseDecimalPlaces}>
      {s('Increase decimal places')}
    </T.Item>
  )
}

function Bold() {
  return (
    <T.Item
      legacyIconName="text-bold"
      pressed={useUI((ui) => ui.format.text.bold.active)}
      onClick={useUI.$.format.text.bold.toggle}
    >
      {s('Bold')}
    </T.Item>
  )
}

function Italic() {
  return (
    <T.Item
      legacyIconName="text-italic"
      pressed={useUI((ui) => ui.format.text.italic.active)}
      onClick={useUI.$.format.text.italic.toggle}
    >
      {s('Italic')}
    </T.Item>
  )
}

function Underline() {
  return (
    <T.Item
      legacyIconName="text-underline"
      pressed={useUI((ui) => ui.format.text.underline.active)}
      onClick={useUI.$.format.text.underline.toggle}
    >
      {s('Underline')}
    </T.Item>
  )
}

function Strikethrough() {
  return (
    <T.Item
      legacyIconName="text-strikethrough"
      pressed={useUI((ui) => ui.format.text.strikethrough.active)}
      onClick={useUI.$.format.text.strikethrough.toggle}
    >
      {s('Strikethrough')}
    </T.Item>
  )
}

function strings() {
  return {
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
  }
}
