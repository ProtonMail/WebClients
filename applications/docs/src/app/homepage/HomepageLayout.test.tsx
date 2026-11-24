import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { HomepageLayout } from './HomepageLayout'

function renderLayout() {
  render(
    <HomepageLayout
      top={<div>Banners</div>}
      sidebar={<nav aria-label="Sidebar">Sidebar</nav>}
      header={<header>Header</header>}
      drawerApp={<aside aria-label="Drawer app">Drawer app</aside>}
    >
      Content
    </HomepageLayout>,
  )
}

describe('HomepageLayout', () => {
  test('places the banners, the sidebar, the header, the content and the drawer app', () => {
    renderLayout()

    expect(screen.getByText('Banners')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Sidebar' })).toBeInTheDocument()
    expect(screen.getByRole('banner')).toHaveTextContent('Header')
    expect(screen.getByRole('main')).toHaveTextContent('Content')
    expect(screen.getByRole('complementary', { name: 'Drawer app' })).toBeInTheDocument()
  })

  test('the skip link comes first and focuses the main area, leaving the URL alone', async () => {
    renderLayout()
    const urlBefore = window.location.href

    await userEvent.tab()
    const skipLink = screen.getByRole('link', { name: 'Skip to main content' })
    expect(skipLink).toHaveFocus()
    await userEvent.click(skipLink)

    expect(screen.getByRole('main')).toHaveFocus()
    expect(window.location.href).toBe(urlBefore)
  })
})
