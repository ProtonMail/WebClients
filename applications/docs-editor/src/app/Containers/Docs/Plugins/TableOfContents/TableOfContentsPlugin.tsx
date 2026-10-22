import React from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { TableOfContentsPlugin as LexicalTableOfContentsPlugin } from '@lexical/react/LexicalTableOfContentsPlugin'
import type { TableOfContentsEntry } from '@lexical/react/LexicalTableOfContentsPlugin'
import type { NodeKey } from 'lexical'
import { clsx } from 'clsx'
import { DropdownMenu, DropdownMenuButton, SimpleDropdown } from '../../Components/Dropdown'
import { Icon } from '../../Components/Icon'
import * as Icons from '../../Components/icons'
import { DocsEditorTelemetryEvents, type DocsEditorTelemetryEvent } from '../../contract/DocsEditorTelemetry'
import { useDocsDependencies, useDocsMessages } from '../../DocsDependenciesProvider'
import { DOCS_EDITOR_MAX_WIDTH, useLeftPanelContext } from '../../Layout/DocsLayout'
import { TocHeader } from './TocHeader'
import { getDocsLayoutScrollContainer } from '../../Layout/docsLayoutUtils'
import './TableOfContents.scss'

// distance from top of scroll root to make heading active
const ACTIVATION_OFFSET = 75

interface ContentItemProps {
  nodeKey: NodeKey
  text: string
  tag: string
  scrollToNode: (key: NodeKey) => void
}

function getHeadingUrl(documentUrl: string, nodeKey: NodeKey) {
  const url = new URL(documentUrl)
  url.searchParams.set('headingKey', nodeKey)
  return url.href
}

function ContentItem({ nodeKey, text, tag, scrollToNode }: ContentItemProps) {
  const messages = useDocsMessages().tableOfContents
  const { activeHeadingKey, documentUrl } = useTableOfContentsContext()
  const isActive = activeHeadingKey === nodeKey
  const headingUrl = documentUrl ? getHeadingUrl(documentUrl, nodeKey) : undefined

  let level = parseInt(tag.slice(1)) - 1
  if (Number.isNaN(level) || level < 0) {
    level = 0
  }

  function handleCopyLink() {
    if (!headingUrl) {
      return
    }
    void navigator.clipboard.writeText(headingUrl)
  }

  return (
    <li
      className="group flex min-h-0 w-full min-w-0 shrink-0 cursor-pointer flex-nowrap items-center justify-between pr-2"
      data-testid="table-of-contents-item-group"
    >
      <a
        href={headingUrl ?? '#'}
        aria-current={isActive ? 'location' : undefined}
        className={clsx(
          'flex w-full flex-nowrap items-stretch text-left no-underline',
          level === 0 ? 'text-md' : 'text-sm',
        )}
        onClick={(event) => {
          event.preventDefault()
          scrollToNode(nodeKey)
        }}
      >
        {level > 0 && (
          <div
            className="w-[1px] shrink-0"
            style={{
              backgroundColor: isActive ? 'var(--docs-primary-accent)' : 'var(--border-weak)',
            }}
          />
        )}
        <div
          className="shrink-0"
          style={{
            '--level': level,
            '--spacing': '1.5ch',
            width: `calc(var(--level) * var(--spacing))`,
          }}
        />
        <span
          className={clsx(
            'min-w-0 truncate py-2 transition-colors',
            isActive
              ? 'is-active font-semibold text-[var(--docs-primary-accent)]'
              : 'font-normal text-[var(--text-weak)] min-[816px]:group-hover:text-[var(--text-norm)]',
          )}
        >
          {text}
        </span>
      </a>
      <SimpleDropdown
        as="button"
        hasCaret={false}
        disabled={!headingUrl}
        originalPlacement="bottom-end"
        className="flex items-center justify-center rounded-md p-2 min-[816px]:opacity-0 min-[816px]:hover:bg-[var(--background-weak)] min-[816px]:group-hover:opacity-100 min-[816px]:group-has-[:focus-visible]:opacity-100 min-[816px]:aria-expanded:opacity-100"
        content={<Icon data={Icons.threeDotsVertical} alt={messages.moreOptions} />}
        data-testid="table-of-contents-item-options"
      >
        <DropdownMenu>
          <DropdownMenuButton onClick={handleCopyLink} className="flex flex-nowrap items-center gap-2">
            <Icon data={Icons.link} />
            <span className="text-sm">{messages.copyLink}</span>
          </DropdownMenuButton>
        </DropdownMenu>
      </SimpleDropdown>
    </li>
  )
}

interface TableOfContentsRendererProps {
  tableOfContents: TableOfContentsEntry[]
  reportTelemetry: (event: DocsEditorTelemetryEvent) => void
  editorHidden: boolean
}

interface ObservedHeader {
  element: HTMLElement
  key: NodeKey
}

function ActiveHeadingListener({ tableOfContents }: Pick<TableOfContentsRendererProps, 'tableOfContents'>) {
  const [editor] = useLexicalComposerContext()
  const { setActiveHeadingKey } = useTableOfContentsContext()

  React.useEffect(() => {
    const scrollRoot = getDocsLayoutScrollContainer(editor.getRootElement())
    if (!scrollRoot) {
      return
    }

    const headersToObserve: ObservedHeader[] = []

    for (const [key] of tableOfContents) {
      const element = editor.getElementByKey(key)
      if (!element) {
        continue
      }
      headersToObserve.push({ element, key })
    }

    if (headersToObserve.length === 0) {
      setActiveHeadingKey(null)
      return
    }

    const getActiveHeadingKey = () => {
      const rootTop = scrollRoot.getBoundingClientRect().top

      let activeKey: NodeKey | null = headersToObserve.length > 0 ? headersToObserve[0].key : null
      for (const { element, key } of headersToObserve) {
        if (element.getBoundingClientRect().top <= rootTop + ACTIVATION_OFFSET) {
          activeKey = key
        }
      }
      return activeKey
    }

    const updateActiveHeading = () => {
      const activeKey = getActiveHeadingKey()
      setActiveHeadingKey(activeKey)
    }

    updateActiveHeading()
    scrollRoot.addEventListener('scroll', updateActiveHeading, { passive: true })
    return () => {
      scrollRoot.removeEventListener('scroll', updateActiveHeading)
    }
  }, [tableOfContents, editor, setActiveHeadingKey])

  return null
}

interface HeadingParamListenerProps {
  scrollToNode: (key: NodeKey) => void
  editorHidden: boolean
}

function HeadingParamListener({ scrollToNode, editorHidden }: HeadingParamListenerProps) {
  const { documentUrl, replaceDocumentUrl, setDocumentUrl } = useTableOfContentsContext()

  React.useEffect(() => {
    if (!documentUrl || editorHidden) {
      return
    }
    const url = new URL(documentUrl)
    const headingKey = url.searchParams.get('headingKey')
    if (!headingKey) {
      return
    }
    url.searchParams.delete('headingKey')
    void replaceDocumentUrl(url.href)
    setDocumentUrl(url.href)
    scrollToNode(headingKey)
  }, [scrollToNode, documentUrl, editorHidden, replaceDocumentUrl, setDocumentUrl])

  return null
}

function TableOfContentsRenderer({ tableOfContents, reportTelemetry, editorHidden }: TableOfContentsRendererProps) {
  const messages = useDocsMessages().tableOfContents
  const [editor] = useLexicalComposerContext()
  const { visibility, setVisibility } = useLeftPanelContext()
  const isExpanded = visibility === 'expanded'

  React.useEffect(() => {
    reportTelemetry(DocsEditorTelemetryEvents.table_of_contents_available)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- report once per outline, even if the host's callback changes
  }, [])

  const navigateToHeading = React.useCallback(
    (key: NodeKey) => {
      editor.read(() => {
        const element = editor.getElementByKey(key)
        if (!element) {
          return
        }
        const shouldSmoothScroll = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        element.scrollIntoView({
          block: 'start',
          behavior: shouldSmoothScroll ? 'smooth' : 'instant',
        })
      })
      if (window.innerWidth < DOCS_EDITOR_MAX_WIDTH) {
        setVisibility('collapsed')
      }
    },
    [editor, setVisibility],
  )

  const handleHeadingClick = React.useCallback(
    (key: NodeKey) => {
      reportTelemetry(DocsEditorTelemetryEvents.table_of_contents_heading_clicked)
      navigateToHeading(key)
    },
    [navigateToHeading, reportTelemetry],
  )

  return (
    <>
      <HeadingParamListener scrollToNode={navigateToHeading} editorHidden={editorHidden} />
      <ActiveHeadingListener tableOfContents={tableOfContents} />

      <nav
        aria-label={messages.outline}
        className={clsx(
          'table-of-contents flex w-0 min-w-0 flex-col flex-nowrap p-0',
          isExpanded && 'is-expanded h-full w-full p-5 pr-1.5 pt-0',
        )}
        data-testid="table-of-contents"
      >
        <TocHeader
          isExpanded={isExpanded}
          onToggle={() => {
            if (!isExpanded) {
              reportTelemetry(DocsEditorTelemetryEvents.table_of_contents_opened)
            }
            setVisibility(isExpanded ? 'collapsed' : 'expanded')
          }}
        />

        <ul className="toc-list flex min-w-0 flex-1 flex-col flex-nowrap overflow-y-auto">
          {tableOfContents.map(([key, text, tag]) => (
            <ContentItem key={key} nodeKey={key} text={text} tag={tag} scrollToNode={handleHeadingClick} />
          ))}
        </ul>
      </nav>
    </>
  )
}

type TableOfContentsContextValue = {
  activeHeadingKey: NodeKey | null
  setActiveHeadingKey: (key: NodeKey | null) => void
  documentUrl: string | null
  replaceDocumentUrl: (url: string) => Promise<void>
  setDocumentUrl: (url: string) => void
}

const TableOfContentsContext = React.createContext<TableOfContentsContextValue>({
  activeHeadingKey: null,
  setActiveHeadingKey: () => {},
  documentUrl: null,
  replaceDocumentUrl: async () => {},
  setDocumentUrl: () => {},
})

function useTableOfContentsContext() {
  return React.useContext(TableOfContentsContext)
}

export interface TableOfContentsPluginProps {
  editorHidden: boolean
}

export function TableOfContentsPlugin({ editorHidden }: TableOfContentsPluginProps) {
  const { getDocumentUrl, replaceDocumentUrl, reportTelemetry } = useDocsDependencies()
  const [activeHeadingKey, setActiveHeadingKey] = React.useState<NodeKey | null>(null)
  const [documentUrl, setDocumentUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchDocumentUrl() {
      const documentUrl = await getDocumentUrl()
      setDocumentUrl(documentUrl)
    }
    void fetchDocumentUrl()
  }, [getDocumentUrl])

  return (
    <TableOfContentsContext.Provider
      value={{
        activeHeadingKey,
        setActiveHeadingKey,
        documentUrl,
        replaceDocumentUrl,
        setDocumentUrl,
      }}
    >
      <LexicalTableOfContentsPlugin>
        {(tableOfContents) => {
          const visibleTableOfContents = tableOfContents.filter(([, text]) => text.trim().length > 0)
          if (!visibleTableOfContents.length) {
            return <div />
          }
          return (
            <TableOfContentsRenderer
              tableOfContents={visibleTableOfContents}
              reportTelemetry={reportTelemetry}
              editorHidden={editorHidden}
            />
          )
        }}
      </LexicalTableOfContentsPlugin>
    </TableOfContentsContext.Provider>
  )
}
