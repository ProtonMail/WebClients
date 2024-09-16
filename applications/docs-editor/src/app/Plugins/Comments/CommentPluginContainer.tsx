import type { NodeKey } from 'lexical'
import {
  $createCommentThreadMarkNode,
  $isCommentThreadMarkNode,
  $unwrapCommentThreadMarkNode,
  $wrapSelectionInCommentThreadMarkNode,
  CommentThreadMarkNode,
} from './CommentThreadMarkNode'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister, registerNestedElementResolver } from '@lexical/utils'
import { $getNodeByKey, $getSelection, $isElementNode, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from 'lexical'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { CommentInputBox } from './CommentInputBox'
import { FloatingAddCommentButton } from './FloatingAddCommentButton'
import CommentsPanel from './CommentsPanel'
import type { CommentMarkNodeChangeData, CommentThreadInterface } from '@proton/docs-shared'
import { CommentThreadState, CommentsEvent } from '@proton/docs-shared'
import { INSERT_INLINE_COMMENT_COMMAND, SHOW_ALL_COMMENTS_COMMAND } from '../../Commands'
import type { EditorRequiresClientMethods } from '@proton/docs-shared'
import { useApplication } from '../../ApplicationProvider'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { sendErrorMessage } from '../../Utils/errorMessage'
import { CommentsProvider } from './CommentsContext'
import { ContextualComments } from './ContextualComments'
import { useLatestAwarenessStates } from '../../Utils/useLatestAwarenessStates'
import { KEYBOARD_SHORTCUT_COMMAND } from '../KeyboardShortcuts/Command'
import { useMarkNodesContext } from '../MarkNodesContext'

export default function CommentPlugin({
  controller,
  username,
}: {
  controller: EditorRequiresClientMethods
  username: string
}): JSX.Element {
  const { application } = useApplication()
  const [editor] = useLexicalComposerContext()
  const isEditorEditable = useLexicalEditable()
  const [threads, setThreads] = useState<CommentThreadInterface[]>([])
  const activeThreads = useMemo(() => {
    return threads.filter((thread) => thread.state === CommentThreadState.Active)
  }, [threads])

  const awarenessStates = useLatestAwarenessStates(application)

  useEffect(() => {
    controller.getAllThreads().then(setThreads).catch(sendErrorMessage)
  }, [controller])

  const { markNodeMap, activeIDs, activeAnchorKey } = useMarkNodesContext()

  const [showCommentInput, setShowCommentInput] = useState(false)
  const [showCommentsPanel, setShowCommentsPanel] = useState(false)

  const [threadToFocus, setThreadToFocus] = useState<string | null>(null)

  useEffect(() => {
    if (!isEditorEditable) {
      setShowCommentInput(false)
    }
  }, [isEditorEditable])

  const cancelAddComment = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection()
      // Restore selection
      if (selection !== null) {
        selection.dirty = true
      }
    })
    setShowCommentInput(false)
  }, [editor])

  useEffect(() => {
    const markNodeKeysToIDs: Map<NodeKey, string[]> = new Map()

    return mergeRegister(
      registerNestedElementResolver<CommentThreadMarkNode>(
        editor,
        CommentThreadMarkNode,
        (from: CommentThreadMarkNode) => {
          return $createCommentThreadMarkNode(from.getIDs())
        },
        (from: CommentThreadMarkNode, to: CommentThreadMarkNode) => {
          // Merge the IDs
          const ids = from.getIDs()
          ids.forEach((id) => {
            to.addID(id)
          })
        },
      ),
      editor.registerMutationListener(CommentThreadMarkNode, (mutations) => {
        editor.getEditorState().read(() => {
          for (const [key, mutation] of mutations) {
            const node: null | CommentThreadMarkNode = $getNodeByKey(key)
            let ids: NodeKey[] = []

            if (mutation === 'destroyed') {
              ids = markNodeKeysToIDs.get(key) || []
            } else if ($isCommentThreadMarkNode(node)) {
              ids = node.getIDs()
            }

            for (let i = 0; i < ids.length; i++) {
              const id = ids[i]
              let markNodeKeys = markNodeMap.get(id)
              markNodeKeysToIDs.set(key, ids)

              if (mutation === 'destroyed') {
                if (markNodeKeys !== undefined) {
                  markNodeKeys.delete(key)
                  if (markNodeKeys.size === 0) {
                    markNodeMap.delete(id)
                  }
                }
              } else {
                if (markNodeKeys === undefined) {
                  markNodeKeys = new Set()
                  markNodeMap.set(id, markNodeKeys)
                }
                if (!markNodeKeys.has(key)) {
                  markNodeKeys.add(key)
                }
              }
            }
          }
        })
      }),
      editor.registerCommand(
        INSERT_INLINE_COMMENT_COMMAND,
        () => {
          const domSelection = window.getSelection()
          if (domSelection !== null) {
            domSelection.removeAllRanges()
          }
          setShowCommentInput(true)
          setShowCommentsPanel(false)
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        SHOW_ALL_COMMENTS_COMMAND,
        () => {
          setShowCommentsPanel((show) => !show)
          setShowCommentInput(false)
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        KEYBOARD_SHORTCUT_COMMAND,
        ({ shortcut }) => {
          switch (shortcut) {
            case 'OPEN_COMMENT_PANEL_SHORTCUT': {
              return editor.dispatchCommand(SHOW_ALL_COMMENTS_COMMAND, undefined)
            }
            case 'INSERT_COMMENT_SHORTCUT': {
              return editor.dispatchCommand(INSERT_INLINE_COMMENT_COMMAND, undefined)
            }
            default: {
              return false
            }
          }
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [editor, markNodeMap])

  const onAddComment = () => {
    editor.dispatchCommand(INSERT_INLINE_COMMENT_COMMAND, undefined)
  }

  const createMarkNodeForCurrentSelection = useCallback(
    (id: string) => {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          const isBackward = selection.isBackward()
          $wrapSelectionInCommentThreadMarkNode(selection, isBackward, id)
        }
      })
    },
    [editor],
  )

  const removeMarkNode = useCallback(
    (markID: string) => {
      const markNodeKeys = markNodeMap.get(markID)
      if (markNodeKeys !== undefined) {
        // Do async to avoid causing a React infinite loop
        setTimeout(() => {
          editor.update(() => {
            for (const key of markNodeKeys) {
              const node: null | CommentThreadMarkNode = $getNodeByKey(key)
              if ($isCommentThreadMarkNode(node)) {
                node.deleteID(markID)
                if (node.getIDs().length === 0) {
                  $unwrapCommentThreadMarkNode(node)
                }
              }
            }
          })
        })
      }
    },
    [editor, markNodeMap],
  )

  const resolveMarkNode = useCallback(
    (markID: string) => {
      const markNodeKeys = markNodeMap.get(markID)
      if (markNodeKeys !== undefined) {
        editor.update(() => {
          for (const key of markNodeKeys) {
            const node: null | CommentThreadMarkNode = $getNodeByKey(key)
            if ($isCommentThreadMarkNode(node)) {
              if (markNodeKeys.size === 1 && !node.getIDs().includes(markID)) {
                continue
              }
              if (markNodeKeys.size > 1 && !node.getIDs().every((id) => id === markID)) {
                continue
              }
              node.setResolved(true)
            }
          }
        })
      }
    },
    [editor, markNodeMap],
  )

  const unresolveMarkNode = useCallback(
    (markID: string) => {
      const markNodeKeys = markNodeMap.get(markID)
      if (markNodeKeys !== undefined) {
        editor.update(() => {
          for (const key of markNodeKeys) {
            const node: null | CommentThreadMarkNode = $getNodeByKey(key)
            if ($isCommentThreadMarkNode(node)) {
              if (markNodeKeys.size === 1 && !node.getIDs().includes(markID)) {
                continue
              }
              if (markNodeKeys.size > 1 && !node.getIDs().every((id) => id === markID)) {
                continue
              }
              node.setResolved(false)
            }
          }
        })
      }
    },
    [editor, markNodeMap],
  )
  const getMarkNodes = useCallback(
    (markID: string) => {
      return editor.getEditorState().read(() => {
        const markNodeKeys = markNodeMap.get(markID)
        if (!markNodeKeys) {
          return null
        }
        return Array.from(markNodeKeys)
          .map((key) => {
            return $getNodeByKey(key)
          })
          .filter($isElementNode)
      })
    },
    [editor, markNodeMap],
  )

  useEffect(() => {
    return mergeRegister(
      application.eventBus.addEventCallback(() => {
        controller.getAllThreads().then(setThreads).catch(sendErrorMessage)
      }, CommentsEvent.CommentsChanged),
      application.eventBus.addEventCallback((data: CommentMarkNodeChangeData) => {
        const { markID } = data
        createMarkNodeForCurrentSelection(markID)
      }, CommentsEvent.CreateMarkNode),
      application.eventBus.addEventCallback((data: CommentMarkNodeChangeData) => {
        const { markID } = data
        removeMarkNode(markID)
      }, CommentsEvent.RemoveMarkNode),
      application.eventBus.addEventCallback((data: CommentMarkNodeChangeData) => {
        const { markID } = data
        resolveMarkNode(markID)
      }, CommentsEvent.ResolveMarkNode),
      application.eventBus.addEventCallback((data: CommentMarkNodeChangeData) => {
        const { markID } = data
        unresolveMarkNode(markID)
      }, CommentsEvent.UnresolveMarkNode),
    )
  }, [controller, application, createMarkNodeForCurrentSelection, removeMarkNode, resolveMarkNode, unresolveMarkNode])

  const containerElement = editor.getRootElement()?.parentElement

  return (
    <CommentsProvider
      value={{
        username,
        controller,
        removeMarkNode,
        activeIDs,
        markNodeMap,
        threadToFocus,
        setThreadToFocus,
        awarenessStates,
        getMarkNodes,
      }}
    >
      {showCommentInput &&
        createPortal(
          <CommentInputBox editor={editor} cancelAddComment={cancelAddComment} />,
          containerElement || document.body,
        )}
      {activeAnchorKey !== null &&
        activeAnchorKey !== undefined &&
        !showCommentInput &&
        isEditorEditable &&
        createPortal(
          <FloatingAddCommentButton anchorKey={activeAnchorKey} editor={editor} onAddComment={onAddComment} />,
          containerElement || document.body,
        )}
      {showCommentsPanel && <CommentsPanel threads={threads} setShowComments={setShowCommentsPanel} />}
      {activeThreads.length > 0 &&
        createPortal(<ContextualComments activeThreads={activeThreads} />, containerElement || document.body)}
    </CommentsProvider>
  )
}
