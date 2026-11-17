import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import {
  HomepageHeader,
  type HomepageHeaderComponentProps,
  type HomepageUserDropdownComponentProps,
} from './HomepageHeader'
import { HomepageViewContext, type HomepageViewValue } from './homepageViewContext'
import { SidebarStateProvider } from './sidebarState'

describe('HomepageHeader', () => {
  test('passes the homepage header state and actions to the injected component', async () => {
    let headerProps: HomepageHeaderComponentProps | undefined
    const value = {
      state: { view: 'recents-empty' },
      setSearch: jest.fn(),
      type: undefined,
    } as unknown as HomepageViewValue

    function HeaderComponent(props: HomepageHeaderComponentProps) {
      headerProps = props
      return (
        <>
          {props.userDropdown}
          {props.actionArea}
          <button type="button" onClick={props.onToggleExpand}>
            Toggle sidebar
          </button>
        </>
      )
    }

    function UserDropdownComponent({ app, reportDescriptionContext }: HomepageUserDropdownComponentProps) {
      return (
        <div>
          User dropdown {app} {reportDescriptionContext.join(' ')}
        </div>
      )
    }

    render(
      <MemoryRouter initialEntries={['/recents']}>
        <HomepageViewContext.Provider value={value}>
          <SidebarStateProvider>
            <HomepageHeader
              protonHeader={HeaderComponent}
              userDropdown={UserDropdownComponent}
              reportDescriptionContext={['Report context']}
            />
          </SidebarStateProvider>
        </HomepageViewContext.Provider>
      </MemoryRouter>,
    )

    expect(headerProps).toEqual(
      expect.objectContaining({
        app: 'proton-drive',
        title: 'Docs',
        expanded: false,
      }),
    )
    expect(headerProps?.userDropdown).toBeTruthy()
    expect(screen.getByText('User dropdown proton-docs Report context')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search recents')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }))

    expect(headerProps?.expanded).toBe(true)
  })
})
