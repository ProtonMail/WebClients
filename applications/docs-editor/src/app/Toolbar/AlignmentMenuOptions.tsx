import { LexicalEditor, FORMAT_ELEMENT_COMMAND, ElementFormatType } from 'lexical'
import { c } from 'ttag'
import { memo } from 'react'
import { DropdownMenuButton, Icon } from '@proton/components'
import clsx from '@proton/utils/clsx'

export const AlignmentOptions = [
  {
    align: 'left',
    name: c('Action').t`Left align`,
    icon: <Icon name="text-align-left" />,
    onClick: (activeEditor: LexicalEditor) => {
      activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')
    },
  },
  {
    align: 'center',
    name: c('Action').t`Center align`,
    icon: <Icon name="text-align-center" />,
    onClick: (activeEditor: LexicalEditor) => {
      activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')
    },
  },
  {
    align: 'right',
    name: c('Action').t`Right align`,
    icon: <Icon name="text-align-right" />,
    onClick: (activeEditor: LexicalEditor) => {
      activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')
    },
  },
  {
    align: 'justify',
    name: c('Action').t`Justify align`,
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
  return AlignmentOptions.map(({ align, icon, name, onClick }) => (
    <DropdownMenuButton
      key={align}
      className={clsx(
        'flex items-center gap-2 text-left text-sm',
        align === elementFormat && 'bg-[--primary-minor-2] font-bold',
      )}
      onClick={() => onClick(activeEditor)}
      disabled={!isEditable}
    >
      {icon}
      {name}
    </DropdownMenuButton>
  ))
}

export default memo(AlignmentMenuOptions)
