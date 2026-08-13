import usePopper from '@proton/components/components/popper/usePopper'
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor'
import type { CommentThreadInterface } from '@proton/docs-shared'
import { CommentsPanelListThread } from './CommentsPanelListThread'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCommentsContext } from './CommentsContext'
import debounce from 'lodash/debounce'
import SpeechBubbleDotsIcon from '../../Icons/SpeechBubbleDotsIcon'
import { c } from 'ttag'
import useCombinedRefs from '@proton/hooks/useCombinedRefs'
import type { PositionedItem } from './Positioner'
import { Positioner } from './Positioner'
import { CommentInputBox } from './CommentInputBox'
import type { RangeSelection } from 'lexical'
import { $getNodeByKey, type LexicalNode } from 'lexical'
import { getRangeSelectionRect } from '../../Utils/getSelectionRect'
import { useRightPanelContext, useViewportWidth } from '../../Containers/DocsLayout'
import { getContextualCommentsWidth, getDocsLayoutScrollContainer } from '../../Containers/docsLayoutUtils'

const COMMENT_INPUT_ID = 'comment-input'
const COMMENTS_WIDTH = 'max(20.5vw, 300px)'

function ThreadPopoverButton({ thread }: { thread: CommentThreadInterface }) {
  const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>()
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const { floating, position } = usePopper({
    isOpen,
    originalPlacement: 'left-start',
    availablePlacements: ['left', 'left-start', 'left-end'],
    reference: {
      mode: 'element',
      value: anchorRef.current,
    },
  })

  const combinedRef = useCombinedRefs<HTMLDivElement>(popoverRef, floating)

  useEffect(() => {
    const handleClickOutside = ({ target }: MouseEvent) => {
      const targetNode = target as HTMLElement
      if (popoverRef.current?.contains(targetNode) || anchorRef.current?.contains(targetNode)) {
        return
      }
      close()
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [anchorRef, close])

  return (
    <>
      <button className="bg-norm border-weak rounded border p-2" ref={anchorRef} onClick={toggle}>
        <div className="sr-only">{c('Action').t`Show thread`}</div>
        <SpeechBubbleDotsIcon className="min-h-4 min-w-4" />
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `translate3d(${position.left}px, ${position.top}px, 0)`,
            width: COMMENTS_WIDTH,
          }}
          ref={combinedRef}
        >
          <CommentsPanelListThread thread={thread} />
        </div>
      )}
    </>
  )
}

function ThreadComponent({
  thread,
  showContextualPanels,
}: {
  thread: CommentThreadInterface
  showContextualPanels: boolean
}) {
  if (showContextualPanels) {
    return (
      <CommentsPanelListThread thread={thread} className="hover:translate-x-[-5px] data-[active]:translate-x-[-5px]" />
    )
  }

  return <ThreadPopoverButton thread={thread} />
}

export function ContextualComments({ activeThreads }: { activeThreads: CommentThreadInterface[] }) {
  const [editor] = useLexicalComposerContext()
  const { setWidth: setRightPanelWidth } = useRightPanelContext()
  const viewportWidth = useViewportWidth()
  const { markNodeMap, activeIDs, commentInputSelection, cancelAddComment } = useCommentsContext()

  const [items, setItems] = useState<PositionedItem[]>([])

  const activeMarkID = activeIDs[0] as string | undefined

  const activeThread = useMemo(() => {
    if (!activeMarkID) {
      return undefined
    }

    return activeThreads.find((thread) => thread.markID === activeMarkID)
  }, [activeMarkID, activeThreads])

  const contextualCommentsWidth = getContextualCommentsWidth(viewportWidth)
  const showContextualPanels = contextualCommentsWidth !== null

  useEffect(() => {
    setRightPanelWidth(contextualCommentsWidth ?? 0)
  }, [contextualCommentsWidth, setRightPanelWidth])

  useEffect(() => {
    return () => setRightPanelWidth(0)
  }, [setRightPanelWidth])

  const shouldShowCommentInputBox = commentInputSelection !== undefined

  const shouldShowCommentInputBoxAsContextual = shouldShowCommentInputBox && showContextualPanels
  const shouldShowCommentInputBoxAsSticky = shouldShowCommentInputBox && !showContextualPanels

  const getThreadPositions = useCallback(() => {
    editor.read(() => {
      const getFirstAssociatedMarkNodeForThread = (thread: CommentThreadInterface) => {
        const markID = thread.markID
        const markNodeKeys = markNodeMap.get(markID)
        if (markNodeKeys === undefined) {
          return null
        }
        const markNodeKey = Array.from(markNodeKeys)[0]
        return $getNodeByKey(markNodeKey)
      }

      const getMarkRectForThread = (markNode: LexicalNode | null) => {
        if (!markNode) {
          return null
        }
        const key = markNode.__key
        const markElement = editor.getElementByKey(key)
        if (!markElement) {
          return null
        }
        const markRect = markElement.getBoundingClientRect()
        return markRect
      }

      const items: ({ node: LexicalNode | null } & (
        { thread: CommentThreadInterface } | { selection: RangeSelection }
      ))[] = activeThreads.map((thread) => ({
        thread,
        node: getFirstAssociatedMarkNodeForThread(thread),
      }))

      if (shouldShowCommentInputBoxAsContextual) {
        items.push({
          selection: commentInputSelection,
          node: commentInputSelection.anchor.getNode(),
        })
      }

      const activeThreadItems: PositionedItem[] = items
        .sort((a, b) => {
          if (a.node && b.node) {
            return a.node.isBefore(b.node) ? -1 : 1
          }
          if ('thread' in a && 'thread' in b) {
            return a.thread.createTime.serverTimestamp - b.thread.createTime.serverTimestamp
          }
          return 0
        })
        .map((item) => {
          if ('thread' in item) {
            const markRect = getMarkRectForThread(item.node)
            if (!markRect) {
              return null
            }
            return {
              id: item.thread.localID,
              item: <ThreadComponent thread={item.thread} showContextualPanels={showContextualPanels} />,
              itemProps: {
                style: {
                  left: showContextualPanels ? 0 : undefined,
                  right: showContextualPanels ? undefined : '0.5rem',
                  width: showContextualPanels ? 'calc(100% - 1rem)' : 'auto',
                },
              },
              position: markRect.y,
            } satisfies PositionedItem
          }

          if ('selection' in item) {
            const rect = getRangeSelectionRect(editor, item.selection)
            if (!rect) {
              return null
            }

            const position = rect.top
            return {
              id: COMMENT_INPUT_ID,
              item: <CommentInputBox editor={editor} cancelAddComment={cancelAddComment} />,
              itemProps: {
                style: {
                  width: 'calc(100% - 2rem)',
                },
              },
              position,
            }
          }

          return null
        })
        .filter((thread) => !!thread)

      setItems(activeThreadItems)
    })
  }, [
    activeThreads,
    cancelAddComment,
    commentInputSelection,
    editor,
    showContextualPanels,
    markNodeMap,
    shouldShowCommentInputBoxAsContextual,
  ])

  const debouncedGetThreadPositions = useMemo(() => debounce(getThreadPositions, 50), [getThreadPositions])

  useEffect(() => {
    debouncedGetThreadPositions()
  }, [debouncedGetThreadPositions])

  useEffect(() => {
    const rootElement = editor.getRootElement()
    if (!rootElement) {
      return
    }

    const observer = new ResizeObserver(() => debouncedGetThreadPositions())
    observer.observe(rootElement)

    return () => observer.disconnect()
  }, [debouncedGetThreadPositions, editor])

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      debouncedGetThreadPositions()
    })
  }, [debouncedGetThreadPositions, editor])

  return (
    <>
      <Positioner
        activeItemID={shouldShowCommentInputBox ? COMMENT_INPUT_ID : activeThread?.localID}
        items={items}
        className="pointer-events-none relative *:pointer-events-auto print:hidden"
        style={{
          justifySelf: 'end',
          width: showContextualPanels ? '100%' : 'max-content',
        }}
        scrollContainer={getDocsLayoutScrollContainer(editor.getRootElement())}
      />
      {shouldShowCommentInputBoxAsSticky && (
        <div className="pointer-events-auto fixed bottom-2 left-0 w-full px-2">
          <CommentInputBox editor={editor} cancelAddComment={cancelAddComment} />
        </div>
      )}
    </>
  )
}
