import { render, screen } from '@testing-library/react'
import { ToolbarItem } from './ToolbarItem'
import type { ToolbarItemInterface } from './ToolbarItemInterface'

jest.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [{ getRootElement: () => null, update: jest.fn() }],
}))

function dropdownItem(overrides: Partial<ToolbarItemInterface>): ToolbarItemInterface {
  return {
    id: 'headings-options',
    type: 'dropdown',
    label: () => 'Normal',
    menu: null,
    dropdownProps: {},
    overflowBehavior: 'submenu',
    active: true,
    ...overrides,
  } as ToolbarItemInterface
}

it('renders a text dropdown as a ghost Docs button without leaking the active state to the DOM', () => {
  render(<ToolbarItem item={dropdownItem({})} />)

  const trigger = screen.getByRole('button', { name: 'Normal' })
  expect(trigger).toHaveClass('bg-[--interaction-default]', 'hover:text-[--interaction-norm-major-2]', 'px-2')
  expect(trigger).not.toHaveAttribute('active')
})

it('passes the active state, and no button styling props, to a toolbar button dropdown', () => {
  render(<ToolbarItem item={dropdownItem({ id: 'alignment-button', useToolbarButton: true })} />)

  const trigger = screen.getByRole('button', { name: 'Normal' })
  expect(trigger).toHaveClass('editor-toolbar-button', 'active')
  for (const prop of ['active', 'shape', 'color']) {
    expect(trigger).not.toHaveAttribute(prop)
  }
})
