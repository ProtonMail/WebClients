import type { LexicalEditor, ElementFormatType } from 'lexical'
import { FORMAT_ELEMENT_COMMAND } from 'lexical'
import { c } from 'ttag'
import { memo } from 'react'
import { DropdownMenuButton } from '@proton/components'
import { IcTextAlignCenter } from '@proton/icons/icons/IcTextAlignCenter'
import { IcTextAlignJustify } from '@proton/icons/icons/IcTextAlignJustify'
import { IcTextAlignLeft } from '@proton/icons/icons/IcTextAlignLeft'
import { IcTextAlignRight } from '@proton/icons/icons/IcTextAlignRight'
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
    icon: <IcTextAlignLeft />,
    label: <ShortcutLabel shortcut="LEFT_ALIGN_SHORTCUT" />,
    onClick: (activeEditor: LexicalEditor) => {
      activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')
    },
  },
  {
    align: 'center',
    name: () => c('Action').t`Center align`,
    icon: <IcTextAlignCenter />,
    label: <ShortcutLabel shortcut="CENTER_ALIGN_SHORTCUT" />,
    onClick: (activeEditor: LexicalEditor) => {
      activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')
    },
  },
  {
    align: 'right',
    name: () => c('Action').t`Right align`,
    icon: <IcTextAlignRight />,
    label: <ShortcutLabel shortcut="RIGHT_ALIGN_SHORTCUT" />,
    onClick: (activeEditor: LexicalEditor) => {
      activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')
    },
  },
  {
    align: 'justify',
    name: () => c('Action').t`Justify align`,
    label: <ShortcutLabel shortcut="JUSTIFY_SHORTCUT" />,
    icon: <IcTextAlignJustify />,
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
