import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { DocumentShell } from './DocumentShell'

// The shell's parts need the whole app around them; this test only checks where the header goes
vi.mock('@proton/components/containers/app/PrivateAppContainer', () => ({
  default: ({ header, children }: { header: ReactNode; children: ReactNode }) => (
    <>
      <header data-testid="shell-header">{header}</header>
      {children}
    </>
  ),
}))
vi.mock('@proton/components/containers/layout/PrivateMainArea', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@proton/components/containers/topBanners/TopBanners', () => ({ default: () => null }))
vi.mock('@proton/components/components/drawer/DrawerApp', () => ({ default: () => null }))

describe('DocumentShell', () => {
  afterEach(() => {
    delete (window as Window & { Android?: unknown }).Android
  })

  test('shows the header and the content', () => {
    render(<DocumentShell header="Header">Content</DocumentShell>)

    expect(screen.getByTestId('shell-header')).toHaveTextContent('Header')
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  test('under a loading screen, keeps the page laid out but busy and inert, and neither once it lifts', () => {
    const { rerender } = render(
      <DocumentShell header="Header" loadingScreen={<div data-testid="loading-screen" />}>
        Content
      </DocumentShell>,
    )
    const page = screen.getByTestId('shell-header').parentElement!

    expect(screen.getByTestId('loading-screen')).toBeInTheDocument()
    expect(page).not.toContainElement(screen.getByTestId('loading-screen'))
    expect(page).toHaveAttribute('aria-busy', 'true')
    expect(page).toHaveAttribute('inert')
    expect(screen.getByTestId('shell-header')).toBeVisible()
    expect(screen.getByText('Content')).toBeVisible()

    rerender(<DocumentShell header="Header">Content</DocumentShell>)

    expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument()
    expect(screen.getByTestId('shell-header').parentElement).toBe(page)
    expect(page).not.toHaveAttribute('aria-busy')
    expect(page).not.toHaveAttribute('inert')
  })

  // As ModalTwo does: it portals to document.body, where the inert page doesn't reach and the screen sits under it
  test('leaves a modal the page portals to the body outside the inert page', () => {
    render(
      <DocumentShell header="Header" loadingScreen={<div data-testid="loading-screen" />}>
        {createPortal(<button>Restore</button>, document.body)}
      </DocumentShell>,
    )

    expect(screen.getByRole('button', { name: 'Restore' }).closest('[inert]')).toBeNull()
    expect(screen.getByTestId('shell-header').closest('[inert]')).not.toBeNull()
  })

  test("shows no header in the native app's webview", () => {
    ;(window as Window & { Android?: unknown }).Android = {}

    render(<DocumentShell header="Header">Content</DocumentShell>)

    expect(screen.getByTestId('shell-header')).toBeEmptyDOMElement()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })
})
