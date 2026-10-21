import { DropdownMenuButton } from '../Components/Dropdown'
import type { LexicalEditor, ElementFormatType } from 'lexical'
import { FORMAT_ELEMENT_COMMAND } from 'lexical'
import { memo } from 'react'
import { Icon } from '../Components/Icon'
import * as Icons from '../Components/icons'
import { clsx } from 'clsx'
import { ShortcutLabel } from '../Plugins/KeyboardShortcuts/ShortcutLabel'
import ToolbarTooltip from './ToolbarTooltip'
import { useDocsMessages } from '../DocsDependenciesProvider'
import type { DocsMessages } from '../messages/DocsMessages'

export const AlignmentOptions = [
  {
    align: 'left',
    name: (messages: DocsMessages) => messages.alignmentMenuOptions['Left align'],
    icon: <Icon data={Icons.textAlignLeft} />,
    label: <ShortcutLabel shortcut="LEFT_ALIGN_SHORTCUT" />,
    onClick: (activeEditor: LexicalEditor) => {
      activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')
    },
  },
  {
    align: 'center',
    name: (messages: DocsMessages) => messages.alignmentMenuOptions['Center align'],
    icon: <Icon data={Icons.textAlignCenter} />,
    label: <ShortcutLabel shortcut="CENTER_ALIGN_SHORTCUT" />,
    onClick: (activeEditor: LexicalEditor) => {
      activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')
    },
  },
  {
    align: 'right',
    name: (messages: DocsMessages) => messages.alignmentMenuOptions['Right align'],
    icon: <Icon data={Icons.textAlignRight} />,
    label: <ShortcutLabel shortcut="RIGHT_ALIGN_SHORTCUT" />,
    onClick: (activeEditor: LexicalEditor) => {
      activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')
    },
  },
  {
    align: 'justify',
    name: (messages: DocsMessages) => messages.alignmentMenuOptions['Justify align'],
    label: <ShortcutLabel shortcut="JUSTIFY_SHORTCUT" />,
    icon: <Icon data={Icons.textAlignJustify} />,
    onClick: (activeEditor: LexicalEditor) => {
      activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')
    },
  },
]

function AlignmentMenuOptions({
  activeEditor,
  elementFormat,
  isEditable,
}: {
  activeEditor: LexicalEditor
  elementFormat: ElementFormatType
  isEditable: boolean
}) {
  const messages = useDocsMessages()
  return AlignmentOptions.map(({ align, label, icon, name, onClick }) => (
    <ToolbarTooltip key={align} title={label} originalPlacement="right">
      <DropdownMenuButton
        className={clsx('flex items-center gap-2 text-left text-sm', align === elementFormat && 'active font-bold')}
        onClick={() => onClick(activeEditor)}
        disabled={!isEditable}
      >
        {icon}
        {name(messages)}
      </DropdownMenuButton>
    </ToolbarTooltip>
  ))
}

export default memo(AlignmentMenuOptions)

export const alignmentMenuOptionsMessages = {
  alignmentMenuOptions: {
    'Left align': 'Left align',
    'Center align': 'Center align',
    'Right align': 'Right align',
    'Justify align': 'Justify align',
  },
}
