import { type ComponentPropsWithRef } from 'react'
import { c } from 'ttag'
import * as T from './primitives'
import { FontSelect } from './FontSelect'
import { useStringifier } from '../../stringifier'
import type { ProtonSheetsUIState } from '../../ui-state'

export interface ToolbarProps extends ComponentPropsWithRef<'div'> {
  ui: ProtonSheetsUIState
}

export function Toolbar({ ui, ...props }: ToolbarProps) {
  const s = useStrings()
  return (
    <T.Container {...props}>
      <T.Button icon="arrow-up-and-left" onClick={ui.history.undo} disabled={ui.history.undoDisabled}>
        {s('Undo')}
      </T.Button>
      <T.Button
        icon="arrow-up-and-left"
        // Hack to flip the icon horizontally.
        className="[&_svg]:-scale-x-100"
        onClick={ui.history.redo}
        disabled={ui.history.redoDisabled}
      >
        {s('Redo')}
      </T.Button>
      {/* TODO: zoom */}
      <T.Button icon="magnifier" onClick={ui.search.open}>
        {s('Search')}
      </T.Button>
      <T.Button icon="eraser" onClick={ui.format.clear}>
        {s('Clear formatting')}
      </T.Button>
      <T.Separator />
      {/* TODO: missing icon 'currency-dollar' */}
      <T.Button icon="question-circle" onClick={ui.format.asCurrency}>
        {s('Format as currency')}
      </T.Button>
      {/* TODO: missing icon 'percentage-semibold' */}
      <T.Button icon="question-circle" onClick={ui.format.asPercent}>
        {s('Format as percent')}
      </T.Button>
      {/* TODO: missing icon 'decrease-decimal-places' */}
      <T.Button icon="question-circle" onClick={ui.format.decreaseDecimalPlaces}>
        {s('Decrease decimal places')}
      </T.Button>
      {/* TODO: missing icon 'increase-decimal-places' */}
      <T.Button icon="question-circle" onClick={ui.format.increaseDecimalPlaces}>
        {s('Increase decimal places')}
      </T.Button>
      {/* TODO: more formats */}
      <T.Separator />
      <FontSelect ui={ui} render={<T.Trigger />} />
      {/* TODO: font size */}
      <T.Separator />
      <T.Button icon="text-bold" isActive={ui.format.isBold} onClick={ui.format.toggleBold}>
        {s('Bold')}
      </T.Button>
      <T.Button icon="text-italic" isActive={ui.format.isItalic} onClick={ui.format.toggleItalic}>
        {s('Italic')}
      </T.Button>
      <T.Button icon="text-underline" isActive={ui.format.isUnderline} onClick={ui.format.toggleUnderline}>
        {s('Underline')}
      </T.Button>
      <T.Button icon="text-strikethrough" isActive={ui.format.isStrikethrough} onClick={ui.format.toggleStrikethrough}>
        {s('Strikethrough')}
      </T.Button>
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
  }))
}
