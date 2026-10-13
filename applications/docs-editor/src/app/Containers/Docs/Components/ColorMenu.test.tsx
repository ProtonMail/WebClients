import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SimpleDropdown } from './Dropdown'
import { FontColorMenu } from './ColorMenu'

function renderColorMenu() {
  const onTextColorChange = jest.fn()
  const onBackgroundColorChange = jest.fn()
  const onMarkerColorChange = jest.fn()

  render(
    <SimpleDropdown content="Color">
      <FontColorMenu
        currentTextColor="#111111"
        currentBackgroundColor="#eeeeee"
        onTextColorChange={onTextColorChange}
        onBackgroundColorChange={onBackgroundColorChange}
        onMarkerColorChange={onMarkerColorChange}
      />
    </SimpleDropdown>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Color' }))
  return { onTextColorChange, onBackgroundColorChange, onMarkerColorChange }
}

it('previews each accessible color option and restores the current colors on pointer leave', async () => {
  renderColorMenu()
  const preview = await screen.findByText('Text and highlight color')
  const color = screen.getByRole('menuitem', { name: 'black background color and white text color' })

  await act(async () => {
    fireEvent.pointerEnter(color)
  })
  expect(preview).toHaveStyle({ backgroundColor: color.style.backgroundColor, color: color.style.color })

  await act(async () => {
    fireEvent.pointerLeave(color)
  })
  expect(preview).toHaveStyle({ backgroundColor: '#eeeeee', color: '#111111' })
  fireEvent.click(screen.getByRole('button', { name: 'Color' }))
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
})

it('applies and clears text, background, and marker colors together', async () => {
  const { onTextColorChange, onBackgroundColorChange, onMarkerColorChange } = renderColorMenu()
  const color = await screen.findByRole('menuitem', { name: 'black text color with no background' })

  fireEvent.click(color)
  expect(onBackgroundColorChange).toHaveBeenCalledWith(null)
  expect(onTextColorChange).toHaveBeenCalledWith(expect.any(String))
  expect(onMarkerColorChange).toHaveBeenCalledWith(onTextColorChange.mock.calls[0][0])

  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: 'Color' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Clear' }))
  expect(onBackgroundColorChange).toHaveBeenLastCalledWith(null)
  expect(onTextColorChange).toHaveBeenLastCalledWith(null)
  expect(onMarkerColorChange).toHaveBeenLastCalledWith(null)
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
})
