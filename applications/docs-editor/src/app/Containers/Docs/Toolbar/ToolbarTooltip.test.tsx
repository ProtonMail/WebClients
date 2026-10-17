import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ToolbarTooltip from './ToolbarTooltip'

function renderToolbarTooltip() {
  render(
    <ToolbarTooltip title="Bold" originalPlacement="right">
      <button type="button" aria-label="Bold" />
    </ToolbarTooltip>,
  )
  return screen.getByRole('button', { name: 'Bold' })
}

it('shows the tooltip when the anchor is hovered', async () => {
  const button = renderToolbarTooltip()
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

  fireEvent.mouseEnter(button)
  fireEvent.mouseMove(button)

  expect(await screen.findByRole('tooltip', { name: 'Bold' })).toBeVisible()
})

it('shows the tooltip on keyboard focus, describes the anchor with it and closes on Escape', async () => {
  const button = renderToolbarTooltip()

  act(() => button.focus())

  const tooltip = await screen.findByRole('tooltip', { name: 'Bold' })
  expect(button).toHaveAccessibleDescription('Bold')
  fireEvent.keyDown(button, { key: 'Escape' })
  await waitFor(() => expect(tooltip).not.toBeVisible())
  expect(button).toHaveFocus()
})

it('renders only the anchor when there is no title', () => {
  render(
    <ToolbarTooltip title={undefined}>
      <button type="button">Bold</button>
    </ToolbarTooltip>,
  )

  act(() => screen.getByRole('button', { name: 'Bold' }).focus())

  expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument()
})
