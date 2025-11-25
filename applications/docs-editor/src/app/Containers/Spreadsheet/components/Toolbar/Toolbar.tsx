import type { ComponentPropsWithRef } from 'react'
import { c } from 'ttag'
import { createStringifier } from '../../stringifier'
import * as Atoms from '../atoms'
import * as Icons from '../icons'
import { FontSelect } from './FontSelect'
import { FontSizeControls } from './FontSizeControls'
import { NumberFormatsMenu } from '../shared/NumberFormatsMenu'
import { ZoomCombobox } from './ZoomCombobox'
import * as T from './primitives'
import * as UI from '../ui'
import { useUI } from '../../ui-store'
import { createComponent } from '../utils'
import { FormulaBar } from './FormulaBar'
import {
  BorderSelectorContent,
  ColorSelector,
  getStringifiedColor,
  TextHorizontalAlignSelectorContent,
  TextVerticalAlignSelectorContent,
  TextWrapSelectorContent,
} from '@rowsncolumns/spreadsheet'
import * as Ariakit from '@ariakit/react'
import type { IconData } from '../ui'
import type { IconName } from '@proton/icons/types'
import { InsertFormulaMenu } from '../shared/InsertFormulaMenu'
import { MergeMenuItems } from '../shared/MergeMenuItems'
import type { EditorRequiresClientMethods } from '@proton/docs-shared'
import { EditingDisabledButton } from '../EditingDisabledButton'

export interface ToolbarProps extends ComponentPropsWithRef<'div'> {
  clientInvoker: EditorRequiresClientMethods
}

const { s } = createStringifier(strings)

export const Toolbar = createComponent(function Toolbar({ clientInvoker, ...props }: ToolbarProps) {
  const isViewOnlyMode = useUI((ui) => ui.info.isViewOnlyMode)

  if (isViewOnlyMode) {
    return (
      <T.Container
        {...props}
        mainToolbarSlot={<ViewOnlyModeToolbarGroups />}
        renderOverflowDisclosure={<T.Item legacyIconName="three-dots-vertical">{s('More')}</T.Item>}
        trailingSlot={<EditingDisabledButton clientInvoker={clientInvoker} />}
      />
    )
  }

  return (
    <T.Container
      {...props}
      mainToolbarSlot={<ToolbarGroups />}
      overflowToolbarSlot={<ToolbarGroups />}
      // trailingSlot={<InsertChart />} // TODO: temporarily disabled
      formulaBarSlot={<FormulaBar />}
      renderOverflowDisclosure={<T.Item legacyIconName="three-dots-vertical">{s('More')}</T.Item>}
    />
  )
})

function ViewOnlyModeToolbarGroups() {
  return (
    <T.Group groupId="main">
      <ZoomCombobox />
      <Find />
    </T.Group>
  )
}

function ToolbarGroups() {
  return (
    <>
      <T.Group groupId="main">
        <Undo />
        <Redo />
        <ZoomCombobox />
        <Find />
        <ClearFormatting />
        <PaintFormat />
      </T.Group>
      <T.Group groupId="number">
        <FormatAsCurrency />
        <FormatAsPercent />
        <DecreaseDecimalPlaces />
        <IncreaseDecimalPlaces />
        <NumberFormatsMenu renderMenuButton={<T.Item icon={Icons.numbers}>{s('More formats')}</T.Item>} />
      </T.Group>
      <T.Group groupId="font">
        <FontSelect
          renderSelect={
            <T.Item variant="label" dropdownIndicator className="w-[8rem]" accessibilityLabel={s('Font')} />
          }
        />
        <FontSizeControls />
      </T.Group>
      <T.Group groupId="text-style">
        <Bold />
        <Italic />
        <Underline />
        <Strikethrough />
        <TextColor />
      </T.Group>
      <T.Group groupId="cell-style">
        <FillColor />
        <BorderSelector />
        <MergeCells />
      </T.Group>
      <T.Group groupId="alignment">
        <TextHorizontalAlign />
        <TextVerticalAlign />
        <TextWrap />
      </T.Group>
      <T.Group groupId="insert">
        <InsertLink />
        <InsertFunction />
        <CreateFilter />
        {/* TODO: insert image */}
        <InsertNote />
        <InsertChart />
      </T.Group>
    </>
  )
}

// TODO: most things should be using withFocusGrid
// TODO: should there be a withFocusGridExceptKeyboard? maybe not if going back to the toolbar is easy with the keyboard, and we remember the last element that was focused

function Undo() {
  return (
    <T.Item
      legacyIconName="arrow-up-and-left"
      onClick={useUI.$.history.undo}
      disabled={useUI((ui) => ui.history.undoDisabled || ui.info.isReadonly)}
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
      disabled={useUI((ui) => ui.history.redoDisabled || ui.info.isReadonly)}
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

function Find() {
  return (
    <T.Item legacyIconName="magnifier" onClick={useUI.$.search.open}>
      {s('Find')}
    </T.Item>
  )
}

// TODO: broken
function ClearFormatting() {
  return (
    <T.Item legacyIconName="eraser" onClick={useUI.$.format.clear} disabled={useUI((ui) => ui.info.isReadonly)}>
      {s('Clear formatting')}
    </T.Item>
  )
}

function PaintFormat() {
  return (
    <T.Item
      legacyIconName="paint-roller"
      pressed={useUI((ui) => ui.format.paintFormat.active)}
      onClick={useUI.$.format.paintFormat.save}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {s('Paint format')}
    </T.Item>
  )
}

function FormatAsCurrency() {
  return (
    <T.Item
      icon={Icons.currencyDollar}
      onClick={useUI.$.format.pattern.currency.default.set}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {s('Format as currency')}
    </T.Item>
  )
}

function FormatAsPercent() {
  return (
    <T.Item
      icon={Icons.percentageLight}
      onClick={useUI.$.format.pattern.percent.set}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {s('Format as percent')}
    </T.Item>
  )
}

function DecreaseDecimalPlaces() {
  return (
    <T.Item
      icon={Icons.decreaseDecimalPlaces}
      onClick={useUI.$.format.decreaseDecimalPlaces}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {s('Decrease decimal places')}
    </T.Item>
  )
}

function IncreaseDecimalPlaces() {
  return (
    <T.Item
      icon={Icons.increaseDecimalPlaces}
      onClick={useUI.$.format.increaseDecimalPlaces}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
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
      disabled={useUI((ui) => ui.info.isReadonly)}
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
      disabled={useUI((ui) => ui.info.isReadonly)}
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
      disabled={useUI((ui) => ui.info.isReadonly)}
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
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {s('Strikethrough')}
    </T.Item>
  )
}

function TextColor() {
  const popover = Ariakit.usePopoverStore()
  const mounted = Ariakit.useStoreState(popover, 'mounted')
  const color = useUI((ui) => ui.format.text.color.value)
  const theme = useUI((ui) => ui.legacy.theme)
  const colorString = getStringifiedColor(color, theme)
  const onChange = useUI.$.format.text.color.set
  return (
    <Ariakit.PopoverProvider store={popover}>
      <Ariakit.PopoverDisclosure
        render={
          <T.Item
            legacyIconName="text-style"
            style={{
              color: colorString,
            }}
            disabled={useUI((ui) => ui.info.isReadonly)}
          >
            {s('Text color')}
          </T.Item>
        }
      />
      {mounted && (
        <Atoms.DropdownPopover {...Atoms.DROPDOWN_POPOVER_DEFAULTS} className="p-2" render={<Ariakit.Popover />}>
          <ColorSelector color={color} theme={theme} onChange={onChange} />
        </Atoms.DropdownPopover>
      )}
    </Ariakit.PopoverProvider>
  )
}

function FillColor() {
  const popover = Ariakit.usePopoverStore()
  const mounted = Ariakit.useStoreState(popover, 'mounted')
  const color = useUI((ui) => ui.format.backgroundColor.value)
  const theme = useUI((ui) => ui.legacy.theme)
  // const colorString = getStringifiedColor(color, theme)
  const onChange = useUI.$.format.backgroundColor.set
  return (
    <Ariakit.PopoverProvider store={popover}>
      <Ariakit.PopoverDisclosure
        render={
          <T.Item icon={Icons.bucketColor} dropdownIndicator disabled={useUI((ui) => ui.info.isReadonly)}>
            {s('Fill color')}
          </T.Item>
        }
      />
      {mounted && (
        <Atoms.DropdownPopover {...Atoms.DROPDOWN_POPOVER_DEFAULTS} className="p-2" render={<Ariakit.Popover />}>
          <ColorSelector color={color} theme={theme} onChange={onChange} />
        </Atoms.DropdownPopover>
      )}
    </Ariakit.PopoverProvider>
  )
}

function BorderSelector() {
  const popover = Ariakit.usePopoverStore()
  const mounted = Ariakit.useStoreState(popover, 'mounted')
  const theme = useUI((ui) => ui.legacy.theme)
  const borders = useUI((ui) => ui.format.borders.value)
  const onChange = useUI.$.format.borders.set
  return (
    <Ariakit.PopoverProvider store={popover}>
      <Ariakit.PopoverDisclosure
        render={
          <T.Item icon={Icons.layoutGrid} dropdownIndicator disabled={useUI((ui) => ui.info.isReadonly)}>
            {s('Border')}
          </T.Item>
        }
      />
      {mounted && (
        <Atoms.DropdownPopover
          {...Atoms.DROPDOWN_POPOVER_DEFAULTS}
          className="p-2 [&_.flex-wrap]:!flex-wrap"
          render={<Ariakit.Popover />}
        >
          <BorderSelectorContent borders={borders} onChange={onChange} theme={theme} />
        </Atoms.DropdownPopover>
      )}
    </Ariakit.PopoverProvider>
  )
}

function MergeCells() {
  const isUnmerge = useUI((ui) => ui.format.merge.menu.defaultAction === 'unmerge')
  const mergeAll = useUI.$.format.merge.all
  const unmerge = useUI.$.format.merge.unmerge
  return (
    <div className="flex">
      <T.Item
        icon={Icons.merge}
        disabled={useUI((ui) => !ui.format.merge.menu.enabled || ui.info.isReadonly)}
        pressed={isUnmerge}
        onClick={useUI.$.withFocusGrid(isUnmerge ? unmerge : mergeAll)}
      >
        {isUnmerge ? s('Unmerge cells') : s('Merge cells')}
      </T.Item>
      <Ariakit.MenuProvider>
        <Ariakit.MenuButton
          render={
            <T.Item legacyIconName="chevron-down-filled" className="w-[1rem] !px-0">
              {s('Select merge type')}
            </T.Item>
          }
        />
        <UI.Menu unmountOnHide>
          <MergeMenuItems />
        </UI.Menu>
      </Ariakit.MenuProvider>
    </div>
  )
}

function TextHorizontalAlign() {
  const popover = Ariakit.usePopoverStore()
  const mounted = Ariakit.useStoreState(popover, 'mounted')

  const value = useUI((ui) => ui.format.alignment.horizontal.value)
  const onChange = useUI.$.format.alignment.horizontal.set

  let icon: IconName
  switch (value) {
    case 'center':
      icon = 'text-align-center'
      break
    case 'right':
      icon = 'text-align-right'
      break
    case 'left':
    default:
      icon = 'text-align-left'
      break
  }

  return (
    <Ariakit.PopoverProvider store={popover}>
      <Ariakit.PopoverDisclosure
        render={
          <T.Item legacyIconName={icon} dropdownIndicator disabled={useUI((ui) => ui.info.isReadonly)}>
            {s('Horizontal align')}
          </T.Item>
        }
      />
      {mounted && (
        <Atoms.DropdownPopover
          {...Atoms.DROPDOWN_POPOVER_DEFAULTS}
          className="p-2 [&_.flex-wrap]:!flex-wrap"
          render={<Ariakit.Popover />}
        >
          <TextHorizontalAlignSelectorContent value={value} onChange={onChange} close={popover.hide} />
        </Atoms.DropdownPopover>
      )}
    </Ariakit.PopoverProvider>
  )
}

function TextVerticalAlign() {
  const popover = Ariakit.usePopoverStore()
  const mounted = Ariakit.useStoreState(popover, 'mounted')

  const value = useUI((ui) => ui.format.alignment.vertical.value)
  const onChange = useUI.$.format.alignment.vertical.set

  let icon: IconData
  switch (value) {
    case 'top':
      icon = Icons.alignTop
      break
    case 'middle':
      icon = Icons.alignVerticalCenter
      break
    case 'bottom':
    default:
      icon = Icons.alignBottom
      break
  }

  return (
    <Ariakit.PopoverProvider store={popover}>
      <Ariakit.PopoverDisclosure
        render={
          <T.Item icon={icon} dropdownIndicator disabled={useUI((ui) => ui.info.isReadonly)}>
            {s('Vertical align')}
          </T.Item>
        }
      />
      {mounted && (
        <Atoms.DropdownPopover
          {...Atoms.DROPDOWN_POPOVER_DEFAULTS}
          className="p-2 [&_.flex-wrap]:!flex-wrap"
          render={<Ariakit.Popover />}
        >
          <TextVerticalAlignSelectorContent value={value} onChange={onChange} close={popover.hide} />
        </Atoms.DropdownPopover>
      )}
    </Ariakit.PopoverProvider>
  )
}

function TextWrap() {
  const popover = Ariakit.usePopoverStore()
  const mounted = Ariakit.useStoreState(popover, 'mounted')

  const value = useUI((ui) => ui.format.wrapping.value)
  const onChange = useUI.$.format.wrapping.set

  let icon: IconData
  switch (value) {
    case 'clip':
      icon = Icons.textClip
      break
    case 'wrap':
      icon = Icons.textWrap
      break
    case 'overflow':
    default:
      icon = Icons.textOverflow
      break
  }

  return (
    <Ariakit.PopoverProvider store={popover}>
      <Ariakit.PopoverDisclosure
        render={
          <T.Item icon={icon} dropdownIndicator disabled={useUI((ui) => ui.info.isReadonly)}>
            {s('Text wrapping')}
          </T.Item>
        }
      />
      {mounted && (
        <Atoms.DropdownPopover
          {...Atoms.DROPDOWN_POPOVER_DEFAULTS}
          className="p-2 [&_.flex-wrap]:!flex-wrap"
          render={<Ariakit.Popover />}
        >
          <TextWrapSelectorContent value={value} onChange={onChange} close={popover.hide} />
        </Atoms.DropdownPopover>
      )}
    </Ariakit.PopoverProvider>
  )
}

function InsertLink() {
  return (
    <T.Item legacyIconName="link" onClick={useUI.$.insert.link} disabled={useUI((ui) => ui.info.isReadonly)}>
      {s('Insert link')}
    </T.Item>
  )
}

function InsertFunction() {
  return (
    <InsertFormulaMenu
      renderMenuButton={
        <T.Item icon={Icons.sigma} disabled={useUI((ui) => ui.info.isReadonly)}>
          {s('Insert function')}
        </T.Item>
      }
    />
  )
}

function CreateFilter() {
  return (
    <T.Item
      // TODO: need a different icon for "remove filter"
      icon={useUI((ui) => ui.data.hasFilter) ? Icons.filter : Icons.filter}
      onClick={useUI.$.data.toggleFilter}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {useUI((ui) => ui.data.hasFilter) ? s('Remove filter') : s('Create a filter')}
    </T.Item>
  )
}

function InsertNote() {
  return (
    // TODO: icon needs to be note-with-text but we don't have it yet
    <T.Item legacyIconName="note" onClick={useUI.$.insert.note} disabled={useUI((ui) => ui.info.isReadonly)}>
      {s('Insert note')}
    </T.Item>
  )
}

function InsertChart() {
  return (
    <T.Item icon={Icons.barChart} onClick={useUI.$.insert.chart} disabled={useUI((ui) => ui.info.isReadonly)}>
      {s('Insert chart')}
    </T.Item>
  )
}

function strings() {
  return {
    Undo: c('sheets_2025:Spreadsheet editor toolbar').t`Undo`,
    Redo: c('sheets_2025:Spreadsheet editor toolbar').t`Redo`,
    Find: c('sheets_2025:Spreadsheet editor toolbar').t`Find`,
    'Clear formatting': c('sheets_2025:Spreadsheet editor toolbar').t`Clear formatting`,
    'Paint format': c('sheets_2025:Spreadsheet editor toolbar').t`Paint format`,
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
    'Text color': c('sheets_2025:Spreadsheet editor toolbar').t`Text color`,
    'Fill color': c('sheets_2025:Spreadsheet editor toolbar').t`Fill color`,
    Border: c('sheets_2025:Spreadsheet editor toolbar').t`Border`,
    'Merge cells': c('sheets_2025:Spreadsheet editor toolbar').t`Merge cells`,
    'Unmerge cells': c('sheets_2025:Spreadsheet editor toolbar').t`Unmerge cells`,
    'Select merge type': c('sheets_2025:Spreadsheet editor toolbar').t`Select merge type`,
    'Horizontal align': c('sheets_2025:Spreadsheet editor toolbar').t`Horizontal align`,
    'Vertical align': c('sheets_2025:Spreadsheet editor toolbar').t`Vertical align`,
    'Text wrapping': c('sheets_2025:Spreadsheet editor toolbar').t`Text wrapping`,
    'Insert link': c('sheets_2025:Spreadsheet editor toolbar').t`Insert link`,
    'Insert function': c('sheets_2025:Spreadsheet editor toolbar').t`Insert function`,
    'Create a filter': c('sheets_2025:Spreadsheet editor toolbar').t`Create a filter`,
    'Remove filter': c('sheets_2025:Spreadsheet editor toolbar').t`Remove filter`,
    'Insert note': c('sheets_2025:Spreadsheet editor toolbar').t`Insert note`,
    'Insert chart': c('sheets_2025:Spreadsheet editor toolbar').t`Insert chart`,
    More: c('sheets_2025:Spreadsheet editor toolbar').t`More`,
  }
}
