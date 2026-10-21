import { fireEvent, render, screen } from '@testing-library/react'
import { DocsLayoutContainer, DocsLayoutGrid, DocsLayoutLeftPanel, useLeftPanelContext } from './DocsLayout'

function ExpandButton() {
  const { setVisibility } = useLeftPanelContext()
  return <button onClick={() => setVisibility('expanded')}>Expand</button>
}

function renderExpandedLeftPanel() {
  render(
    <DocsLayoutContainer isSuggestionMode={false}>
      <DocsLayoutGrid leftPanelEnabled>
        <DocsLayoutLeftPanel>
          <ExpandButton />
        </DocsLayoutLeftPanel>
      </DocsLayoutGrid>
    </DocsLayoutContainer>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Expand' }))
  return screen.getByRole('separator')
}

describe('DocsLayoutLeftPanel resize handle', () => {
  beforeEach(() => {
    window.innerWidth = 1280
  })

  it('exposes the panel width as a focusable vertical separator', () => {
    const separator = renderExpandedLeftPanel()

    expect(separator).toHaveAttribute('aria-orientation', 'vertical')
    expect(separator).toHaveAttribute('aria-valuenow', '300')
    expect(separator).toHaveAttribute('aria-valuemin', '200')
    expect(separator).toHaveAttribute('aria-valuemax', '480')
    expect(separator).toHaveAttribute('tabindex', '0')
  })

  it('names the separator after the outline it resizes', () => {
    const separator = renderExpandedLeftPanel()

    expect(separator).toHaveAccessibleName('Resize outline')
  })

  it('resizes the panel with the arrow keys', () => {
    const separator = renderExpandedLeftPanel()

    fireEvent.keyDown(separator, { key: 'ArrowRight' })
    expect(separator).toHaveAttribute('aria-valuenow', '310')

    fireEvent.keyDown(separator, { key: 'ArrowLeft' })
    fireEvent.keyDown(separator, { key: 'ArrowLeft' })
    expect(separator).toHaveAttribute('aria-valuenow', '290')
  })

  it('keeps keyboard resizing within the panel bounds', () => {
    const separator = renderExpandedLeftPanel()

    for (let i = 0; i < 30; i++) {
      fireEvent.keyDown(separator, { key: 'ArrowRight' })
    }
    expect(separator).toHaveAttribute('aria-valuenow', '480')
  })
})
