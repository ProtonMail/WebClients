import { type ReactNode } from 'react'

import {
  AppsDropdown,
  DrawerApp,
  Icon,
  Logo,
  PrivateAppContainer,
  PrivateHeader,
  PrivateMainArea,
  Sidebar as ProtonSidebar,
  SidebarList,
  SidebarListItem,
  SidebarListItemLink,
  SidebarNav,
  TopBanners,
  useActiveBreakpoint,
  useAuthentication,
  UserDropdown,
  useToggle,
} from '@proton/components'
import { APPS, DRIVE_APP_NAME } from '@proton/shared/lib/constants'

import { DocsQuickSettings } from '~/components/DocsQuickSettings'
import type { DocumentAction } from '@proton/drive-store'
import { c } from 'ttag'
import { ButtonLike, Input } from '@proton/atoms'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import './HomepageLayout.css'
import { useHomepageView } from '../__utils/homepage-view'
import { useHistory, useRouteMatch } from 'react-router'
import { HOMEPAGE_RECENTS_PATH } from '../../../__components/AppContainer'
import { useEvent } from '~/utils/misc'

// layout
// ------

function InternalPageNotice() {
  return (
    <div aria-hidden className="bg-[red]/80 p-2 text-center text-[white]">
      <p className="m-0">
        This page is <b>internal</b>. It's a work in progress - expect missing, incomplete and broken features.
      </p>
    </div>
  )
}

export type HomepageLayoutProps = {
  children: ReactNode
  action?: DocumentAction['mode']
}

export function HomepageLayout({ children }: HomepageLayoutProps) {
  const { state: expanded, toggle: toggleExpanded } = useToggle()
  return (
    <PrivateAppContainer
      top={
        <>
          <InternalPageNotice />
          <TopBanners app={APPS.PROTONDOCS} />
        </>
      }
      header={<Header toggleHeaderExpanded={toggleExpanded} isHeaderExpanded={expanded} />}
      sidebar={<Sidebar expanded={expanded} onToggle={toggleExpanded} />}
      drawerApp={<DrawerApp customAppSettings={<DocsQuickSettings />} />}
    >
      <PrivateMainArea hasToolbar>{children}</PrivateMainArea>
    </PrivateAppContainer>
  )
}

// header
// ------

type HeaderProps = {
  isHeaderExpanded: boolean
  toggleHeaderExpanded: () => void
}

function Header({ isHeaderExpanded, toggleHeaderExpanded }: HeaderProps) {
  const { viewportWidth } = useActiveBreakpoint()
  const { state, setSearch } = useHomepageView()
  const searchValue = state.view === 'search' || state.view === 'search-empty' ? state.query : undefined

  return (
    <div className="homepage-header shrink-0 items-center justify-center">
      <PrivateHeader
        app={APPS.PROTONDRIVE}
        userDropdown={<UserDropdown app={APPS.PROTONDOCS} />}
        title={c('Title').t`Docs`}
        expanded={isHeaderExpanded}
        onToggleExpand={toggleHeaderExpanded}
        isSmallViewport={viewportWidth['<=small']}
        actionArea={<Search value={searchValue} onChange={setSearch} />}
      />
    </div>
  )
}

// search
// ------

type SearchProps = { value: string | undefined; onChange: (value: string | undefined) => void }

function Search({ value, onChange }: SearchProps) {
  const isRecentsRoute = useRouteMatch(HOMEPAGE_RECENTS_PATH)
  const history = useHistory()
  const handleChange = useEvent((value: string | undefined) => {
    // Ensure that the user is redirected to the recents page when searching.
    if (value && value.length > 0 && !isRecentsRoute) {
      history.replace('/recents')
    }
    onChange(value)
  })
  return (
    <div className="mt-1 max-w-[490px] md:mt-0">
      <Input
        inputClassName="h-[32px] md:h-auto"
        prefix={
          <span>
            <Icon size={5} color="weak" name="magnifier" alt={c('Action').t`Search`} />
          </span>
        }
        value={value ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={c('Action').t`Search recent documents`}
      />
    </div>
  )
}

// sidebar
// -------

const FAVORITES_ENABLED = false

type SidebarProps = { expanded: boolean; onToggle: () => void }

function Sidebar({ expanded, onToggle }: SidebarProps) {
  const { getLocalID } = useAuthentication()
  return (
    <ProtonSidebar
      className="ui-standard"
      expanded={expanded}
      onToggleExpand={onToggle}
      app="proton-docs"
      appsDropdown={<AppsDropdown app={APPS.PROTONDOCS} />}
      logo={<Logo appName={APPS.PROTONDOCS} />}
      primary={
        <ButtonLike
          as="a"
          href={getAppHref('/doc', APPS.PROTONDOCS, getLocalID())}
          target="_blank"
          color="norm"
          size="large"
          shape="solid"
          className="flex items-center justify-center gap-2 !bg-[--docs-blue-color]"
        >
          {c('Action').t`New document`}
        </ButtonLike>
      }
    >
      <SidebarNav>
        <SidebarList>
          <SidebarListItem>
            <SidebarListItemLink
              to="/recents"
              exact={true}
              className="flex items-center gap-2"
              activeClassName="!font-semibold"
            >
              <Icon name="house" /> {c('Info').t`Recents`}
            </SidebarListItemLink>
          </SidebarListItem>
          {FAVORITES_ENABLED && (
            <SidebarListItem>
              <SidebarListItemLink
                to="/favorites"
                exact={true}
                className="flex items-center gap-2"
                activeClassName="!font-semibold"
              >
                <Icon name="star" /> {c('Info').t`Favorites`}
              </SidebarListItemLink>
            </SidebarListItem>
          )}
          <SidebarListItem>
            <SidebarListItemLink
              to="/trashed"
              exact={true}
              className="flex items-center gap-2"
              activeClassName="!font-semibold"
            >
              <Icon name="trash" /> {c('Info').t`Trashed`}
            </SidebarListItemLink>
          </SidebarListItem>

          <SidebarListItem>
            <SidebarListItemLink
              to={getAppHref('/', APPS.PROTONDRIVE, getLocalID())}
              className="flex items-center gap-2"
              target="_blank"
            >
              <Icon name="brand-proton-drive" /> {c('Info').t`Go to ${DRIVE_APP_NAME}`}
            </SidebarListItemLink>
          </SidebarListItem>
        </SidebarList>
      </SidebarNav>
    </ProtonSidebar>
  )
}
