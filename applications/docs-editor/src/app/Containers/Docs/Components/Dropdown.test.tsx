import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRef, useState } from 'react'
import { Dropdown, DropdownMenu, DropdownMenuButton, SimpleDropdown } from './Dropdown'

it('allows switching directly to another menu without making the page inert', async () => {
  render(
    <>
      <SimpleDropdown as="button" content="Font">
        <DropdownMenuButton>Arial</DropdownMenuButton>
      </SimpleDropdown>
      <SimpleDropdown as="button" content="Alignment">
        <DropdownMenuButton>Left align</DropdownMenuButton>
      </SimpleDropdown>
    </>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Font' }), { detail: 1 })
  expect(await screen.findByRole('menuitem', { name: 'Arial' })).toBeVisible()
  const alignment = screen.getByRole('button', { name: 'Alignment' })
  expect(alignment.closest('[inert], [aria-hidden="true"]')).toBeNull()
  act(() => alignment.focus())
  fireEvent.mouseDown(alignment)
  fireEvent.mouseUp(alignment)
  fireEvent.click(alignment, { detail: 1 })
  expect(await screen.findByRole('menuitem', { name: 'Left align' })).toBeVisible()
  await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'Arial' })).not.toBeInTheDocument())
  expect(screen.getAllByRole('menu')).toHaveLength(1)
})

it('dismisses on outside focus without returning focus to the old menu trigger', async () => {
  render(
    <>
      <SimpleDropdown as="button" content="Font">
        <DropdownMenuButton>Arial</DropdownMenuButton>
      </SimpleDropdown>
      <input aria-label="Document title" />
    </>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Font' }))
  const item = await screen.findByRole('menuitem', { name: 'Arial' })
  act(() => item.focus())
  const title = screen.getByRole('textbox', { name: 'Document title' })
  act(() => title.focus())
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  expect(title).toHaveFocus()
})

it('keeps parent menus open for submenus, then closes both after selecting an action', async () => {
  const action = jest.fn()
  render(
    <SimpleDropdown content="Lists">
      <DropdownMenu>
        <SimpleDropdown as={DropdownMenuButton} content="Alphabetical" hasCaret={false}>
          <DropdownMenu>
            <DropdownMenuButton onClick={action}>Uppercase</DropdownMenuButton>
          </DropdownMenu>
        </SimpleDropdown>
      </DropdownMenu>
    </SimpleDropdown>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Lists' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Alphabetical' }))
  expect(await screen.findByRole('menuitem', { name: 'Uppercase' })).toBeVisible()
  expect(screen.getByRole('menuitem', { name: 'Alphabetical' })).toBeVisible()
  fireEvent.click(screen.getByRole('menuitem', { name: 'Uppercase' }))
  expect(action).toHaveBeenCalledTimes(1)
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
})

it('does not invoke disabled actions or close a menu with autoClose disabled', async () => {
  const disabledAction = jest.fn()
  const action = jest.fn()
  render(
    <SimpleDropdown content="Table" autoClose={false}>
      <DropdownMenu>
        <DropdownMenuButton disabled onClick={disabledAction}>
          Delete
        </DropdownMenuButton>
        <DropdownMenuButton onClick={action}>Insert row</DropdownMenuButton>
      </DropdownMenu>
    </SimpleDropdown>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Table' }))
  const disabled = await screen.findByRole('menuitem', { name: 'Delete' })
  fireEvent.click(disabled)
  expect(disabledAction).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('menuitem', { name: 'Insert row' }))
  expect(action).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('menu')).toBeVisible()
})

it('opens a submenu with the keyboard and returns focus so parent arrow navigation can continue', async () => {
  render(
    <SimpleDropdown content="Lists">
      <DropdownMenu>
        <SimpleDropdown as={DropdownMenuButton} content="Alphabetical" hasCaret={false}>
          <DropdownMenuButton>Uppercase</DropdownMenuButton>
        </SimpleDropdown>
        <DropdownMenuButton>Roman</DropdownMenuButton>
      </DropdownMenu>
    </SimpleDropdown>,
  )
  const lists = screen.getByRole('button', { name: 'Lists' })
  act(() => lists.focus())
  fireEvent.keyDown(lists, { key: 'ArrowDown' })
  const trigger = await screen.findByRole('menuitem', { name: 'Alphabetical' })
  // JSDOM has no layout; Ariakit checks visibility before restoring focus.
  Object.defineProperty(trigger, 'offsetWidth', { value: 1 })
  await waitFor(() => expect(trigger).toHaveFocus())
  fireEvent.keyDown(trigger, { key: 'ArrowRight' })
  const item = await screen.findByRole('menuitem', { name: 'Uppercase' })
  await waitFor(() => expect(item).toHaveFocus())
  fireEvent.keyDown(item, { key: 'ArrowLeft' })
  await waitFor(() => expect(trigger).toHaveFocus())
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  const roman = screen.getByRole('menuitem', { name: 'Roman' })
  await waitFor(() => expect(roman).toHaveFocus())
  fireEvent.keyDown(roman, { key: 'ArrowUp' })
  await waitFor(() => expect(trigger).toHaveFocus())
  fireEvent.keyDown(trigger, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
})

it('selects a nested menu action with Enter and closes both menus', async () => {
  const action = jest.fn()
  render(
    <SimpleDropdown content="Lists">
      <SimpleDropdown as={DropdownMenuButton} content="Alphabetical" hasCaret={false}>
        <DropdownMenuButton onClick={action}>Uppercase</DropdownMenuButton>
      </SimpleDropdown>
    </SimpleDropdown>,
  )
  const lists = screen.getByRole('button', { name: 'Lists' })
  act(() => lists.focus())
  fireEvent.keyDown(lists, { key: 'ArrowDown' })
  const trigger = await screen.findByRole('menuitem', { name: 'Alphabetical' })
  Object.defineProperty(trigger, 'offsetWidth', { value: 1 })
  await waitFor(() => expect(trigger).toHaveFocus())
  fireEvent.keyDown(trigger, { key: 'ArrowRight' })
  const item = await screen.findByRole('menuitem', { name: 'Uppercase' })
  await waitFor(() => expect(item).toHaveFocus())
  fireEvent.keyDown(item, { key: 'Enter' })
  await waitFor(() => expect(action).toHaveBeenCalledTimes(1))
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
})

it('keeps radio keyboard navigation open and closes after pointer selection', async () => {
  const onClosed = jest.fn()
  render(
    <SimpleDropdown content="Colour" contentProps={{ onClosed }}>
      <input type="radio" aria-label="Purple" />
    </SimpleDropdown>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Colour' }))
  const radio = await screen.findByRole('radio', { name: 'Purple' })
  fireEvent.click(radio)
  expect(screen.getByRole('menu')).toBeVisible()
  fireEvent.click(radio, { clientX: 10, clientY: 10 })
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  expect(onClosed).toHaveBeenCalledTimes(1)
})

it.each([false, true])(
  'returns focus after Escape from a controlled dropdown (disableFocusTrap=%s)',
  async (disableFocusTrap) => {
    const onClosed = jest.fn()
    function ControlledDropdown() {
      const anchorRef = useRef<HTMLButtonElement>(null)
      const [open, setOpen] = useState(false)
      return (
        <>
          <button ref={anchorRef} onClick={() => setOpen(true)}>
            More
          </button>
          <Dropdown
            anchorRef={anchorRef}
            isOpen={open}
            onClose={() => setOpen(false)}
            onClosed={onClosed}
            disableFocusTrap={disableFocusTrap}
          >
            <DropdownMenuButton>Action</DropdownMenuButton>
          </Dropdown>
        </>
      )
    }
    render(<ControlledDropdown />)
    const trigger = screen.getByRole('button', { name: 'More' })
    // JSDOM has no layout; Ariakit checks visibility before restoring focus.
    Object.defineProperty(trigger, 'offsetWidth', { value: 1 })
    act(() => trigger.focus())
    fireEvent.click(trigger)
    const menu = await screen.findByRole('menu')
    const action = screen.getByRole('menuitem', { name: 'Action' })
    act(() => action.focus())
    fireEvent.keyDown(menu, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    expect(onClosed).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(trigger).toHaveFocus())
  },
)

it('returns focus to a top-level menu button after Escape', async () => {
  render(
    <SimpleDropdown as="button" content="Table options">
      <DropdownMenuButton>Duplicate</DropdownMenuButton>
    </SimpleDropdown>,
  )
  const trigger = screen.getByRole('button', { name: 'Table options' })
  Object.defineProperty(trigger, 'offsetWidth', { value: 1 })
  act(() => trigger.focus())
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  const action = await screen.findByRole('menuitem', { name: 'Duplicate' })
  act(() => action.focus())
  fireEvent.keyDown(action, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  await waitFor(() => expect(trigger).toHaveFocus())
})

it.each(['Escape', 'Enter'])('lets toolbar menus return focus to the editor after %s', async (key) => {
  function ToolbarDropdown() {
    const editorRef = useRef<HTMLDivElement>(null)
    return (
      <>
        <div ref={editorRef} contentEditable aria-label="Editor" />
        <SimpleDropdown
          as="button"
          content="Heading"
          contentProps={{ autoFocusOnHide: false, onClosed: () => editorRef.current?.focus() }}
        >
          <DropdownMenuButton>Heading 1</DropdownMenuButton>
        </SimpleDropdown>
      </>
    )
  }
  render(<ToolbarDropdown />)
  const trigger = screen.getByRole('button', { name: 'Heading' })
  Object.defineProperty(trigger, 'offsetWidth', { value: 1 })
  act(() => trigger.focus())
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  const action = await screen.findByRole('menuitem', { name: 'Heading 1' })
  act(() => action.focus())
  fireEvent.keyDown(action, { key })
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  await waitFor(() => expect(screen.getByLabelText('Editor')).toHaveFocus())
})
