import { useSheetsMessages } from '../../../SheetsDependenciesProvider'
import * as Ariakit from '@ariakit/react'
import type { ReactElement } from 'react'

import * as UI from '../../ui'
import * as Icons from '../../icons'
import { NumberFormatsMenu } from '../../shared/NumberFormatsMenu'
import { FONT_SIZE_DEFAULT, FONT_SIZE_SUGGESTIONS } from '../../../constants'
import { useUI } from '../../../ui-store'
import { getWrappingIcon } from '../../utils'
import { MergeMenuItems } from '../../shared/MergeMenuItems'

export interface FormatMenuProps extends Ariakit.MenuProviderProps {
  renderMenuButton: ReactElement
}

export function FormatMenu({ renderMenuButton, ...props }: FormatMenuProps) {
  return (
    <Ariakit.MenuProvider {...props}>
      <Ariakit.MenuButton render={renderMenuButton} />
      <UI.Menu>
        <ThemeSubmenu />
        <TableFormattingSubmenu />
        <CellStylesSubmenu />
        {/* <UI.MenuSeparator /> */}
        <NumberSubmenu />
        <TextSubmenu />
        <AlignmentSubmenu />
        <WrappingSubmenu />
        <UI.MenuSeparator />
        <FontSizeSubmenu />
        <MergeCellsSubmenu />
        <UI.MenuSeparator />
        <ConditionalFormatting />
        <UI.MenuSeparator />
        <ClearSubmenu />
      </UI.Menu>
    </Ariakit.MenuProvider>
  )
}

function ThemeSubmenu() {
  const messages = useSheetsMessages()

  // TODO: we're not doing themes yet
  return
  // biome-ignore lint/correctness/noUnreachable: kept for the future
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.palette} />}>
        {messages.formatMenu.Theme}
      </UI.SubMenuButton>
      <UI.SubMenu>
        {/* TODO: implement */}
        <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.clock} />}>
          {messages.formatMenu['Coming soon...']}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function TableFormattingSubmenu() {
  const messages = useSheetsMessages()

  // TODO: implement
  return
  // biome-ignore lint/correctness/noUnreachable: kept for the future
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon data={Icons.layoutGrid} />}
        disabled={useUI((ui) => ui.info.isReadonly)}
      >
        {messages.formatMenu['Table formatting']}
      </UI.SubMenuButton>
      <UI.SubMenu>
        {/* TODO: waiting for SVG for implementation */}
        <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.clock} />}>
          {messages.formatMenu['Coming soon...']}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function CellStylesSubmenu() {
  const messages = useSheetsMessages()

  // TODO: implement
  return
  // biome-ignore lint/correctness/noUnreachable: kept for the future
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.brush} />} disabled={useUI((ui) => ui.info.isReadonly)}>
        {messages.formatMenu['Cell styles']}
      </UI.SubMenuButton>
      <UI.SubMenu>
        {/* TODO: implement */}
        <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.clock} />}>
          {messages.formatMenu['Coming soon...']}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function NumberSubmenu() {
  const messages = useSheetsMessages()

  return (
    <NumberFormatsMenu asSubmenu>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.numbers} />} disabled={useUI((ui) => ui.info.isReadonly)}>
        {messages.formatMenu.Number}
      </UI.SubMenuButton>
    </NumberFormatsMenu>
  )
}

function TextSubmenu() {
  const messages = useSheetsMessages()

  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon data={Icons.textBold} />}
        disabled={useUI((ui) => ui.info.isReadonly)}
      >
        {messages.formatMenu.Text}
      </UI.SubMenuButton>
      <UI.SubMenu>
        <UI.MenuItemCheckbox
          name="format"
          value="bold"
          leadingIconSlot={<UI.Icon data={Icons.textBold} />}
          hintSlot="⌘B"
          onClick={useUI.$.withFocusGrid(useUI.$.format.text.bold.toggle)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.formatMenu.Bold}
        </UI.MenuItemCheckbox>
        <UI.MenuItemCheckbox
          name="format"
          value="italic"
          leadingIconSlot={<UI.Icon data={Icons.textItalic} />}
          hintSlot="⌘I"
          onClick={useUI.$.withFocusGrid(useUI.$.format.text.italic.toggle)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.formatMenu.Italic}
        </UI.MenuItemCheckbox>
        <UI.MenuItemCheckbox
          name="format"
          value="underline"
          leadingIconSlot={<UI.Icon data={Icons.textUnderline} />}
          hintSlot="⌘U"
          onClick={useUI.$.withFocusGrid(useUI.$.format.text.underline.toggle)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.formatMenu.Underline}
        </UI.MenuItemCheckbox>
        <UI.MenuItemCheckbox
          name="format"
          value="strikethrough"
          leadingIconSlot={<UI.Icon data={Icons.textStrikethrough} />}
          hintSlot="⌘+Shift+X"
          onClick={useUI.$.withFocusGrid(useUI.$.format.text.strikethrough.toggle)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.formatMenu.Strikethrough}
        </UI.MenuItemCheckbox>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function AlignmentSubmenu() {
  const messages = useSheetsMessages()

  const setHorizontalAlignment = useUI.$.format.alignment.horizontal.set
  const setVerticalAlignment = useUI.$.format.alignment.vertical.set
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon data={Icons.textAlignLeft} />}
        disabled={useUI((ui) => ui.info.isReadonly)}
      >
        {messages.formatMenu.Alignment}
      </UI.SubMenuButton>
      <UI.SubMenu>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.textAlignLeft} />}
          hintSlot="⌘+Shift+L"
          onClick={useUI.$.withFocusGrid(() => setHorizontalAlignment('left'))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.formatMenu.Left}
        </UI.MenuItem>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.textAlignCenter} />}
          hintSlot="⌘+Shift+E"
          onClick={useUI.$.withFocusGrid(() => setHorizontalAlignment('center'))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.formatMenu.Center}
        </UI.MenuItem>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.textAlignRight} />}
          hintSlot="⌘+Shift+R"
          onClick={useUI.$.withFocusGrid(() => setHorizontalAlignment('right'))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.formatMenu.Right}
        </UI.MenuItem>
        <UI.MenuSeparator />
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.alignTop} />}
          onClick={useUI.$.withFocusGrid(() => setVerticalAlignment('top'))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.formatMenu.Top}
        </UI.MenuItem>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.alignVerticalCenter} />}
          onClick={useUI.$.withFocusGrid(() => setVerticalAlignment('middle'))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.formatMenu.Middle}
        </UI.MenuItem>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.alignBottom} />}
          onClick={useUI.$.withFocusGrid(() => setVerticalAlignment('bottom'))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.formatMenu.Bottom}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function WrappingSubmenu() {
  const messages = useSheetsMessages()

  const setWrapping = useUI.$.format.wrapping.set
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon data={getWrappingIcon(useUI((ui) => ui.format.wrapping.value))} />}
        disabled={useUI((ui) => ui.info.isReadonly)}
      >
        {messages.formatMenu.Wrapping}
      </UI.SubMenuButton>
      <UI.SubMenu>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.textOverflow} />}
          onClick={useUI.$.withFocusGrid(() => setWrapping(undefined))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.formatMenu.Overflow}
        </UI.MenuItem>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.textWrap} />}
          onClick={useUI.$.withFocusGrid(() => setWrapping('wrap'))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.formatMenu.Wrap}
        </UI.MenuItem>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.textClip} />}
          onClick={useUI.$.withFocusGrid(() => setWrapping('clip'))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.formatMenu.Clip}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

// TODO: same problem as in View menu/ShowSubmenu (in Menubar), same workaround (see comment there)
// function FontSizeSubmenu() {
//   const fontSize = useUI((ui) => ui.format.text.fontSize.value) ?? FONT_SIZE_DEFAULT
//   const values = useMemo(() => ({ 'font-size': fontSize }), [fontSize])
//   return (
//     <Ariakit.MenuProvider values={values}>
//       <UI.SubMenuButton leadingIconSlot={<UI.Icon data={fontSizeIcon} />}>{s('Font size')}</UI.SubMenuButton>
//       <UI.SubMenu>
//         {FONT_SIZE_SUGGESTIONS.map((size) => (
//           <UI.MenuItemRadio name="font-size" key={size} value={size}>
//             {size}
//           </UI.MenuItemRadio>
//         ))}
//       </UI.SubMenu>
//     </Ariakit.MenuProvider>
//   )
// }

function FontSizeSubmenu() {
  const messages = useSheetsMessages()

  const fontSize = useUI((ui) => ui.format.text.fontSize.value) ?? FONT_SIZE_DEFAULT
  const setFontSize = useUI.$.format.text.fontSize.set
  const disabled = useUI((ui) => ui.info.isReadonly)
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.fontSize} />} disabled={disabled}>
        {messages.formatMenu['Font size']}
      </UI.SubMenuButton>
      <UI.SubMenu>
        {FONT_SIZE_SUGGESTIONS.map((size) => (
          <UI.MenuItem
            key={size}
            leadingIndent
            selectedIndicator={fontSize === size}
            onClick={useUI.$.withFocusGrid(() => setFontSize(size))}
            disabled={disabled}
          >
            {size}
          </UI.MenuItem>
        ))}
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function MergeCellsSubmenu() {
  const messages = useSheetsMessages()

  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon data={Icons.merge} />}
        disabled={useUI((ui) => !ui.format.merge.menu.enabled || ui.info.isReadonly)}
      >
        {messages.formatMenu['Merge cells']}
      </UI.SubMenuButton>
      <UI.SubMenu>
        <MergeMenuItems />
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function ConditionalFormatting() {
  const messages = useSheetsMessages()

  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon data={Icons.broom} />}
      onClick={useUI.$.format.conditional.open}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {messages.formatMenu['Conditional formatting']}
    </UI.MenuItem>
  )
}

function ClearSubmenu() {
  const messages = useSheetsMessages()

  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon data={Icons.crossBig} />}
        disabled={useUI((ui) => ui.info.isReadonly)}
      >
        {messages.formatMenu.Clear}
      </UI.SubMenuButton>
      <UI.SubMenu>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.eraser} />}
          onClick={useUI.$.withFocusGrid(useUI.$.format.clear)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.formatMenu['Clear formatting']}
        </UI.MenuItem>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.crossBig} />}
          onClick={useUI.$.withFocusGrid(useUI.$.operation.delete)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.formatMenu['Clear content']}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

export const formatMenuMessages = {
  formatMenu: {
    Theme: `Theme`,
    'Table formatting': `Table formatting`,
    'Cell styles': `Cell styles`,
    Number: `Number`,
    Text: `Text`,
    Bold: `Bold`,
    Italic: `Italic`,
    Underline: `Underline`,
    Strikethrough: `Strikethrough`,
    Alignment: `Alignment`,
    Left: `Left`,
    Center: `Center`,
    Right: `Right`,
    Top: `Top`,
    Middle: `Middle`,
    Bottom: `Bottom`,
    Wrapping: `Wrapping`,
    Overflow: `Overflow`,
    Wrap: `Wrap`,
    Clip: `Clip`,
    'Font size': `Font size`,
    'Merge cells': `Merge cells`,
    'Conditional formatting': `Conditional formatting`,
    Clear: `Clear`,
    'Clear formatting': `Clear formatting`,
    'Clear content': `Clear content`,

    'Coming soon...': 'Coming soon...',
  },
}
