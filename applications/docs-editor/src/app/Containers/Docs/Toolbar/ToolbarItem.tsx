import { SimpleDropdown } from '../Components/Dropdown'
import { Button } from '../Components/ui'
import { ShortcutLabel } from '../Plugins/KeyboardShortcuts/ShortcutLabel'
import type { ToolbarItemInterface } from './ToolbarItemInterface'
import ToolbarTooltip from './ToolbarTooltip'
import { ToolbarButton } from './ToolbarButton'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { fixEmptyRoot } from '../Utils/fixEmptyRoot'

export function ToolbarItem({ item }: { item: ToolbarItemInterface }) {
  const [editor] = useLexicalComposerContext()

  if (item.type === 'button') {
    return (
      <ToolbarButton
        label={item.shortcut ? <ShortcutLabel shortcut={item.shortcut} label={item.label} /> : item.label}
        data-testid={item.id}
        active={item.active}
        disabled={item.disabled}
        onClick={item.onClick}
      >
        {item.icon}
      </ToolbarButton>
    )
  }

  const triggerProps = item.useToolbarButton
    ? { as: ToolbarButton, active: item.active }
    : ({ as: Button, shape: 'ghost', color: 'norm' } as const)
  const dropdown = (
    <SimpleDropdown
      {...triggerProps}
      type="button"
      className="px-2 text-left text-sm text-[--text-norm]"
      content={item.label('toolbar')}
      disabled={item.disabled}
      contentProps={item.dropdownProps}
      data-testid={item.id}
      hasCaret={item.hasCaret}
      onClick={() => {
        fixEmptyRoot(editor)
      }}
    >
      {item.menu}
    </SimpleDropdown>
  )

  if (item.tooltip) {
    return (
      <ToolbarTooltip originalPlacement="bottom" title={item.tooltip}>
        {dropdown}
      </ToolbarTooltip>
    )
  }

  return dropdown
}
