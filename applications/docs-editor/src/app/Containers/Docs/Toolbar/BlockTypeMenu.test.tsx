import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { SimpleDropdown } from '../Components/Dropdown'
import { BlockTypeMenu } from './BlockTypeMenu'

function renderMenu(isEditable = true) {
  const formatParagraph = jest.fn()
  const formatHeading = jest.fn()
  render(
    <SimpleDropdown content="Block type">
      <BlockTypeMenu isEditable={isEditable} formatParagraph={formatParagraph} formatHeading={formatHeading} />
    </SimpleDropdown>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Block type' }))
  return { formatParagraph, formatHeading }
}

it('applies document preview typography to labels inside menu buttons', async () => {
  renderMenu()
  const normal = await screen.findByRole('menuitem', { name: 'Normal' })
  expect(within(normal).getByText('Normal')).toHaveClass('Lexical__paragraph', 'text-base')
  expect(normal).not.toHaveClass('Lexical__paragraph')

  for (let level = 1; level <= 6; level++) {
    const label = `Heading ${level}`
    const item = screen.getByRole('menuitem', { name: label })
    const preview = within(item).getByText(label)
    // Typography belongs on the label so the menu button's text styles cannot override it.
    expect(preview).toHaveClass(`Lexical__h${level}`, 'mb-0', 'mt-0')
    expect(item).not.toHaveClass(`Lexical__h${level}`)
    if (level >= 4) {
      expect(preview).toHaveClass('color-weak')
    } else {
      expect(preview).not.toHaveClass('color-weak')
    }
  }
})

it.each(['Normal', 'Heading 1', 'Heading 2', 'Heading 3', 'Heading 4', 'Heading 5', 'Heading 6'])(
  'formats the selected block and closes the menu when selecting %s',
  async (label) => {
    const { formatParagraph, formatHeading } = renderMenu()
    fireEvent.click(await screen.findByRole('menuitem', { name: label }))
    if (label === 'Normal') {
      expect(formatParagraph).toHaveBeenCalledTimes(1)
      expect(formatHeading).not.toHaveBeenCalled()
    } else {
      expect(formatHeading).toHaveBeenCalledTimes(1)
      expect(formatHeading).toHaveBeenCalledWith(`h${label.slice(-1)}`)
      expect(formatParagraph).not.toHaveBeenCalled()
    }
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  },
)

it('disables block formatting when the document is not editable', async () => {
  const { formatParagraph, formatHeading } = renderMenu(false)
  await screen.findByRole('menuitem', { name: 'Normal' })
  for (const item of screen.getAllByRole('menuitem')) {
    expect(item).toBeDisabled()
    fireEvent.click(item)
  }
  expect(formatParagraph).not.toHaveBeenCalled()
  expect(formatHeading).not.toHaveBeenCalled()
  expect(screen.getByRole('menu')).toBeVisible()
})
