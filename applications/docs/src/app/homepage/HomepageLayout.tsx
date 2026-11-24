import { useRef, type MouseEvent, type ReactNode } from 'react'

import { useHomepageMessages } from './messages/HomepageMessagesProvider'

/** Proton's `MAIN_CONTENT_ID`, the target of the "Skip to main content" link. */
const MAIN_CONTENT_ID = 'main-content'

// Proton's `.sr-only-focusable` (packages/styles/scss/utilities/_visibility.scss): shown in the top start corner
// while it has the keyboard focus.
const SKIP_LINK_CLASS_NAME =
  'sr-only focus:start-2 focus:top-2 focus:z-[2] focus:h-auto focus:w-auto focus:overflow-visible focus:whitespace-normal focus:[clip:auto] focus:m-0 focus:rounded-full focus:border-[1px] focus:border-solid focus:border-[--border-norm] focus:bg-[--background-norm] focus:px-4 focus:py-2 focus:font-semibold focus:text-[--text-norm] focus:no-underline'

export type HomepageLayoutProps = {
  sidebar: ReactNode
  header: ReactNode
  /** The page's content, in its scrolling main area. */
  children: ReactNode
  /** Above the page: the host's banners. */
  top?: ReactNode
  /** Beside the page: the host's drawer app, which places itself. */
  drawerApp?: ReactNode
}

/**
 * The homepage's page: the sidebar beside the header and the main area, as Proton's `PrivateAppContainer` and
 * `PrivateMainArea` (packages/components/containers/) lay them out for Docs, with their "Skip to main content" link.
 */
export function HomepageLayout({ sidebar, header, children, top, drawerApp }: HomepageLayoutProps) {
  const messages = useHomepageMessages().header
  const mainRef = useRef<HTMLElement>(null)

  // Focus instead of following the link, so the URL hash and the router are left alone.
  const focusMainContent = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    mainRef.current?.focus()
  }

  return (
    <div className="flex h-full flex-row flex-nowrap">
      <div className="relative flex flex-1 flex-col flex-nowrap overflow-hidden bg-[--homepage-background] text-[--text-norm] [[data-theme-mode=dark]_&]:bg-[--background-norm]">
        {/* First in the page, before the top banners, which can hold links and buttons. */}
        <a href={`#${MAIN_CONTENT_ID}`} className={SKIP_LINK_CLASS_NAME} onClick={focusMainContent}>
          {messages.skipToMainContent}
        </a>
        {top}
        <div className="flex flex-auto flex-col flex-nowrap">
          <div className="flex flex-1 flex-nowrap">
            {sidebar}
            <div className="flex min-w-0 flex-1 flex-col flex-nowrap overflow-hidden">
              {header}
              <main
                ref={mainRef}
                id={MAIN_CONTENT_ID}
                tabIndex={-1}
                className="relative h-full flex-auto overflow-auto outline-none small:ps-1"
              >
                <div className="flex h-full w-full flex-nowrap">
                  <div className="flex h-full w-full flex-nowrap overflow-auto">{children}</div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
      {drawerApp}
    </div>
  )
}
