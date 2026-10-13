import { useSheetsMessages } from '../../SheetsDependenciesProvider'
import { useState, type ComponentPropsWithRef } from 'react'

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
  type BorderStyle,
  type Color,
  getStringifiedColor,
  TextHorizontalAlignSelectorContent,
  TextVerticalAlignSelectorContent,
  TextWrapSelectorContent,
} from '@rowsncolumns/spreadsheet'
import * as Ariakit from '@ariakit/react'
import { InsertFormulaMenu } from '../shared/InsertFormulaMenu'
import { MergeMenuItems } from '../shared/MergeMenuItems'
import { EditingDisabledButton } from '../misc/EditingDisabledButton'
import { ColorPicker } from '../shared/ColorPicker'
import { BorderSelectorContent } from '../shared/BorderSelector'

export interface ToolbarProps extends ComponentPropsWithRef<'div'> {}

export const Toolbar = createComponent(function Toolbar({ ...props }: ToolbarProps) {
  const messages = useSheetsMessages()

  const isViewOnlyMode = useUI((ui) => ui.info.isViewOnlyMode)

  if (isViewOnlyMode) {
    return (
      <T.Container
        {...props}
        mainToolbarSlot={<ViewOnlyModeToolbarGroups />}
        renderOverflowDisclosure={<T.Item icon={Icons.threeDotsVertical}>{messages.toolbar.More}</T.Item>}
        trailingSlot={<EditingDisabledButton />}
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
      renderOverflowDisclosure={<T.Item icon={Icons.threeDotsVertical}>{messages.toolbar.More}</T.Item>}
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
  const messages = useSheetsMessages()

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
        <NumberFormatsMenu
          renderMenuButton={<T.Item icon={Icons.numbers}>{messages.toolbar['More formats']}</T.Item>}
        />
      </T.Group>
      <T.Group groupId="font">
        <FontSelect
          renderSelect={
            <T.Item variant="label" dropdownIndicator className="w-[8rem]" accessibilityLabel={messages.toolbar.Font} />
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
  const messages = useSheetsMessages()

  return (
    <T.Item
      icon={Icons.arrowUpAndLeft}
      onClick={useUI.$.history.undo}
      disabled={useUI((ui) => ui.history.undoDisabled || ui.info.isReadonly)}
      shortcut={
        <Atoms.KbdShortcut>
          <Atoms.Kbd>⌘</Atoms.Kbd>
          <Atoms.Kbd>Z</Atoms.Kbd>
        </Atoms.KbdShortcut>
      }
    >
      {messages.toolbar.Undo}
    </T.Item>
  )
}

function Redo() {
  const messages = useSheetsMessages()

  return (
    <T.Item
      icon={Icons.arrowUpAndLeft}
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
      {messages.toolbar.Redo}
    </T.Item>
  )
}

function Find() {
  const messages = useSheetsMessages()

  return (
    <T.Item icon={Icons.magnifier} onClick={useUI.$.search.open}>
      {messages.toolbar.Find}
    </T.Item>
  )
}

// TODO: broken
function ClearFormatting() {
  const messages = useSheetsMessages()

  return (
    <T.Item icon={Icons.eraser} onClick={useUI.$.format.clear} disabled={useUI((ui) => ui.info.isReadonly)}>
      {messages.toolbar['Clear formatting']}
    </T.Item>
  )
}

function PaintFormat() {
  const messages = useSheetsMessages()

  return (
    <T.Item
      icon={Icons.paintRoller}
      pressed={useUI((ui) => ui.format.paintFormat.active)}
      onClick={useUI.$.format.paintFormat.save}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {messages.toolbar['Paint format']}
    </T.Item>
  )
}

function FormatAsCurrency() {
  const messages = useSheetsMessages()

  const currencySymbol = useUI((ui) => ui.locale.currency.symbol)

  return (
    <Ariakit.TooltipProvider placement="bottom">
      <Ariakit.TooltipAnchor
        render={
          <T.Item
            variant="label"
            onClick={useUI.$.format.pattern.currency.default.set}
            disabled={useUI((ui) => ui.info.isReadonly)}
          />
        }
      >
        {/* We can instead use 'w-8' to prevent layout shifts when currency changes from, e.g. '$' to 'BYN' */}
        <span className="flex min-w-5 justify-center">{currencySymbol}</span>
      </Ariakit.TooltipAnchor>

      <UI.Tooltip>{messages.toolbar['Format as currency']}</UI.Tooltip>
    </Ariakit.TooltipProvider>
  )
}

function FormatAsPercent() {
  const messages = useSheetsMessages()

  return (
    <T.Item
      icon={Icons.percentageLight}
      onClick={useUI.$.format.pattern.percent.set}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {messages.toolbar['Format as percent']}
    </T.Item>
  )
}

function DecreaseDecimalPlaces() {
  const messages = useSheetsMessages()

  return (
    <T.Item
      icon={Icons.decreaseDecimalPlaces}
      onClick={useUI.$.format.decreaseDecimalPlaces}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {messages.toolbar['Decrease decimal places']}
    </T.Item>
  )
}

function IncreaseDecimalPlaces() {
  const messages = useSheetsMessages()

  return (
    <T.Item
      icon={Icons.increaseDecimalPlaces}
      onClick={useUI.$.format.increaseDecimalPlaces}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {messages.toolbar['Increase decimal places']}
    </T.Item>
  )
}

function Bold() {
  const messages = useSheetsMessages()

  return (
    <T.Item
      icon={Icons.textBold}
      pressed={useUI((ui) => ui.format.text.bold.active)}
      onClick={useUI.$.format.text.bold.toggle}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {messages.toolbar.Bold}
    </T.Item>
  )
}

function Italic() {
  const messages = useSheetsMessages()

  return (
    <T.Item
      icon={Icons.textItalic}
      pressed={useUI((ui) => ui.format.text.italic.active)}
      onClick={useUI.$.format.text.italic.toggle}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {messages.toolbar.Italic}
    </T.Item>
  )
}

function Underline() {
  const messages = useSheetsMessages()

  return (
    <T.Item
      icon={Icons.textUnderline}
      pressed={useUI((ui) => ui.format.text.underline.active)}
      onClick={useUI.$.format.text.underline.toggle}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {messages.toolbar.Underline}
    </T.Item>
  )
}

function Strikethrough() {
  const messages = useSheetsMessages()

  return (
    <T.Item
      icon={Icons.textStrikethrough}
      pressed={useUI((ui) => ui.format.text.strikethrough.active)}
      onClick={useUI.$.format.text.strikethrough.toggle}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {messages.toolbar.Strikethrough}
    </T.Item>
  )
}

function TextColor() {
  const messages = useSheetsMessages()

  const popover = Ariakit.usePopoverStore()
  const mounted = Ariakit.useStoreState(popover, 'mounted')
  const color = useUI((ui) => ui.format.text.color.value)
  const theme = useUI((ui) => ui.legacy.theme)
  const lastUsedColor = useUI((ui) => ui.format.text.color.lastUsed)
  const colorString = getStringifiedColor(lastUsedColor, theme)
  const onChange = useUI.$.format.text.color.set
  return (
    <Ariakit.PopoverProvider store={popover}>
      <div className="flex">
        <T.Item
          icon={Icons.textColor}
          style={{ '--selected-color': colorString }}
          onClick={() => onChange(lastUsedColor)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.toolbar['Apply text color']}
        </T.Item>
        <Ariakit.PopoverDisclosure
          render={
            <T.Item
              className="w-[1rem] !px-0"
              icon={Icons.chevronDownFilled}
              disabled={useUI((ui) => ui.info.isReadonly)}
            >
              {messages.toolbar['Choose text color']}
            </T.Item>
          }
        />
      </div>
      {mounted && (
        <Atoms.DropdownPopover {...Atoms.DROPDOWN_POPOVER_DEFAULTS} className="p-2" render={<Ariakit.Popover />}>
          <ColorPicker selectedColor={color} onChange={onChange} />
        </Atoms.DropdownPopover>
      )}
    </Ariakit.PopoverProvider>
  )
}

function FillColor() {
  const messages = useSheetsMessages()

  const popover = Ariakit.usePopoverStore()
  const mounted = Ariakit.useStoreState(popover, 'mounted')
  const color = useUI((ui) => ui.format.backgroundColor.value)
  const theme = useUI((ui) => ui.legacy.theme)
  const lastUsedColor = useUI((ui) => ui.format.backgroundColor.lastUsed)
  const colorString = getStringifiedColor(lastUsedColor, theme)
  const onChange = useUI.$.format.backgroundColor.set
  return (
    <Ariakit.PopoverProvider store={popover}>
      <div className="flex">
        <T.Item
          icon={Icons.bucketColor}
          style={{ '--selected-color': colorString }}
          onClick={() => onChange(lastUsedColor)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.toolbar['Apply fill color']}
        </T.Item>
        <Ariakit.PopoverDisclosure
          render={
            <T.Item
              className="w-[1rem] !px-0"
              icon={Icons.chevronDownFilled}
              disabled={useUI((ui) => ui.info.isReadonly)}
            >
              {messages.toolbar['Choose fill color']}
            </T.Item>
          }
        />
      </div>
      {mounted && (
        <Atoms.DropdownPopover {...Atoms.DROPDOWN_POPOVER_DEFAULTS} className="p-2" render={<Ariakit.Popover />}>
          <ColorPicker selectedColor={color} onChange={onChange} />
        </Atoms.DropdownPopover>
      )}
    </Ariakit.PopoverProvider>
  )
}

function BorderSelector() {
  const messages = useSheetsMessages()

  const popover = Ariakit.usePopoverStore()
  const mounted = Ariakit.useStoreState(popover, 'mounted')
  const theme = useUI((ui) => ui.legacy.theme)
  const borders = useUI((ui) => ui.format.borders.value)
  const lastUsedBorder = useUI((ui) => ui.format.borders.lastUsed)
  const onChange = useUI.$.format.borders.set
  const [color, setColor] = useState<Color>()
  const [style, setStyle] = useState<BorderStyle>('solid')
  return (
    <Ariakit.PopoverProvider store={popover}>
      <div className="flex">
        <T.Item
          icon={Icons.layoutGrid}
          onClick={() => onChange(lastUsedBorder.location, lastUsedBorder.color, lastUsedBorder.style)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.toolbar['Apply border']}
        </T.Item>
        <Ariakit.PopoverDisclosure
          render={
            <T.Item
              className="w-[1rem] !px-0"
              icon={Icons.chevronDownFilled}
              disabled={useUI((ui) => ui.info.isReadonly)}
            >
              {messages.toolbar['Choose border']}
            </T.Item>
          }
        />
      </div>
      {mounted && (
        <Atoms.DropdownPopover
          {...Atoms.DROPDOWN_POPOVER_DEFAULTS}
          className="p-2 [&_.flex-wrap]:!flex-wrap"
          render={<Ariakit.Popover />}
        >
          <BorderSelectorContent
            borders={borders}
            color={color}
            style={style}
            onColorChange={setColor}
            onStyleChange={setStyle}
            onChange={onChange}
            theme={theme}
          />
        </Atoms.DropdownPopover>
      )}
    </Ariakit.PopoverProvider>
  )
}

function MergeCells() {
  const messages = useSheetsMessages()

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
        {isUnmerge ? messages.toolbar['Unmerge cells'] : messages.toolbar['Merge cells']}
      </T.Item>
      <Ariakit.MenuProvider>
        <Ariakit.MenuButton
          render={
            <T.Item icon={Icons.chevronDownFilled} className="w-[1rem] !px-0">
              {messages.toolbar['Select merge type']}
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
  const messages = useSheetsMessages()

  const popover = Ariakit.usePopoverStore()
  const mounted = Ariakit.useStoreState(popover, 'mounted')

  const value = useUI((ui) => ui.format.alignment.horizontal.value)
  const onChange = useUI.$.format.alignment.horizontal.set

  let icon = Icons.textAlignLeft
  switch (value) {
    case 'center':
      icon = Icons.textAlignCenter
      break
    case 'right':
      icon = Icons.textAlignRight
      break
  }

  return (
    <Ariakit.PopoverProvider store={popover}>
      <Ariakit.PopoverDisclosure
        render={
          <T.Item icon={icon} dropdownIndicator disabled={useUI((ui) => ui.info.isReadonly)}>
            {messages.toolbar['Horizontal align']}
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
  const messages = useSheetsMessages()

  const popover = Ariakit.usePopoverStore()
  const mounted = Ariakit.useStoreState(popover, 'mounted')

  const value = useUI((ui) => ui.format.alignment.vertical.value)
  const onChange = useUI.$.format.alignment.vertical.set

  let icon = Icons.alignBottom
  switch (value) {
    case 'top':
      icon = Icons.alignTop
      break
    case 'middle':
      icon = Icons.alignVerticalCenter
      break
  }

  return (
    <Ariakit.PopoverProvider store={popover}>
      <Ariakit.PopoverDisclosure
        render={
          <T.Item icon={icon} dropdownIndicator disabled={useUI((ui) => ui.info.isReadonly)}>
            {messages.toolbar['Vertical align']}
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
  const messages = useSheetsMessages()

  const popover = Ariakit.usePopoverStore()
  const mounted = Ariakit.useStoreState(popover, 'mounted')

  const value = useUI((ui) => ui.format.wrapping.value)
  const onChange = useUI.$.format.wrapping.set

  let icon = Icons.textOverflow
  switch (value) {
    case 'wrap':
      icon = Icons.textWrap
      break
    case 'clip':
      icon = Icons.textClip
      break
  }

  return (
    <Ariakit.PopoverProvider store={popover}>
      <Ariakit.PopoverDisclosure
        render={
          <T.Item icon={icon} dropdownIndicator disabled={useUI((ui) => ui.info.isReadonly)}>
            {messages.toolbar['Text wrapping']}
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
  const messages = useSheetsMessages()

  return (
    <T.Item icon={Icons.link} onClick={useUI.$.insert.link} disabled={useUI((ui) => ui.info.isReadonly)}>
      {messages.toolbar['Insert link']}
    </T.Item>
  )
}

function InsertFunction() {
  const messages = useSheetsMessages()

  return (
    <InsertFormulaMenu
      renderMenuButton={
        <T.Item icon={Icons.sigma} disabled={useUI((ui) => ui.info.isReadonly)}>
          {messages.toolbar['Insert function']}
        </T.Item>
      }
    />
  )
}

function CreateFilter() {
  const messages = useSheetsMessages()

  return (
    <T.Item
      // TODO: need a different icon for "remove filter"
      icon={useUI((ui) => ui.data.hasFilter) ? Icons.filter : Icons.filter}
      onClick={useUI.$.data.toggleFilter}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {useUI((ui) => ui.data.hasFilter) ? messages.toolbar['Remove filter'] : messages.toolbar['Create a filter']}
    </T.Item>
  )
}

function InsertNote() {
  const messages = useSheetsMessages()

  return (
    // TODO: icon needs to be note-with-text but we don't have it yet
    <T.Item icon={Icons.note} onClick={useUI.$.insert.note} disabled={useUI((ui) => ui.info.isReadonly)}>
      {messages.toolbar['Insert note']}
    </T.Item>
  )
}

function InsertChart() {
  const messages = useSheetsMessages()

  const insertChart = useUI.$.insert.chart
  const onRequestEditChart = useUI((ui) => ui.legacy.chartsState.onRequestEditChart)

  return (
    <T.Item
      icon={Icons.barChart}
      onClick={() => {
        const chart = insertChart()
        onRequestEditChart(chart)
      }}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {messages.toolbar['Insert chart']}
    </T.Item>
  )
}

export const toolbarMessages = {
  toolbar: {
    Undo: `Undo`,
    Redo: `Redo`,
    Find: `Find`,
    'Clear formatting': `Clear formatting`,
    'Paint format': `Paint format`,
    Bold: `Bold`,
    Italic: `Italic`,
    Underline: `Underline`,
    Strikethrough: `Strikethrough`,
    'Format as currency': `Format as currency`,
    'Format as percent': `Format as percent`,
    'Decrease decimal places': `Decrease decimal places`,
    'Increase decimal places': `Increase decimal places`,
    'More formats': `More formats`,
    Font: `Font`,
    'Text color': `Text color`,
    'Fill color': `Fill color`,
    Border: `Border`,
    'Merge cells': `Merge cells`,
    'Unmerge cells': `Unmerge cells`,
    'Select merge type': `Select merge type`,
    'Horizontal align': `Horizontal align`,
    'Vertical align': `Vertical align`,
    'Text wrapping': `Text wrapping`,
    'Insert link': `Insert link`,
    'Insert function': `Insert function`,
    'Create a filter': `Create a filter`,
    'Remove filter': `Remove filter`,
    'Insert note': `Insert note`,
    'Insert chart': `Insert chart`,
    'Apply text color': `Apply text color`,
    'Choose text color': `Choose text color`,
    'Apply fill color': `Apply fill color`,
    'Choose fill color': `Choose fill color`,
    'Apply border': `Apply border`,
    'Choose border': `Choose border`,
    More: `More`,
  },
}
