import { useRef, type ComponentProps, type ReactNode } from 'react'
import { useHomepageMessages } from './messages/HomepageMessagesProvider'
import * as Ariakit from '@ariakit/react'

import { Icon } from './components/Icon'
import * as Icons from './components/icons'
import {
  SIDEBAR_LINK_CLASS_NAME,
  SidebarList,
  SidebarListItem,
  SidebarListItemDiv,
  SidebarNav,
  SidebarStorage,
} from './components/sidebar'
import { IconButton } from './components/ui'
import { useHomepageRoute, type HomepageRoute } from './homepageNavigation'
import type { HomepageUserDropdownComponentProps } from './HomepageHeader'
import { useHomepageView } from './homepageViewContext'
import { COLOR_BY_TYPE } from './HomepageContent/shared'
import { NewDocumentMenu } from './HomepageContent/NewDocumentMenu'
import { useSidebarState } from './sidebarState'
import { useReloadRecents } from './useReloadRecents'
import { APPS, DOCS_APP_NAME, DRIVE_APP_NAME } from './utils/apps'
import { clsx } from './utils/clsx'
import { TelemetryEvent } from './utils/telemetry'
import { useDrawerFocusTrap } from './utils/useDrawerFocusTrap'
import { useIsNarrow } from './utils/useIsNarrow'

/**
 * Proton's `.sidebar` (packages/styles/scss/layout/_structure.scss) as Docs styles it: a column beside the content,
 * which becomes a drawer on narrow viewports, slid out of view and hidden while closed.
 */
const SIDEBAR_CLASS_NAME = clsx(
  'relative flex w-[15.625rem] shrink-0 flex-col flex-nowrap overflow-auto outline-none [contain:content] print:!hidden',
  '-me-1 bg-[--homepage-background] text-[--text-norm] [[data-theme-mode=dark]_&]:bg-[--background-norm]',
  'narrow:!fixed narrow:inset-0 narrow:z-[800] narrow:w-full narrow:max-w-[17rem] narrow:pt-3',
  'narrow:[transition:visibility_0s_ease,transform_0.25s_ease]',
  'narrow:data-[expanded=false]:invisible narrow:data-[expanded=false]:-translate-x-full narrow:data-[expanded=false]:[transition-delay:0.25s,0s]',
  'rtl:narrow:data-[expanded=false]:translate-x-full',
)

// The `.logo-container` of Proton's `Sidebar`, whose logo is a link that takes the free width.
const LOGO_ROW_CLASS_NAME = clsx(
  'flex h-[3.75rem] shrink-0 flex-nowrap items-center justify-between gap-0.5 px-4 narrow:!hidden',
  '[&>a]:flex [&>a]:flex-auto [&>a]:self-center [&>a::after]:[border-radius:var(--border-radius-md)]',
)

export type HomepageAppsDropdownComponentProps = {
  app: (typeof APPS)[keyof typeof APPS]
}

export type HomepageLogoComponentProps = {
  appName: (typeof APPS)[keyof typeof APPS]
}

export type HomepageSidebarProps = {
  appsDropdown: (props: HomepageAppsDropdownComponentProps) => ReactNode
  logo: (props: HomepageLogoComponentProps) => ReactNode
  /** Shown in the sidebar on narrow viewports, as Proton's `Sidebar` does: the header shows it on wider ones. */
  userDropdown: (props: HomepageUserDropdownComponentProps) => ReactNode
  reportDescriptionContext: string[]
}

export function HomepageSidebar({
  appsDropdown: AppsDropdown,
  logo: Logo,
  userDropdown: UserDropdown,
  reportDescriptionContext,
}: HomepageSidebarProps) {
  const { expanded, toggleExpanded, setExpanded } = useSidebarState()
  const isNarrow = useIsNarrow()
  const { route, navigate } = useHomepageRoute()
  const isRecents = route.view === 'recents'
  const { isRecentsUpdating, type, reportTelemetry, getAppHref, storage, appVersion } = useHomepageView()
  const messages = useHomepageMessages().sidebar
  const reloadRecents = useReloadRecents()
  const rootRef = useRef<HTMLDivElement>(null)
  // Only a drawer traps the focus: on wide viewports, the sidebar stays open whatever `expanded` says.
  const isDrawerOpen = expanded && isNarrow
  useDrawerFocusTrap(rootRef, isDrawerOpen)

  const newDocumentButton = (
    <Ariakit.MenuProvider>
      <Ariakit.MenuButton className="flex w-full items-center justify-center gap-2 rounded-[0.5rem] !bg-[--docs-blue-color] px-4 py-2.5 text-[#fff]">
        <Icon data={Icons.plus} />
        {messages.new}
      </Ariakit.MenuButton>
      <NewDocumentMenu sameWidth />
    </Ariakit.MenuProvider>
  )

  return (
    <>
      <div
        ref={rootRef}
        data-expanded={expanded}
        tabIndex={isDrawerOpen ? -1 : undefined}
        className={SIDEBAR_CLASS_NAME}
      >
        {/* As the `Hamburger` of Proton's `Sidebar`, visible only while focused. `opacity-0` also turns pointer events
            off (Proton's, or the shim in HomepageStyleScope.css): focused, it takes them back, as Proton's
            `focus:opacity-100` does. */}
        <IconButton
          label={messages.closeNavigation}
          shape="ghost"
          className="absolute end-0 me-5 mt-2 hidden shrink-0 bg-[--background-norm] opacity-0 focus:pointer-events-auto focus:opacity-100 narrow:!inline-flex"
          onClick={toggleExpanded}
        >
          <Icon data={Icons.cross} />
        </IconButton>

        <h1 className="sr-only">{DOCS_APP_NAME}</h1>

        <div className={LOGO_ROW_CLASS_NAME}>
          <Logo appName={APPS.PROTONDOCS} />
          <div className="h-9 w-9 shrink-0 grow-0">
            <AppsDropdown app={APPS.PROTONDOCS} />
          </div>
        </div>

        {isNarrow && (
          <div className="shrink-0 px-3">
            <UserDropdown app={APPS.PROTONDOCS} reportDescriptionContext={reportDescriptionContext} hasAppLinks />
          </div>
        )}

        <div className="shrink-0 px-3 pb-2 narrow:hidden">{newDocumentButton}</div>
        <div className="narrow:mt-1" aria-hidden="true" />
        <div className="mt-2 flex flex-1 flex-col flex-nowrap overflow-auto pb-2 narrow:!mt-0" tabIndex={-1}>
          <div className="hidden px-3 pb-3 pt-2 narrow:!block">{newDocumentButton}</div>
          <SidebarNav>
            <div className="flex items-center justify-between px-3 py-2">
              <div className="px-3 !text-[.75rem]/4 text-[--text-hint] [[data-theme-mode=dark]_&]:!text-[--text-weak]">
                {messages.recents}
              </div>
              <IconButton
                label={messages.updateRecentDocuments}
                size="small"
                shape="ghost"
                className="-mr-1"
                disabled={isRecentsUpdating}
                onClick={async (e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  if (!isRecents) {
                    navigate({ view: 'recents', params: {} })
                  }
                  await reloadRecents()
                  setExpanded(false)
                }}
              >
                <Icon
                  data={Icons.arrowRotateRight}
                  data-updating={isRecentsUpdating ? '' : undefined}
                  className="data-[updating]:animate-spin"
                />
              </IconButton>
            </div>
            <SidebarList>
              <SidebarListItem onClick={() => setExpanded(false)}>
                <SidebarLink
                  to={{ view: 'recents', params: { ...route.params, type: undefined } }}
                  isActive={isRecents && !type}
                  data-updating={isRecentsUpdating ? '' : undefined}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Icon data={Icons.house} />
                    <span>{messages.all}</span>
                  </span>
                </SidebarLink>
              </SidebarListItem>
              <SidebarListItem onClick={() => setExpanded(false)}>
                <SidebarLink
                  to={{ view: 'recents', params: { ...route.params, type: 'document' } }}
                  isActive={isRecents && type === 'document'}
                  data-updating={isRecentsUpdating ? '' : undefined}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Icon
                      data={Icons.brandProtonDocs}
                      className="shrink-0 text-[--icon-color]"
                      style={{ '--icon-color': COLOR_BY_TYPE.document }}
                    />
                    <span>{messages.documents}</span>
                  </span>
                </SidebarLink>
              </SidebarListItem>
              <SidebarListItem onClick={() => setExpanded(false)}>
                <SidebarLink
                  to={{ view: 'recents', params: { ...route.params, type: 'spreadsheet' } }}
                  isActive={isRecents && type === 'spreadsheet'}
                  data-updating={isRecentsUpdating ? '' : undefined}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Icon
                      data={Icons.brandProtonSheets}
                      className="shrink-0 text-[--icon-color]"
                      style={{ '--icon-color': COLOR_BY_TYPE.spreadsheet }}
                    />
                    <span>{messages.spreadsheets}</span>
                  </span>
                </SidebarLink>
              </SidebarListItem>
              <li className="px-6">
                <hr className="my-3 h-px border-0 bg-[--border-weak] [[data-theme-mode=dark]_&]:!bg-[--border-norm]" />
              </li>

              <SidebarListItem onClick={() => setExpanded(false)}>
                <SidebarLink to={{ view: 'trash', params: {} }} isActive={route.view === 'trash'}>
                  <span className="flex items-center gap-2">
                    <Icon data={Icons.trash} />
                    <span>{messages.trash}</span>
                  </span>
                </SidebarLink>
              </SidebarListItem>

              <SidebarListItem onClick={() => setExpanded(false)}>
                <a
                  className="!text-[var(--sidebar-text-color,var(--text-norm))] no-underline"
                  href={getAppHref('/', APPS.PROTONDRIVE)}
                  target="_blank"
                  onClick={() => {
                    reportTelemetry(TelemetryEvent.drive_opened)
                  }}
                >
                  <SidebarListItemDiv className="flex items-center gap-2">
                    <Icon data={Icons.brandProtonDrive} /> {messages.goTo(DRIVE_APP_NAME)}
                  </SidebarListItemDiv>
                </a>
              </SidebarListItem>
            </SidebarList>
          </SidebarNav>
        </div>

        {storage && storage.maxSpace > 0 && <SidebarStorage storage={storage} appVersion={appVersion} />}
      </div>
      {/* Proton's `.sidebar-backdrop`, shown only under the drawer. */}
      {expanded && (
        // A pointer shortcut, as Proton's: keyboards close the drawer with its close button.
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
          className="fixed inset-0 z-[799] hidden bg-[--homepage-drawer-backdrop] narrow:!block"
          onClick={toggleExpanded}
        />
      )}
    </>
  )
}

type SidebarLinkProps = Omit<ComponentProps<'a'>, 'href'> & { to: HomepageRoute; isActive: boolean }

/** A link to a homepage route, which a plain click follows in this page. Others, such as a middle click, open its address. */
function SidebarLink({ to, isActive, className, children, ...props }: SidebarLinkProps) {
  const { route, getHref, navigate } = useHomepageRoute()
  return (
    <a
      {...props}
      href={getHref(to)}
      aria-current={isActive ? 'page' : undefined}
      className={clsx(SIDEBAR_LINK_CLASS_NAME, className, isActive && '!font-semibold')}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.altKey ||
          event.ctrlKey ||
          event.shiftKey
        ) {
          return
        }
        event.preventDefault()
        // As the React Router links it replaces: a new history entry, so Back returns to the previous filter or view,
        // unless it's the current address, whose entry it replaces. Sort and search replace theirs instead.
        navigate(to, { replace: getHref(to) === getHref(route) })
      }}
    >
      {children}
    </a>
  )
}
