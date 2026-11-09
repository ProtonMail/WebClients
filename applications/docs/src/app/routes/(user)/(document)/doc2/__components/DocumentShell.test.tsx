import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

import { DocumentShell } from './DocumentShell'

// The shell's parts need the whole app around them; this test only checks where the header goes
jest.mock(
  '@proton/components/containers/app/PrivateAppContainer',
  () =>
    ({ header, children }: { header: ReactNode; children: ReactNode }) => (
      <>
        <header data-testid="shell-header">{header}</header>
        {children}
      </>
    ),
)
jest.mock(
  '@proton/components/containers/layout/PrivateMainArea',
  () =>
    ({ children }: { children: ReactNode }) =>
      children,
)
jest.mock('@proton/components/containers/topBanners/TopBanners', () => () => null)
jest.mock('@proton/components/components/drawer/DrawerApp', () => () => null)

describe('DocumentShell', () => {
  afterEach(() => {
    delete (window as Window & { Android?: unknown }).Android
  })

  test('shows the header and the content', () => {
    render(<DocumentShell header="Header">Content</DocumentShell>)

    expect(screen.getByTestId('shell-header')).toHaveTextContent('Header')
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  test("shows no header in the native app's webview", () => {
    ;(window as Window & { Android?: unknown }).Android = {}

    render(<DocumentShell header="Header">Content</DocumentShell>)

    expect(screen.getByTestId('shell-header')).toBeEmptyDOMElement()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })
})
