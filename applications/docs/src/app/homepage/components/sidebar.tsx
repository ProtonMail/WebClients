import * as Ariakit from '@ariakit/react'
import type { HTMLAttributes, LiHTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'
import { useHomepageMessages } from '../messages/HomepageMessagesProvider'
import { useHomepageView } from '../homepageViewContext'
import { copyToClipboard, type HomepageAppVersion } from '../utils/appVersion'
import { DOCS_APP_NAME } from '../utils/apps'
import { clsx } from '../utils/clsx'
import {
  formatStorageSize,
  getStorageLevel,
  getStoragePercentage,
  type HomepageStorage,
  type StorageLevel,
} from '../utils/storage'
import { Tooltip, TooltipProvider } from './ui'

// Proton's `.sidebar-meter-storage` thumb, and `color-*` of the used space, whose success colour Proton unsets.
const METER_THUMB_CLASS_NAME: Record<StorageLevel, string> = {
  success: 'bg-[--text-weak]',
  warning: 'bg-[--signal-warning]',
  danger: 'bg-[--signal-danger]',
}
const USED_SPACE_CLASS_NAME: Record<StorageLevel, string> = {
  success: '',
  warning: 'text-[--signal-warning]',
  danger: 'text-[--signal-danger]',
}

interface SidebarAppVersionProps {
  appVersion: HomepageAppVersion
}

/**
 * Proton's `AppVersion` (packages/components/components/version/AppVersion.tsx), as its `Storage` shows it, with the
 * app name for screen readers only: a button that copies the full version.
 */
function SidebarAppVersion({ appVersion: { version, fullVersion, earlyAccessMark } }: SidebarAppVersionProps) {
  const messages = useHomepageMessages().storage
  const { createNotification } = useHomepageView()
  const withMark = (value: string) => (earlyAccessMark ? `${value} ${earlyAccessMark}` : value)

  return (
    <TooltipProvider>
      <Ariakit.TooltipAnchor
        render={
          <button
            type="button"
            className="m-0 cursor-pointer border-0 bg-transparent p-0 text-xs leading-4 text-[--text-weak] hover:text-[--text-norm] focus:text-[--text-norm]"
            onClick={() => {
              copyToClipboard(fullVersion)
              createNotification({ text: messages.versionCopied })
            }}
          >
            <span className="sr-only">{DOCS_APP_NAME} </span>
            <span>{withMark(version)}</span>
          </button>
        }
      />
      <Tooltip>{messages.copyVersion(withMark(fullVersion))}</Tooltip>
    </TooltipProvider>
  )
}

export interface SidebarStorageProps {
  storage: HomepageStorage
  appVersion: HomepageAppVersion | undefined
}

/** Mirrors the `Storage` of Proton's `Sidebar` (packages/components/components/sidebar/Sidebar.tsx) in text and classes. */
export function SidebarStorage({ storage, appVersion }: SidebarStorageProps) {
  const messages = useHomepageMessages().storage
  const percentage = getStoragePercentage(storage)
  const level = getStorageLevel(percentage)
  const usedSpace = formatStorageSize(storage.usedSpace, messages)
  const maxSpace = formatStorageSize(storage.maxSpace, messages)
  const text = (
    <>
      <span className={clsx('font-bold', USED_SPACE_CLASS_NAME[level])}>{usedSpace}</span>
      &nbsp;/&nbsp;<span>{maxSpace}</span>
    </>
  )

  return (
    <div className="mt-2 shrink-0 px-3">
      <div
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- as Proton's `Meter`, a `<div>`, styled alike in all browsers
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        className="h-[.25em] w-full overflow-hidden rounded-[.125em] bg-[--border-weak]"
      >
        <div
          className={clsx('me-auto h-full min-w-[3%] rounded-[.125em]', METER_THUMB_CLASS_NAME[level])}
          style={{ width: `${Math.ceil(percentage)}%` }}
        >
          <span className="sr-only">{`${messages.currentStorage} ${usedSpace} / ${maxSpace}`}</span>
        </div>
      </div>
      <div className="flex flex-nowrap justify-between py-2">
        <span>
          {storage.upgradeHref ? (
            <TooltipProvider>
              <Ariakit.TooltipAnchor
                render={
                  <a
                    href={storage.upgradeHref}
                    target={storage.openUpgradeInNewTab ? '_blank' : '_self'}
                    className="m-0 text-xs leading-4 text-[--text-weak] no-underline hover:text-[--text-norm] focus:text-[--text-norm]"
                  >
                    {text}
                  </a>
                }
              />
              <Tooltip>{messages.upgradeStorage}</Tooltip>
            </TooltipProvider>
          ) : (
            <span className="m-0 text-xs leading-4 text-[--text-weak]">{text}</span>
          )}
        </span>
        <span>{appVersion ? <SidebarAppVersion appVersion={appVersion} /> : null}</span>
      </div>
    </div>
  )
}

export interface SidebarListProps extends HTMLAttributes<HTMLUListElement> {
  listClassName?: string
}

// As Proton's `navigation-list` in a `navigation`.
const LIST_CLASS_NAME = 'first:pt-[.1875rem] last:pb-5'

export function SidebarList({ className, listClassName = LIST_CLASS_NAME, children, ...props }: SidebarListProps) {
  return (
    <ul className={clsx('my-0 list-none ps-0', listClassName, className)} {...props}>
      {children}
    </ul>
  )
}

export interface SidebarListItemProps extends LiHTMLAttributes<HTMLLIElement> {
  itemClassName?: string
}

export const SidebarListItem = forwardRef<HTMLLIElement, SidebarListItemProps>(function SidebarListItem(
  { className, itemClassName = 'w-full px-3 mb-0.5', children, ...props },
  ref,
) {
  return (
    <li ref={ref} className={clsx(itemClassName, className)} {...props}>
      {children}
    </li>
  )
})

export interface SidebarListItemDivProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

// As Proton's `navigation-link`. Its transparent border is `border-[1px]`, since Proton's `border` also sets a colour.
const ITEM_DIV_CLASS_NAME = clsx(
  'relative flex h-9 w-full items-center ps-3 pe-2 no-underline [color:inherit] [outline:none]',
  'rounded-[--border-radius-md] border-[1px] border-solid border-transparent',
  '[transition:0.15s_cubic-bezier(0.22,1,0.36,1),background-position_0s]',
  'bg-[--interaction-default] hover:bg-[--interaction-default-hover] active:bg-[--interaction-default-active]',
)

/**
 * Proton's `navigation-link` for the sidebar's links: as `ITEM_DIV_CLASS_NAME`, with Proton's current-page
 * background and `interactive` focus ring.
 * The state variants of `[color:inherit]` outrank Proton's `a:hover`, `a:focus` and `a:active` link colours.
 */
export const SIDEBAR_LINK_CLASS_NAME = clsx(
  ITEM_DIV_CLASS_NAME,
  'hover:[color:inherit] focus:[color:inherit] active:[color:inherit]',
  'aria-[current=page]:bg-[--interaction-default-hover]',
  'focus-visible:border-[--focus-outline] focus-visible:[box-shadow:0_0_0_.1875rem_var(--focus-ring)]',
)

export function SidebarListItemDiv({ children, className, ...props }: SidebarListItemDivProps) {
  return (
    <div className={clsx(ITEM_DIV_CLASS_NAME, className)} {...props}>
      {children}
    </div>
  )
}

export interface SidebarNavProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
}

export function SidebarNav({ children, className, ...props }: SidebarNavProps) {
  const messages = useHomepageMessages().sidebar
  return (
    <nav
      className={clsx('max-w-full flex-auto flex-col flex-nowrap', className)}
      {...props}
      aria-label={messages.navigationLabel}
    >
      <h2 className="sr-only">{messages.navigationHeading}</h2>
      {children}
    </nav>
  )
}
