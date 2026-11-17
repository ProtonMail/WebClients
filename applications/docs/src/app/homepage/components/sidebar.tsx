import type { HTMLAttributes, LiHTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'
import { c } from 'ttag'

import { clsx } from '../utils/clsx'

export interface SidebarListProps extends HTMLAttributes<HTMLUListElement> {
  listClassName?: string
}

export function SidebarList({ className, listClassName = 'navigation-list', children, ...props }: SidebarListProps) {
  return (
    <ul className={clsx('unstyled my-0', listClassName, className)} {...props}>
      {children}
    </ul>
  )
}

export interface SidebarListItemProps extends LiHTMLAttributes<HTMLLIElement> {
  itemClassName?: string
}

export const SidebarListItem = forwardRef<HTMLLIElement, SidebarListItemProps>(function SidebarListItem(
  { className, itemClassName = 'navigation-item w-full px-3 mb-0.5', children, ...props },
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

export function SidebarListItemDiv({ children, className, ...props }: SidebarListItemDivProps) {
  return (
    <div className={clsx('navigation-link', className)} {...props}>
      {children}
    </div>
  )
}

export interface SidebarNavProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
}

export function SidebarNav({ children, className, ...props }: SidebarNavProps) {
  return (
    <nav
      className={clsx('navigation max-w-full flex-auto flex-nowrap flex-column', className)}
      {...props}
      // translator: Label for the primary navigation for screen readers. Omit the word "navigation" as it's announced in the landmarks menu as "Main navigation" automatically.
      aria-label={c('Label').t`Main`}
    >
      <h2 className="sr-only">
        {
          // translator: This is a hidden headline for users with screen readers to highlight the main navigation
          c('Label').t`Navigation`
        }
      </h2>
      {children}
    </nav>
  )
}
