import Dropdown from '@proton/components/components/dropdown/Dropdown'
import DropdownButton from '@proton/components/components/dropdown/DropdownButton'
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu'
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton'
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor'
import React from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { TableOfContentsPlugin } from '@lexical/react/LexicalTableOfContentsPlugin'
import type { TableOfContentsEntry } from '@lexical/react/LexicalTableOfContentsPlugin'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import type { NodeKey } from 'lexical'
import { c } from 'ttag'
import { DOCS_EDITOR_MAX_WIDTH, useLeftPanelContext } from '../../Containers/DocsLayout'
import clsx from '@proton/utils/clsx'
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical'
import { useStore } from 'zustand'
import { useEditorState } from '../../Containers/EditorStateProvider'
import { IcLink } from '@proton/icons/icons/IcLink'
import { TelemetryDocsEditorEvents } from '@proton/shared/lib/api/telemetry'
import { TocHeader } from './TocHeader'
import { getDocsLayoutScrollContainer } from '../../Containers/docsLayoutUtils'
import './TableOfContents.scss'

// distance from top of scroll root to make heading active
const ACTIVATION_OFFSET = 75

interface ContentItemProps {
  nodeKey: NodeKey
  text: string
  tag: string
  scrollToNode: (key: NodeKey) => void
}

function ContentItem({ nodeKey, text, tag, scrollToNode }: ContentItemProps) {
  const { activeHeadingKey, documentUrl } = useTableOfContentsContext()
  const isActive = activeHeadingKey === nodeKey

  const {
    anchorRef: moreOptionsAnchorRef,
    toggle: toggleMoreOptions,
    isOpen: isMoreOptionsOpen,
    close: closeMoreOptions,
  } = usePopperAnchor<HTMLButtonElement>()

  let level = parseInt(tag.slice(1)) - 1
  if (Number.isNaN(level) || level < 0) {
    level = 0
  }

  function handleCopyLink() {
    if (!documentUrl) {
      return
    }
    const url = new URL(documentUrl)
    url.searchParams.set('headingKey', nodeKey)
    void navigator.clipboard.writeText(url.href)
    closeMoreOptions()
  }

  return (
    <li
      className="group flex min-h-0 w-full min-w-0 shrink-0 cursor-pointer items-center justify-between pr-2"
      data-testid="table-of-contents-item-group"
    >
      <button
        className={clsx('flex w-full flex-nowrap items-stretch text-left', level === 0 ? 'text-md' : 'text-sm')}
        onClick={() => scrollToNode(nodeKey)}
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
      </button>
      <DropdownButton
        ref={moreOptionsAnchorRef}
        onClick={toggleMoreOptions}
        disabled={!documentUrl}
        hasCaret={false}
        as="button"
        className={clsx(
          'flex items-center justify-center rounded-md p-2 min-[816px]:hover:bg-[var(--background-weak)]',
          isMoreOptionsOpen ? 'min-[816px]:flex' : 'min-[816px]:hidden min-[816px]:group-hover:flex',
        )}
        data-testid="table-of-contents-item-options"
      >
        <IcThreeDotsVertical />
      </DropdownButton>
      <Dropdown
        isOpen={isMoreOptionsOpen}
        anchorRef={moreOptionsAnchorRef}
        onClose={closeMoreOptions}
        originalPlacement="bottom-end"
      >
        <DropdownMenu>
          <DropdownMenuButton onClick={handleCopyLink} className="flex flex-nowrap items-center gap-2">
            <IcLink />
            <span className="text-sm">{c('Action').t`Copy link`}</span>
          </DropdownMenuButton>
        </DropdownMenu>
      </Dropdown>
    </li>
  )
}

interface TableOfContentsRendererProps {
  tableOfContents: TableOfContentsEntry[]
  reportTelemetry: (event: TelemetryDocsEditorEvents) => void
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
}

function HeadingParamListener({ scrollToNode }: HeadingParamListenerProps) {
  const { documentUrl, replaceDocumentUrl, setDocumentUrl } = useTableOfContentsContext()
  const { editorHidden } = useStore(useEditorState())

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

function TableOfContentsRenderer({ tableOfContents, reportTelemetry }: TableOfContentsRendererProps) {
  const [editor] = useLexicalComposerContext()
  const { visibility, setVisibility } = useLeftPanelContext()
  const isExpanded = visibility === 'expanded'

  useEffectOnce(() => {
    reportTelemetry(TelemetryDocsEditorEvents.table_of_contents_available)
  }, [reportTelemetry])

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
      reportTelemetry(TelemetryDocsEditorEvents.table_of_contents_heading_clicked)
      navigateToHeading(key)
    },
    [navigateToHeading, reportTelemetry],
  )

  return (
    <>
      <HeadingParamListener scrollToNode={navigateToHeading} />
      <ActiveHeadingListener tableOfContents={tableOfContents} />

      <div
        className={clsx(
          'table-of-contents flex w-0 min-w-0 flex-col p-0',
          isExpanded && 'is-expanded h-full w-full p-5 pr-1.5 pt-0',
        )}
        data-testid="table-of-contents"
      >
        <TocHeader
          isActive={isExpanded}
          onToggle={() => {
            if (!isExpanded) {
              reportTelemetry(TelemetryDocsEditorEvents.table_of_contents_opened)
            }
            setVisibility(isExpanded ? 'collapsed' : 'expanded')
          }}
        />

        <ul className="toc-list flex min-w-0 flex-1 flex-col overflow-y-auto">
          {tableOfContents.map(([key, text, tag]) => (
            <ContentItem key={key} nodeKey={key} text={text} tag={tag} scrollToNode={handleHeadingClick} />
          ))}
        </ul>
      </div>
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

interface TableOfContentsProps {
  getDocumentUrl: () => Promise<string>
  replaceDocumentUrl: (url: string) => Promise<void>
  reportTelemetry: (event: TelemetryDocsEditorEvents) => void
}

export function TableOfContents({ getDocumentUrl, replaceDocumentUrl, reportTelemetry }: TableOfContentsProps) {
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
      <TableOfContentsPlugin>
        {(tableOfContents) => {
          const visibleTableOfContents = tableOfContents.filter(([, text]) => text.trim().length > 0)
          if (!visibleTableOfContents.length) {
            return <div />
          }
          return <TableOfContentsRenderer tableOfContents={visibleTableOfContents} reportTelemetry={reportTelemetry} />
        }}
      </TableOfContentsPlugin>
    </TableOfContentsContext.Provider>
  )
}
