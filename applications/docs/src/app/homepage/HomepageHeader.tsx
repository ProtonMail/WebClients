import { useMemo, useState, type ReactNode } from 'react'
import { useHistory, useRouteMatch } from 'react-router'
import { useHomepageMessages } from './messages/HomepageMessagesProvider'
import type { HomepageMessages } from './messages/defaultHomepageMessages'

import { Input } from './components/atoms'
import { Icon } from './components/Icon'
import * as Icons from './components/icons'
import { IconButton } from './components/ui'
import { HOMEPAGE_RECENTS_PATH } from './homepage-paths'
import { useHomepageView } from './homepageViewContext'
import { useSidebarState } from './sidebarState'
import type { APPS } from './utils/apps'
import { clsx } from './utils/clsx'
import { useEvent } from './utils/useEvent'
import { useIsNarrow } from './utils/useIsNarrow'
import type { ProtonDocumentType } from './utils/mimetype'

/**
 * Proton's `.header` (packages/styles/scss/layout/_structure.scss) as Docs styles it. Its narrow values are
 * `!important` to beat Proton's utilities of the same names in the Docs app.
 */
const HEADER_CLASS_NAME = clsx(
  'flex h-[3.75rem] shrink-0 flex-nowrap items-center px-0 py-3 [contain:content]',
  'narrow:!h-[2.75rem] narrow:!py-1 narrow:!pe-2 narrow:!ps-3 narrow:![contain:none]',
)

export type HomepageHeaderActionsComponentProps = {
  /** Whether the viewport is narrow, where Proton's `PrivateHeader` hides some of its actions. */
  isNarrow: boolean
}

export type HomepageUserDropdownComponentProps = {
  app: (typeof APPS)[keyof typeof APPS]
  reportDescriptionContext: string[]
  /** Set in the sidebar's drawer, which hides the apps dropdown, as Proton's `Sidebar` does: lists the apps. */
  hasAppLinks?: boolean
}

export type HomepageHeaderProps = {
  /**
   * The end of the header: the host's actions, such as its upgrade button and user dropdown. Rendered as a component,
   * so keep it the same across renders.
   */
  headerActions: (props: HomepageHeaderActionsComponentProps) => ReactNode
}

export function HomepageHeader({ headerActions: HeaderActions }: HomepageHeaderProps) {
  const { expanded, toggleExpanded } = useSidebarState()
  const isNarrow = useIsNarrow()
  const { state, type, setSearch } = useHomepageView()
  // Every search view has the query, also while the recents load: the field must keep what's typed meanwhile.
  const searchValue = 'query' in state ? state.query : undefined
  const messages = useHomepageMessages().header

  return (
    // `homepage-header` is for the Docs app's stylesheets, which style the host's widgets in it.
    <div className="homepage-header shrink-0 items-center justify-center small:pe-[.625rem]">
      <header className={HEADER_CLASS_NAME}>
        {/* Proton's `Hamburger`: opens the sidebar's drawer, on narrow viewports only. */}
        <IconButton
          label={expanded ? messages.closeNavigation : messages.openNavigation}
          shape="ghost"
          aria-expanded={expanded ? undefined : false}
          className="me-[.1em] hidden shrink-0 narrow:!block print:!hidden"
          onClick={toggleExpanded}
        >
          <Icon data={expanded ? Icons.cross : Icons.hamburger} />
        </IconButton>
        <div className="flex flex-1 items-center">
          <MobileSearch
            className="small:!hidden"
            value={searchValue}
            onChange={(value) => setSearch(value, false)}
            type={type}
          />
          <Search
            className="!hidden ps-1 small:!flex"
            value={searchValue}
            onChange={(value) => setSearch(value, false)}
            type={type}
          />
        </div>
        <HeaderActions isNarrow={isNarrow} />
      </header>
    </div>
  )
}

function searchPlaceholder(type: ProtonDocumentType | undefined, messages: HomepageMessages['header']) {
  switch (type) {
    case 'document':
      return messages.searchRecentDocuments
    case 'spreadsheet':
      return messages.searchRecentSpreadsheets
    default:
      return messages.searchRecents
  }
}

type SearchProps = {
  value: string | undefined
  onChange: (value: string | undefined) => void
  type: ProtonDocumentType | undefined
  className?: string
}

function Search({ value, onChange, type, className }: SearchProps) {
  const isRecentsRoute = useRouteMatch(HOMEPAGE_RECENTS_PATH)
  const history = useHistory()
  const handleChange = useEvent((value: string | undefined) => {
    // Ensure that the user is redirected to the recents page when searching.
    if (value && value.length > 0 && !isRecentsRoute) {
      history.push('/recents')
    }
    onChange(value)
  })
  const messages = useHomepageMessages().header
  const placeholder = useMemo(() => searchPlaceholder(type, messages), [type, messages])
  return (
    <div className={className}>
      <Input
        className="w-[clamp(21.25rem,100vw*.35-1.25rem,32.5rem)] border-[--border-weak] focus-within:!border-[#bcb9b6] hover:!border-[#bcb9b6] [[data-theme-mode=dark]_&]:!border-[--background-weak] [[data-theme-mode=dark]_&]:!bg-[--background-weak] [[data-theme-mode=dark]_&]:focus-within:!border-[--border-norm] [[data-theme-mode=dark]_&]:hover:!border-[--border-norm]"
        inputClassName="h-[32px] small:h-auto"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onChange(undefined)
          }
        }}
        prefix={
          <span>
            <Icon data={Icons.magnifier} size={5} alt={messages.search} />
          </span>
        }
        value={value ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

function MobileSearch({ value, onChange, type, className }: SearchProps) {
  const isRecentsRoute = useRouteMatch(HOMEPAGE_RECENTS_PATH)
  const history = useHistory()
  const handleChange = useEvent((value: string | undefined) => {
    // Ensure that the user is redirected to the recents page when searching.
    if (value && value.length > 0 && !isRecentsRoute) {
      history.push('/recents')
    }
    onChange(value)
  })
  const [isActive, setActive] = useState(false)
  const isInput = (value && value.length > 0) || isActive
  const messages = useHomepageMessages().header
  const placeholder = useMemo(() => searchPlaceholder(type, messages), [type, messages])
  return (
    <div className={clsx('flex grow items-center gap-2', className)}>
      {isInput ? (
        <Input
          ref={(element) => {
            if (isActive) {
              element?.focus()
            }
          }}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onChange(undefined)
            }
          }}
          className="w-full max-w-[21.25rem] border-[--border-weak] focus-within:!border-[#bcb9b6] hover:!border-[#bcb9b6] [[data-theme-mode=dark]_&]:!border-[--background-weak] [[data-theme-mode=dark]_&]:!bg-[--background-weak] [[data-theme-mode=dark]_&]:focus-within:!border-[--border-norm] [[data-theme-mode=dark]_&]:hover:!border-[--border-norm]"
          inputClassName="h-[32px] small:h-auto"
          prefix={
            <span>
              <Icon data={Icons.magnifier} size={5} alt={messages.search} />
            </span>
          }
          value={value ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <>
          <div className="grow font-[.875rem] font-semibold">{isRecentsRoute ? messages.recents : messages.trash}</div>
          <IconButton label={placeholder} shape="outline" onClick={() => setActive(true)}>
            <Icon data={Icons.magnifier} />
          </IconButton>
        </>
      )}
    </div>
  )
}
