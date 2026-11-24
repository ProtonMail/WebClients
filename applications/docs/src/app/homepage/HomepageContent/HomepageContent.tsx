import type { JSX } from 'react'
import { CircleLoader } from '../components/CircleLoader'
import type { TableVariant } from './DocumentsTable'
import { DocumentsTable } from './DocumentsTable'
import { InvitesTable } from './InvitesTable'
import { ContextMenuProvider } from './DocContextMenu/context'
import { useHomepageMessages } from '../messages/HomepageMessagesProvider'
import type { HomepageMessages } from '../messages/defaultHomepageMessages'
import { useHomepageView } from '../homepageViewContext'
import { forwardRef, useEffect, useMemo } from 'react'
import { COLOR_BY_TYPE, ContentSheet, REFRESH_AFTER_NEW_DOCUMENT } from './shared'
import emptyStateRecentsImage from './empty-state-recents.svg'
import emptyStateRecentsDarkImage from './emptyStateRecentsDark.svg'
import emptyStateImage from './empty-state.svg'
import emptyStateDarkImage from './emptyStateDark.svg'
import { clsx } from '../utils/clsx'
import * as Ariakit from '@ariakit/react'
import { APPS } from '../utils/apps'
import { TelemetryEvent } from '../utils/telemetry'
import { Icon } from '../components/Icon'
import * as Icons from '../components/icons'
import { useIsDarkThemeMode } from '../utils/useIsDarkThemeMode'

// The dark versions are the same illustrations, recoloured for the dark theme.
const EMPTY_STATE_IMAGES = {
  light: { recents: emptyStateRecentsImage, other: emptyStateImage },
  dark: { recents: emptyStateRecentsDarkImage, other: emptyStateDarkImage },
}

function useEmptyStateImages() {
  return EMPTY_STATE_IMAGES[useIsDarkThemeMode() ? 'dark' : 'light']
}

export function HomepageContent() {
  const emptyStateImages = useEmptyStateImages()
  const preloadUrls = useMemo(() => [emptyStateImages.other, emptyStateImages.recents], [emptyStateImages])
  return (
    <ContextMenuProvider>
      <PreloadImages urls={preloadUrls} />
      <div className="flex h-full w-full flex-col flex-nowrap gap-5 small:pr-2">
        <HomepageView />
      </div>
    </ContextMenuProvider>
  )
}

function HomepageView(): JSX.Element | null {
  const { state } = useHomepageView()

  switch (state.view) {
    // Initial.
    case 'search-initial':
    case 'recents-initial':
      // These cases happen when recent document fetching has not started yet.
      // The reason to not render anything is to avoid flashing a loading spinner,
      // which can happen in some cases if the page renders before the cache is loaded.
      return null
    // Loading.
    case 'search-loading':
    case 'recents-loading':
    case 'trash-loading':
      return (
        <div className="flex h-full items-center justify-center">
          <CircleLoader size="large" />
        </div>
      )
    // Empty states.
    case 'search-empty':
      return <EmptyState variant="search" />
    case 'recents-empty':
      return (
        <>
          <InvitesTable />
          <EmptyState variant="recents" />
        </>
      )
    case 'trash-empty':
      return <EmptyState variant="trash" />
    // Document lists.
    case 'search':
      return <DocumentsTable itemsSections={state.itemSections} variant="search" />
    case 'recents': {
      let variant: TableVariant
      switch (state.sort) {
        case 'viewed':
          variant = 'recents-viewed'
          break
        case 'name':
          variant = 'recents-name'
          break
        case 'owner':
          variant = 'recents-owner'
          break
        case 'location':
          variant = 'recents-location'
          break
      }
      return (
        <>
          <InvitesTable />
          <DocumentsTable itemsSections={state.itemSections} variant={variant} />
        </>
      )
    }
    case 'trash':
      return <DocumentsTable itemsSections={state.itemSections} variant="trash" />
    // This won't happen, it's only here for type safety.
    case 'unknown':
      return null
    // TODO: what about error states?
  }
}

type EmptyStateVariant = 'recents' | 'trash' | 'search'

function getEmptyStateText(variant: EmptyStateVariant, messages: HomepageMessages['content']): string {
  switch (variant) {
    case 'recents':
      return messages.emptyRecents
    case 'trash':
      return messages.emptyTrash
    case 'search':
      return messages.emptySearch
  }
}

const HomepageButton = forwardRef<HTMLButtonElement, Ariakit.ButtonProps>(function HomepageButton(props, ref) {
  return (
    <Ariakit.Button
      {...props}
      className={clsx(
        'inline-flex h-9 items-center justify-center gap-2 rounded pl-3 pr-4 text-sm leading-5 no-underline',
        '!text-[--text-norm] hover:bg-[#C2C1C0]/20 hover:text-[--text-norm] [[data-theme-mode=dark]_&]:hover:bg-[--interaction-default-hover]',
        'border-[1px] border-[--border-norm]',
        '!outline-none transition focus-visible:border-[#6D4AFF] focus-visible:ring-[3px] focus-visible:ring-[#6D4AFF33]',
        props.className,
      )}
      ref={ref}
    />
  )
})

function RecentsEmptyStateButtons() {
  const { updateRecentDocuments, reportTelemetry, getAppHref } = useHomepageView()
  const { newDocument: messages, content } = useHomepageMessages()
  return (
    <div className="flex items-center justify-center gap-4">
      <HomepageButton
        render={<Ariakit.Role.a href={getAppHref('/doc', APPS.PROTONDOCS)} target="_blank" />}
        onClick={() => {
          reportTelemetry(TelemetryEvent.document_created)
          setTimeout(updateRecentDocuments, REFRESH_AFTER_NEW_DOCUMENT)
        }}
      >
        <Icon
          data={Icons.brandProtonDocs}
          className="shrink-0 text-[--icon-color]"
          style={{ '--icon-color': COLOR_BY_TYPE.document }}
        />
        {messages.document}
      </HomepageButton>

      <HomepageButton
        className="relative"
        render={<Ariakit.Role.a href={getAppHref('/sheet', APPS.PROTONDOCS)} target="_blank" />}
        onClick={() => setTimeout(updateRecentDocuments, REFRESH_AFTER_NEW_DOCUMENT)}
      >
        <Icon
          data={Icons.brandProtonSheets}
          className="shrink-0 text-[--icon-color]"
          style={{ '--icon-color': COLOR_BY_TYPE.spreadsheet }}
        />
        {messages.spreadsheet}
        <span
          className={clsx(
            'flex h-4 items-center justify-center rounded-full bg-[--background-weak] px-1.5',
            'text-[0.625rem]/[1rem] font-semibold text-[--link-norm]',
            'pointer-events-none absolute -right-5 -top-2',
          )}
        >
          {content.newBadge}
        </span>
      </HomepageButton>
    </div>
  )
}

type EmptyStateProps = { variant: EmptyStateVariant }
function EmptyState({ variant }: EmptyStateProps) {
  const messages = useHomepageMessages().content
  const images = useEmptyStateImages()
  return (
    <ContentSheet isBottom className="flex shrink-0 grow items-center justify-center">
      <div className="flex flex-col items-center gap-6 p-8">
        <img
          className={clsx(variant === 'recents' ? 'w-[38.3125rem] scale-110 xsmall:scale-100' : 'w-[8.125rem]')}
          aria-hidden="true"
          src={variant === 'recents' ? images.recents : images.other}
          alt=""
        />
        <p className="m-0 mb-1 max-w-[25rem] text-center text-2xl font-bold leading-8">
          {getEmptyStateText(variant, messages)}
        </p>
        {variant === 'recents' ? <RecentsEmptyStateButtons /> : null}
      </div>
    </ContentSheet>
  )
}

type PreloadImagesProps = { urls: string[] }

/**
 * Preloads images. This prevents flashing of empty state images.
 */
function PreloadImages({ urls }: PreloadImagesProps) {
  useEffect(() => {
    const links = urls.map((url) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url
      document.head.appendChild(link)
      return link
    })

    return () => {
      for (const link of links) {
        link.remove()
      }
    }
  }, [urls])

  return null
}
