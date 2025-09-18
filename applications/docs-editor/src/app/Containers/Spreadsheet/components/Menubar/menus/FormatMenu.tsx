import * as Ariakit from '@ariakit/react'
import type { ReactElement } from 'react'
import { c } from 'ttag'
import { createStringifier } from '../../../stringifier'
import * as UI from '../../ui'
import * as Icons from '../../icons'
import { NumberFormatsMenu } from '../../shared/NumberFormatsMenu'
import { FONT_SIZE_DEFAULT, FONT_SIZE_SUGGESTIONS } from '../../../constants'
import { useUI } from '../../../ui-store'
import { getWrappingIcon } from '../../utils'

const { s } = createStringifier(strings)

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
        <UI.MenuSeparator />
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
  // TODO: we're not doing themes yet
  return
  // biome-ignore lint/correctness/noUnreachable: kept for the future
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon legacyName="palette" />}>{s('Theme')}</UI.SubMenuButton>
      <UI.SubMenu>
        {/* TODO: implement */}
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="clock" />}>Coming soon...</UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function TableFormattingSubmenu() {
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon data={Icons.layoutGrid} />}
        disabled={useUI((ui) => ui.info.isReadonly)}
      >
        {s('Table formatting')}
      </UI.SubMenuButton>
      <UI.SubMenu>
        {/* TODO: waiting for SVG for implementation */}
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="clock" />}>Coming soon...</UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function CellStylesSubmenu() {
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.brush} />} disabled={useUI((ui) => ui.info.isReadonly)}>
        {s('Cell styles')}
      </UI.SubMenuButton>
      <UI.SubMenu>
        {/* TODO: implement */}
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="clock" />}>Coming soon...</UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function NumberSubmenu() {
  return (
    <NumberFormatsMenu asSubmenu>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.numbers} />} disabled={useUI((ui) => ui.info.isReadonly)}>
        {s('Number')}
      </UI.SubMenuButton>
    </NumberFormatsMenu>
  )
}

function TextSubmenu() {
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon legacyName="text-bold" />}
        disabled={useUI((ui) => ui.info.isReadonly)}
      >
        {s('Text')}
      </UI.SubMenuButton>
      <UI.SubMenu>
        <UI.MenuItemCheckbox
          name="format"
          value="bold"
          leadingIconSlot={<UI.Icon legacyName="text-bold" />}
          hintSlot="⌘B"
          onClick={useUI.$.withFocusGrid(useUI.$.format.text.bold.toggle)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Bold')}
        </UI.MenuItemCheckbox>
        <UI.MenuItemCheckbox
          name="format"
          value="italic"
          leadingIconSlot={<UI.Icon legacyName="text-italic" />}
          hintSlot="⌘I"
          onClick={useUI.$.withFocusGrid(useUI.$.format.text.italic.toggle)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Italic')}
        </UI.MenuItemCheckbox>
        <UI.MenuItemCheckbox
          name="format"
          value="underline"
          leadingIconSlot={<UI.Icon legacyName="text-underline" />}
          hintSlot="⌘U"
          onClick={useUI.$.withFocusGrid(useUI.$.format.text.underline.toggle)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Underline')}
        </UI.MenuItemCheckbox>
        <UI.MenuItemCheckbox
          name="format"
          value="strikethrough"
          leadingIconSlot={<UI.Icon legacyName="text-strikethrough" />}
          hintSlot="⌘+Shift+X"
          onClick={useUI.$.withFocusGrid(useUI.$.format.text.strikethrough.toggle)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Strikethrough')}
        </UI.MenuItemCheckbox>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function AlignmentSubmenu() {
  const setHorizontalAlignment = useUI.$.format.alignment.horizontal.set
  const setVerticalAlignment = useUI.$.format.alignment.vertical.set
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon legacyName="text-align-left" />}
        disabled={useUI((ui) => ui.info.isReadonly)}
      >
        {s('Alignment')}
      </UI.SubMenuButton>
      <UI.SubMenu>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon legacyName="text-align-left" />}
          hintSlot="⌘+Shift+L"
          onClick={useUI.$.withFocusGrid(() => setHorizontalAlignment('left'))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Left')}
        </UI.MenuItem>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon legacyName="text-align-center" />}
          hintSlot="⌘+Shift+E"
          onClick={useUI.$.withFocusGrid(() => setHorizontalAlignment('center'))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Center')}
        </UI.MenuItem>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon legacyName="text-align-right" />}
          hintSlot="⌘+Shift+R"
          onClick={useUI.$.withFocusGrid(() => setHorizontalAlignment('right'))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Right')}
        </UI.MenuItem>
        <UI.MenuSeparator />
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.alignTop} />}
          onClick={useUI.$.withFocusGrid(() => setVerticalAlignment('top'))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Top')}
        </UI.MenuItem>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.alignVerticalCenter} />}
          onClick={useUI.$.withFocusGrid(() => setVerticalAlignment('middle'))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Middle')}
        </UI.MenuItem>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.alignBottom} />}
          onClick={useUI.$.withFocusGrid(() => setVerticalAlignment('bottom'))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Bottom')}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function WrappingSubmenu() {
  const setWrapping = useUI.$.format.wrapping.set
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon data={getWrappingIcon(useUI((ui) => ui.format.wrapping.value))} />}
        disabled={useUI((ui) => ui.info.isReadonly)}
      >
        {s('Wrapping')}
      </UI.SubMenuButton>
      <UI.SubMenu>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.textOverflow} />}
          onClick={useUI.$.withFocusGrid(() => setWrapping(undefined))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Overflow')}
        </UI.MenuItem>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.textWrap} />}
          onClick={useUI.$.withFocusGrid(() => setWrapping('wrap'))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Wrap')}
        </UI.MenuItem>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon data={Icons.textClip} />}
          onClick={useUI.$.withFocusGrid(() => setWrapping('clip'))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Clip')}
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
//       <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.fontSize} />}>{s('Font size')}</UI.SubMenuButton>
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
  const fontSize = useUI((ui) => ui.format.text.fontSize.value) ?? FONT_SIZE_DEFAULT
  const setFontSize = useUI.$.format.text.fontSize.set
  const disabled = useUI((ui) => ui.info.isReadonly)
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.fontSize} />} disabled={disabled}>
        {s('Font size')}
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
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.merge} />} disabled={useUI((ui) => ui.info.isReadonly)}>
        {s('Merge cells')} (unimplemented)
      </UI.SubMenuButton>
      <UI.SubMenu>
        <UI.MenuItem disabled={useUI((ui) => ui.info.isReadonly)}>{s('Merge all')}</UI.MenuItem>
        <UI.MenuItem disabled={useUI((ui) => ui.info.isReadonly)}>{s('Merge vertically')}</UI.MenuItem>
        <UI.MenuItem disabled={useUI((ui) => ui.info.isReadonly)}>{s('Merge horizontally')}</UI.MenuItem>
        <UI.MenuItem disabled={useUI((ui) => ui.info.isReadonly)}>{s('Unmerge')}</UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function ConditionalFormatting() {
  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon legacyName="broom" />}
      onClick={useUI.$.format.conditional.open}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {s('Conditional formatting')}
    </UI.MenuItem>
  )
}

function ClearSubmenu() {
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon legacyName="cross-big" />}
        disabled={useUI((ui) => ui.info.isReadonly)}
      >
        {s('Clear')}
      </UI.SubMenuButton>
      <UI.SubMenu>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon legacyName="eraser" />}
          onClick={useUI.$.withFocusGrid(useUI.$.format.clear)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Clear formatting')} (broken)
        </UI.MenuItem>
        <UI.MenuItem
          leadingIconSlot={<UI.Icon legacyName="cross-big" />}
          onClick={useUI.$.withFocusGrid(useUI.$.operation.delete)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Clear content')}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function strings() {
  return {
    Theme: c('sheets_2025:Spreadsheet editor menubar format menu').t`Theme`,
    'Table formatting': c('sheets_2025:Spreadsheet editor menubar format menu').t`Table formatting`,
    'Cell styles': c('sheets_2025:Spreadsheet editor menubar format menu').t`Cell styles`,
    Number: c('sheets_2025:Spreadsheet editor menubar format menu').t`Number`,
    Text: c('sheets_2025:Spreadsheet editor menubar format menu').t`Text`,
    Bold: c('sheets_2025:Spreadsheet editor menubar format menu').t`Bold`,
    Italic: c('sheets_2025:Spreadsheet editor menubar format menu').t`Italic`,
    Underline: c('sheets_2025:Spreadsheet editor menubar format menu').t`Underline`,
    Strikethrough: c('sheets_2025:Spreadsheet editor menubar format menu').t`Strikethrough`,
    Alignment: c('sheets_2025:Spreadsheet editor menubar format menu').t`Alignment`,
    Left: c('sheets_2025:Spreadsheet editor menubar format menu (alignment)').t`Left`,
    Center: c('sheets_2025:Spreadsheet editor menubar format menu (alignment)').t`Center`,
    Right: c('sheets_2025:Spreadsheet editor menubar format menu (alignment)').t`Right`,
    Top: c('sheets_2025:Spreadsheet editor menubar format menu (alignment)').t`Top`,
    Middle: c('sheets_2025:Spreadsheet editor menubar format menu (alignment)').t`Middle`,
    Bottom: c('sheets_2025:Spreadsheet editor menubar format menu (alignment)').t`Bottom`,
    Wrapping: c('sheets_2025:Spreadsheet editor menubar format menu').t`Wrapping`,
    Overflow: c('sheets_2025:Spreadsheet editor menubar format menu (wrapping)').t`Overflow`,
    Wrap: c('sheets_2025:Spreadsheet editor menubar format menu (wrapping)').t`Wrap`,
    Clip: c('sheets_2025:Spreadsheet editor menubar format menu (wrapping)').t`Clip`,
    'Font size': c('sheets_2025:Spreadsheet editor menubar format menu').t`Font size`,
    'Merge cells': c('sheets_2025:Spreadsheet editor menubar format menu').t`Merge cells`,
    'Merge all': c('sheets_2025:Spreadsheet editor menubar format menu (merge cells)').t`Merge all`,
    'Merge vertically': c('sheets_2025:Spreadsheet editor menubar format menu (merge cells)').t`Merge vertically`,
    'Merge horizontally': c('sheets_2025:Spreadsheet editor menubar format menu (merge cells)').t`Merge horizontally`,
    Unmerge: c('sheets_2025:Spreadsheet editor menubar format menu (merge cells)').t`Unmerge`,
    'Conditional formatting': c('sheets_2025:Spreadsheet editor menubar format menu').t`Conditional formatting`,
    Clear: c('sheets_2025:Spreadsheet editor menubar format menu').t`Clear`,
    'Clear formatting': c('sheets_2025:Spreadsheet editor menubar format menu').t`Clear formatting`,
    'Clear content': c('sheets_2025:Spreadsheet editor menubar format menu').t`Clear content`,
  }
}
