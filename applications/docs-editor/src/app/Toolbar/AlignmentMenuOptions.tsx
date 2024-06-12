import { LexicalEditor, FORMAT_ELEMENT_COMMAND, ElementFormatType } from 'lexical'
import AlignCenterIcon from '../Icons/AlignCenterIcon'
import AlignJustifyIcon from '../Icons/AlignJustifyIcon'
import AlignLeftIcon from '../Icons/AlignLeftIcon'
import AlignRightIcon from '../Icons/AlignRightIcon'
import { c } from 'ttag'
import { memo } from 'react'
import { DropdownMenuButton } from '@proton/components'
import clsx from '@proton/utils/clsx'

export const AlignmentOptions = [
  {
    align: 'left',
    name: c('Action').t`Left align`,
    icon: <AlignLeftIcon className="h-4 w-4 fill-current" />,
    onClick: (activeEditor: LexicalEditor) => {
      activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')
    },
  },
  {
    align: 'center',
    name: c('Action').t`Center align`,
    icon: <AlignCenterIcon className="h-4 w-4 fill-current" />,
    onClick: (activeEditor: LexicalEditor) => {
      activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')
    },
  },
  {
    align: 'right',
    name: c('Action').t`Right align`,
    icon: <AlignRightIcon className="h-4 w-4 fill-current" />,
    onClick: (activeEditor: LexicalEditor) => {
      activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')
    },
  },
  {
    align: 'justify',
    name: c('Action').t`Justify align`,
    icon: <AlignJustifyIcon className="h-4 w-4 fill-current" />,
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
