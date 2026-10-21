import type { PropsWithChildren } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { DocsDependenciesProvider, type DocsDependencies } from '../DocsDependenciesProvider'
import type { DocsMessages } from '../messages/DocsMessages'
import { defaultDocsMessages } from '../messages/defaultDocsMessages'
import { SimpleDropdown } from './Dropdown'
import { FontColorMenu } from './ColorMenu'

function renderColorMenu({
  currentTextColor = '#111111',
  currentBackgroundColor = '#eeeeee',
  messages = defaultDocsMessages,
}: { currentTextColor?: string | null; currentBackgroundColor?: string | null; messages?: DocsMessages } = {}) {
  const onTextColorChange = jest.fn()
  const onBackgroundColorChange = jest.fn()
  const onMarkerColorChange = jest.fn()

  render(
    <SimpleDropdown content="Color">
      <FontColorMenu
        currentTextColor={currentTextColor}
        currentBackgroundColor={currentBackgroundColor}
        onTextColorChange={onTextColorChange}
        onBackgroundColorChange={onBackgroundColorChange}
        onMarkerColorChange={onMarkerColorChange}
      />
    </SimpleDropdown>,
    {
      wrapper: ({ children }: PropsWithChildren) => (
        <DocsDependenciesProvider dependencies={{ messages } as DocsDependencies}>{children}</DocsDependenciesProvider>
      ),
    },
  )

  fireEvent.click(screen.getByRole('button', { name: 'Color' }))
  return { onTextColorChange, onBackgroundColorChange, onMarkerColorChange }
}

it('previews each accessible color option and restores the current colors on pointer leave', async () => {
  renderColorMenu()
  const preview = await screen.findByText('Text and highlight color')
  const color = screen.getByRole('menuitemradio', { name: 'black background color and white text color' })

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
  const color = await screen.findByRole('menuitemradio', { name: 'black text color with no background' })

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

it('marks only the swatch matching the current colors as checked', async () => {
  renderColorMenu({ currentTextColor: 'rgb(86, 86, 246)', currentBackgroundColor: 'rgba(128, 128, 255, 0.15)' })

  const checked = await screen.findAllByRole('menuitemradio', { checked: true })
  expect(checked).toHaveLength(1)
  expect(checked[0]).toHaveAccessibleName('purple text color and highlight')
})

it.each([
  { currentTextColor: '#8080FF', currentBackgroundColor: null, swatch: 'purple text color with no background' },
  { currentTextColor: '#8080FF', currentBackgroundColor: '', swatch: 'purple text color with no background' },
  {
    currentTextColor: 'rgb(255, 255, 255)',
    currentBackgroundColor: '#8080ff',
    swatch: 'purple background color and white text color',
  },
])(
  'checks "$swatch" for text $currentTextColor and background "$currentBackgroundColor"',
  async ({ currentTextColor, currentBackgroundColor, swatch }) => {
    renderColorMenu({ currentTextColor, currentBackgroundColor })

    const checked = await screen.findAllByRole('menuitemradio', { checked: true })
    expect(checked).toHaveLength(1)
    expect(checked[0]).toHaveAccessibleName(swatch)
  },
)

it('names each swatch with the color name the host translates', async () => {
  renderColorMenu({
    messages: {
      ...defaultDocsMessages,
      colorMenu: {
        ...defaultDocsMessages.colorMenu,
        colorNames: { ...defaultDocsMessages.colorMenu.colorNames, purple: 'violet' },
      },
    },
  })

  expect(await screen.findByRole('menuitemradio', { name: 'violet text color with no background' })).toBeVisible()
})
