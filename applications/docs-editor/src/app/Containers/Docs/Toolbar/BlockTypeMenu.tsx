import type { HeadingTagType } from '@lexical/rich-text'
import type { BlockType } from '../Plugins/BlockTypePlugin'
import { blockTypeToBlockName } from '../Plugins/BlockTypePlugin'
import { DropdownMenu, DropdownMenuButton } from '../Components/Dropdown'
import { ShortcutLabel } from '../Plugins/KeyboardShortcuts/ShortcutLabel'
import ToolbarTooltip from './ToolbarTooltip'

export function BlockTypeMenu({
  isEditable,
  formatParagraph,
  formatHeading,
}: {
  isEditable: boolean
  formatParagraph: () => void
  formatHeading: (heading: HeadingTagType) => void
}) {
  const blockTypes: {
    type: BlockType
    name: string
    tooltip: React.ReactNode
    onClick: () => void
    className?: string
  }[] = [
    {
      type: 'paragraph',
      name: blockTypeToBlockName.paragraph,
      onClick: formatParagraph,
      tooltip: <ShortcutLabel shortcut="NORMAL_TEXT_SHORTCUT" />,
      className: 'Lexical__paragraph text-base',
    },
    {
      type: 'h1',
      name: blockTypeToBlockName.h1,
      onClick: () => formatHeading('h1'),
      tooltip: <ShortcutLabel shortcut="HEADING_1_SHORTCUT" />,
      className: 'Lexical__h1 mb-0 mt-0',
    },
    {
      type: 'h2',
      name: blockTypeToBlockName.h2,
      onClick: () => formatHeading('h2'),
      tooltip: <ShortcutLabel shortcut="HEADING_2_SHORTCUT" />,
      className: 'Lexical__h2 mb-0 mt-0',
    },
    {
      type: 'h3',
      name: blockTypeToBlockName.h3,
      onClick: () => formatHeading('h3'),
      tooltip: <ShortcutLabel shortcut="HEADING_3_SHORTCUT" />,
      className: 'Lexical__h3 mb-0 mt-0',
    },
    {
      type: 'h4',
      name: blockTypeToBlockName.h4,
      onClick: () => formatHeading('h4'),
      tooltip: <ShortcutLabel shortcut="HEADING_4_SHORTCUT" />,
      className: 'Lexical__h4 color-weak mb-0 mt-0',
    },
    {
      type: 'h5',
      name: blockTypeToBlockName.h5,
      onClick: () => formatHeading('h5'),
      tooltip: <ShortcutLabel shortcut="HEADING_5_SHORTCUT" />,
      className: 'Lexical__h5 color-weak mb-0 mt-0',
    },
    {
      type: 'h6',
      name: blockTypeToBlockName.h6,
      onClick: () => formatHeading('h6'),
      tooltip: <ShortcutLabel shortcut="HEADING_6_SHORTCUT" />,
      className: 'Lexical__h6 color-weak mb-0 mt-0',
    },
  ]

  return (
    <DropdownMenu>
      {blockTypes.map(({ type, name, onClick, tooltip, className }) => (
        <ToolbarTooltip key={type} title={tooltip} originalPlacement="right">
          <DropdownMenuButton className="text-left" onClick={onClick} disabled={!isEditable}>
            <span className={className}>{name}</span>
          </DropdownMenuButton>
        </ToolbarTooltip>
      ))}
    </DropdownMenu>
  )
}
