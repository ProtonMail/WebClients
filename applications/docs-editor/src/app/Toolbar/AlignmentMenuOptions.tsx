import type { LexicalEditor, ElementFormatType } from 'lexical'
import { FORMAT_ELEMENT_COMMAND } from 'lexical'
import { c } from 'ttag'
import { memo } from 'react'
import { DropdownMenuButton, Icon } from '@proton/components'
import clsx from '@proton/utils/clsx'
import { ShortcutLabel } from '../Plugins/KeyboardShortcuts/ShortcutLabel'
import ToolbarTooltip from './ToolbarTooltip'

/**
 * `name` must be a function since localized strings are not available at compile time.
 */
export const AlignmentOptions = [
  {
    align: 'left',
    name: () => c('Action').t`Left align`,
    icon: <Icon name="text-align-left" />,
    label: <ShortcutLabel shortcut="LEFT_ALIGN_SHORTCUT" />,
    onClick: (activeEditor: LexicalEditor) => {
      activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')
    },
  },
  {
    align: 'center',
    name: () => c('Action').t`Center align`,
    icon: <Icon name="text-align-center" />,
    label: <ShortcutLabel shortcut="CENTER_ALIGN_SHORTCUT" />,
    onClick: (activeEditor: LexicalEditor) => {
      activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')
    },
  },
  {
    align: 'right',
    name: () => c('Action').t`Right align`,
    icon: <Icon name="text-align-right" />,
    label: <ShortcutLabel shortcut="RIGHT_ALIGN_SHORTCUT" />,
    onClick: (activeEditor: LexicalEditor) => {
      activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')
    },
  },
  {
    align: 'justify',
    name: () => c('Action').t`Justify align`,
    label: <ShortcutLabel shortcut="JUSTIFY_SHORTCUT" />,
    icon: <Icon name="text-align-justify" />,
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
  return AlignmentOptions.map(({ align, label, icon, name, onClick }) => (
    <ToolbarTooltip key={align} title={label} originalPlacement="right">
      <DropdownMenuButton
        className={clsx('flex items-center gap-2 text-left text-sm', align === elementFormat && 'active font-bold')}
        onClick={() => onClick(activeEditor)}
        disabled={!isEditable}
      >
        {icon}
        {name()}
      </DropdownMenuButton>
    </ToolbarTooltip>
  ))
}

export default memo(AlignmentMenuOptions)
