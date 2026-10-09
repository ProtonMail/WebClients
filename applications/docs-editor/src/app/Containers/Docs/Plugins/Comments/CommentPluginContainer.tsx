import { useConfirmActionModal } from '@proton/components/components/confirmActionModal/ConfirmActionModal'
import type { NodeKey, RangeSelection } from 'lexical'
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { FloatingQuickActions } from './FloatingQuickActions'
import CommentsPanel from './CommentsPanel'
import type { CommentThreadInterface } from '@proton/docs-shared'
import { CommentThreadState } from '@proton/docs-shared'
import { INSERT_INLINE_COMMENT_COMMAND, SHOW_ALL_COMMENTS_COMMAND } from '../../Commands'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { CommentsProvider } from './CommentsContext'
import { ContextualComments } from './ContextualComments'
import { useDocsAwarenessStates } from './useDocsAwarenessStates'
import { KEYBOARD_SHORTCUT_COMMAND } from '../KeyboardShortcuts/Command'
import { useMarkNodesContext } from '../MarkNodesContext'
import { nonUndoableUpdate } from '../Collaboration/useYjsHistory'
import { useCustomCollaborationContext } from '../Collaboration/CustomCollaborationContext'
import { TYPING_STATUS_CHANGE_EVENT_COMMAND } from './CommentsPanelListThread'
import { registerCommentCutMove } from './registerCommentCutMove'
import { useRightPanelContext } from '../../../DocsLayout'
import { useDocsDependencies } from '../../DocsDependenciesProvider'

export default function CommentPlugin({
  userAddress,
  documentId,
  isSuggestionMode,
}: {
  userAddress: string
  documentId: string
  isSuggestionMode: boolean
}): JSX.Element {
  const {
    logger,
    reportError,
    comments: controller,
    userName,
    suggestionsEnabled,
    canEdit,
    canComment,
    languageCode,
    getDisplayNameForEmail,
  } = useDocsDependencies()
  const [editor] = useLexicalComposerContext()
  const { element: rightPanelElement } = useRightPanelContext()
  const isEditorEditable = useLexicalEditable()

  const collabContext = useCustomCollaborationContext()

  /** Top level comment only, not reply */
  const [currentCommentDraft, setCurrentCommentDraft] = useState<string | undefined>()

  const [threads, setThreads] = useState<CommentThreadInterface[]>([])
  const threadMarkIDs = useRef(new Set<string>())
  threadMarkIDs.current = new Set(threads.map((thread) => thread.markID).filter((id): id is string => !!id))

  useEffect(() => {
    if (!isSuggestionMode) {
      return registerCommentCutMove(editor, documentId, () => threadMarkIDs.current)
    }
  }, [editor, documentId, isSuggestionMode])

  const activeThreads = useMemo(() => {
    const activeThreads = threads.filter((thread) => thread.state === CommentThreadState.Active)
    return activeThreads
  }, [threads])

  useEffect(() => {
    controller.getAllThreads().then(setThreads).catch(reportError)
  }, [controller, reportError])

  const awarenessStates = useDocsAwarenessStates()

  const { markNodeMap, activeIDs, activeAnchorKey } = useMarkNodesContext()

  const [commentInputSelection, setCommentInputSelection] = useState<RangeSelection | undefined>()
  const [showCommentsPanel, setShowCommentsPanel] = useState(false)

  const [threadToFocus, setThreadToFocus] = useState<string | null>(null)

  useEffect(() => {
    if (!isEditorEditable && !currentCommentDraft) {
      setCommentInputSelection(undefined)
    }
  }, [isEditorEditable, currentCommentDraft])

  const cancelAddComment = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection()
      // Restore selection
      if (selection !== null) {
        selection.dirty = true
      }
    })
    setCommentInputSelection(undefined)
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
          for (let i = 0; i < ids.length; i++) {
            to.addID(ids[i])
          }
        },
      ),
      editor.registerMutationListener(CommentThreadMarkNode, (mutations) => {
        editor.getEditorState().read(() => {
          for (const [key, mutation] of mutations) {
            const node: null | CommentThreadMarkNode = $getNodeByKey(key)
            let markIDs: string[] = []

            if (mutation === 'destroyed') {
              markIDs = markNodeKeysToIDs.get(key) || []
            } else if ($isCommentThreadMarkNode(node)) {
              markIDs = node.getIDs()
            }

            for (let i = 0; i < markIDs.length; i++) {
              const id = markIDs[i]
              let markNodeKeys = markNodeMap.get(id)
              markNodeKeysToIDs.set(key, markIDs)

              if (mutation === 'destroyed') {
                if (markNodeKeys !== undefined) {
                  markNodeKeys.delete(key)
                  if (markNodeKeys.size === 0) {
                    markNodeMap.delete(id)
                  }
                }
                continue
              }

              if (markNodeKeys === undefined) {
                markNodeKeys = new Set()
                markNodeMap.set(id, markNodeKeys)
              }

              if (!markNodeKeys.has(key)) {
                markNodeKeys.add(key)
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
          setShowCommentsPanel(false)
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) {
            return true
          }
          setCommentInputSelection(selection.clone())
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        SHOW_ALL_COMMENTS_COMMAND,
        () => {
          setShowCommentsPanel((show) => !show)
          setCommentInputSelection(undefined)
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
      nonUndoableUpdate(editor, collabContext.undoManager, () => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          const isBackward = selection.isBackward()
          $wrapSelectionInCommentThreadMarkNode(selection, isBackward, id)
        }
      })
    },
    [collabContext.undoManager, editor],
  )

  const removeMarkNode = useCallback(
    (markID: string) => {
      const markNodeKeys = markNodeMap.get(markID)
      if (markNodeKeys !== undefined) {
        // Do async to avoid causing a React infinite loop
        setTimeout(() => {
          nonUndoableUpdate(editor, collabContext.undoManager, () => {
            for (const key of markNodeKeys) {
              const node: CommentThreadMarkNode | null = $getNodeByKey(key)
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
    [collabContext.undoManager, editor, markNodeMap],
  )

  const resolveMarkNode = useCallback(
    (markID: string) => {
      const markNodeKeys = markNodeMap.get(markID)
      if (markNodeKeys !== undefined) {
        nonUndoableUpdate(editor, collabContext.undoManager, () => {
          for (const key of markNodeKeys) {
            const node: CommentThreadMarkNode | null = $getNodeByKey(key)
            if ($isCommentThreadMarkNode(node)) {
              const nodeMarkIDs = node.getIDs()
              if (markNodeKeys.size === 1 && !nodeMarkIDs.includes(markID)) {
                continue
              }
              if (markNodeKeys.size > 1 && !nodeMarkIDs.every((id) => id === markID)) {
                continue
              }
              node.setResolved(true)
            }
          }
        })
      }
    },
    [collabContext.undoManager, editor, markNodeMap],
  )

  const unresolveMarkNode = useCallback(
    (markID: string) => {
      const markNodeKeys = markNodeMap.get(markID)
      if (markNodeKeys !== undefined) {
        nonUndoableUpdate(editor, collabContext.undoManager, () => {
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
    [collabContext.undoManager, editor, markNodeMap],
  )

  useEffect(
    function handleInvalidMarkNodeStates() {
      if (!isEditorEditable || threads.length === 0) {
        return
      }
      editor.read(() => {
        for (let i = 0; i < threads.length; i++) {
          const thread = threads[i]
          const markNodeKeys = markNodeMap.get(thread.markID)
          if (!markNodeKeys || markNodeKeys.size === 0) {
            continue
          }
          for (const key of markNodeKeys) {
            const node = $getNodeByKey(key)
            if (!$isCommentThreadMarkNode(node)) {
              continue
            }
            const isThreadResolved = thread.state === CommentThreadState.Resolved
            if (node.getResolved() !== isThreadResolved) {
              nonUndoableUpdate(editor, collabContext.undoManager, () => {
                node.setResolved(isThreadResolved)
              })
            }
          }
        }
      })
    },
    [collabContext.undoManager, editor, isEditorEditable, markNodeMap, threads],
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
    return controller.subscribeToEvents((event) => {
      switch (event.type) {
        case 'changed':
          controller.getAllThreads().then(setThreads).catch(reportError)
          break
        case 'create-mark':
          createMarkNodeForCurrentSelection(event.markID)
          break
        case 'remove-mark':
          removeMarkNode(event.markID)
          break
        case 'resolve-mark':
          resolveMarkNode(event.markID)
          break
        case 'unresolve-mark':
          unresolveMarkNode(event.markID)
          break
        case 'typing':
          editor.dispatchCommand(TYPING_STATUS_CHANGE_EVENT_COMMAND, { threadId: event.threadId })
          break
      }
    })
  }, [
    controller,
    reportError,
    createMarkNodeForCurrentSelection,
    removeMarkNode,
    resolveMarkNode,
    unresolveMarkNode,
    editor,
  ])

  const layoutContainerElement = editor.getRootElement()?.closest('.docs-layout-container')

  const [confirmModal, showConfirmModal] = useConfirmActionModal()

  return (
    <CommentsProvider
      value={{
        userAddress,
        removeMarkNode,
        activeIDs,
        markNodeMap,
        threadToFocus,
        setThreadToFocus,
        awarenessStates,
        getMarkNodes,
        showConfirmModal,
        commentInputSelection,
        cancelAddComment,
        setCurrentCommentDraft,
        createCommentThread: controller.createCommentThread.bind(controller),
        canEdit,
        canComment,
        languageCode,
        logger,
        userName,
        suggestionsEnabled,
        getDisplayNameForEmail,
        acceptSuggestion: controller.acceptSuggestion.bind(controller),
        rejectSuggestion: controller.rejectSuggestion.bind(controller),
        deleteThread: controller.deleteThread.bind(controller),
        editComment: controller.editComment.bind(controller),
        deleteComment: controller.deleteComment.bind(controller),
        resolveThread: controller.resolveThread.bind(controller),
        unresolveThread: controller.unresolveThread.bind(controller),
        beganTypingInThread: controller.beganTypingInThread.bind(controller),
        stoppedTypingInThread: controller.stoppedTypingInThread.bind(controller),
        markThreadAsRead: controller.markThreadAsRead.bind(controller),
        getTypersExcludingSelf: controller.getTypersExcludingSelf.bind(controller),
        createComment: controller.createComment.bind(controller),
      }}
    >
      {confirmModal}
      {activeAnchorKey !== null &&
        activeAnchorKey !== undefined &&
        commentInputSelection === undefined &&
        isEditorEditable &&
        rightPanelElement &&
        createPortal(
          <FloatingQuickActions anchorKey={activeAnchorKey} editor={editor} onAddComment={onAddComment} />,
          rightPanelElement,
        )}
      {showCommentsPanel &&
        createPortal(
          <CommentsPanel threads={threads} setShowComments={setShowCommentsPanel} />,
          layoutContainerElement || document.body,
        )}
      {(activeThreads.length > 0 || commentInputSelection !== undefined) &&
        !showCommentsPanel &&
        rightPanelElement &&
        createPortal(<ContextualComments activeThreads={activeThreads} />, rightPanelElement)}
    </CommentsProvider>
  )
}
