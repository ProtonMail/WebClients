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
  onSearchTextChange: (searchText: string) => void
}

export function HomepageLayout({ children, onSearchTextChange }: HomepageLayoutProps) {
  const { state: expanded, toggle: toggleExpanded } = useToggle()
  return (
    <PrivateAppContainer
      top={
        <>
          <InternalPageNotice />
          <TopBanners app={APPS.PROTONDOCS} />
        </>
      }
      header={
        <Header
          toggleHeaderExpanded={toggleExpanded}
          isHeaderExpanded={expanded}
          onSearchTextChange={onSearchTextChange}
        />
      }
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
  searchBox?: ReactNode
  title?: string
  settingsButton?: ReactNode
  onSearchTextChange: (searchText: string) => void
}

function Header({
  onSearchTextChange,
  isHeaderExpanded,
  toggleHeaderExpanded,
  title = c('Title').t`Docs`,
}: HeaderProps) {
  const { viewportWidth } = useActiveBreakpoint()

  return (
    <div className="homepage-header items-center justify-center">
      <PrivateHeader
        app={APPS.PROTONDRIVE}
        userDropdown={<UserDropdown app={APPS.PROTONDOCS} />}
        title={title}
        expanded={isHeaderExpanded}
        onToggleExpand={toggleHeaderExpanded}
        isSmallViewport={viewportWidth['<=small']}
        actionArea={<Search onSearchTextChange={onSearchTextChange} />}
      />
    </div>
  )
}

// search
// ------

type SearchProps = { onSearchTextChange: (searchText: string) => void }

function Search({ onSearchTextChange }: SearchProps) {
  return (
    <div className="mt-1 max-w-[490px] md:mt-0">
      <Input
        className="bg-weak"
        inputClassName="h-[32px] md:h-auto"
        prefix={
          <span>
            <Icon size={5} color="weak" name="magnifier" alt={c('Action').t`Search`} />
          </span>
        }
        onChange={(e) => onSearchTextChange(e.target.value)}
        placeholder={c('Action').t`Search docs`}
      />
    </div>
  )
}

// sidebar
// -------

const FAVORITES_ENABLED = false
const RECENTLY_DELETED_ENABLED = false

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
          <Icon name="plus" />
          {c('Action').t`New`}
        </ButtonLike>
      }
    >
      <SidebarNav>
        <SidebarList>
          <SidebarListItem>
            <SidebarListItemLink
              to="/recents"
              exact={true}
              className="hover flex items-center gap-2"
              activeClassName="text-bold "
            >
              <Icon name="house" /> {c('Info').t`Recents`}
            </SidebarListItemLink>
          </SidebarListItem>
          {FAVORITES_ENABLED && (
            <SidebarListItem>
              <SidebarListItemLink
                to="/favorites"
                exact={true}
                className="hover flex items-center gap-2"
                activeClassName="text-bold "
              >
                <Icon name="star" /> {c('Info').t`Favorites`}
              </SidebarListItemLink>
            </SidebarListItem>
          )}
          {RECENTLY_DELETED_ENABLED && (
            <SidebarListItem>
              <SidebarListItemLink
                to="/recently-deleted"
                exact={true}
                className="hover flex items-center gap-2"
                activeClassName="text-bold "
              >
                <Icon name="trash" /> {c('Info').t`Recently deleted`}
              </SidebarListItemLink>
            </SidebarListItem>
          )}
          <SidebarListItem>
            <SidebarListItemLink
              to={getAppHref('/', APPS.PROTONDRIVE, getLocalID())}
              className="hover flex items-center gap-2"
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
