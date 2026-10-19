import * as Ariakit from '@ariakit/react'
import type { DocsCommentThread } from '../../contract/DocsCommentThread'
import { CommentsPanelListThread } from './CommentsPanelListThread'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useCommentsContext } from './CommentsContext'
import debounce from 'lodash/debounce'
import { DropdownPopover } from '../../Components/Dropdown'
import { Icon } from '../../Components/Icon'
import * as Icons from '../../Components/icons'
import { c } from 'ttag'
import type { PositionedItem } from './Positioner'
import { Positioner } from './Positioner'
import { CommentInputBox } from './CommentInputBox'
import type { RangeSelection } from 'lexical'
import { $getNodeByKey, type LexicalNode } from 'lexical'
import { getRangeSelectionRect } from '../../Utils/getSelectionRect'
import { useRightPanelContext, useViewportWidth } from '../../../DocsLayout'
import { getContextualCommentsWidth, getDocsLayoutScrollContainer } from '../../Layout/docsLayoutUtils'

const COMMENT_INPUT_ID = 'comment-input'
const COMMENTS_WIDTH = 'max(20.5vw, 300px)'

export type ThreadPopoverButtonProps = { thread: DocsCommentThread }

export function ThreadPopoverButton({ thread }: ThreadPopoverButtonProps) {
  return (
    <Ariakit.PopoverProvider placement="left-start">
      <Ariakit.PopoverDisclosure className="rounded border border-[--border-weak] bg-[--background-norm] p-2">
        <div className="sr-only">{c('Action').t`Show thread`}</div>
        <Icon data={Icons.speechBubbleDots} viewBox="0 0 33 33" className="min-h-4 min-w-4" />
      </Ariakit.PopoverDisclosure>
      <DropdownPopover
        aria-label={c('Label').t`Comments`}
        style={{ width: COMMENTS_WIDTH }}
        render={<Ariakit.Popover portal unmountOnHide gutter={10} flip="left-end left" />}
      >
        <CommentsPanelListThread thread={thread} className="!border-0 !shadow-none" />
      </DropdownPopover>
    </Ariakit.PopoverProvider>
  )
}

function ThreadComponent({
  thread,
  showContextualPanels,
}: {
  thread: DocsCommentThread
  showContextualPanels: boolean
}) {
  if (showContextualPanels) {
    return (
      <CommentsPanelListThread thread={thread} className="hover:translate-x-[-5px] data-[active]:translate-x-[-5px]" />
    )
  }

  return <ThreadPopoverButton thread={thread} />
}

export function ContextualComments({ activeThreads }: { activeThreads: DocsCommentThread[] }) {
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
      const getFirstAssociatedMarkNodeForThread = (thread: DocsCommentThread) => {
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

      const items: ({ node: LexicalNode | null } & ({ thread: DocsCommentThread } | { selection: RangeSelection }))[] =
        activeThreads.map((thread) => ({
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
