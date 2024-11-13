import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import type { ElementNode } from 'lexical'
import { $getSelection, $isElementNode, $isRangeSelection, $isTextNode, type NodeKey } from 'lexical'
import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { $getCommentThreadMarkIDs } from './Comments/CommentThreadMarkNode'
import { $getSuggestionID } from './Suggestions/Utils'
import type { ProtonNode } from './Suggestions/ProtonNode'
import { $isSuggestionThatAffectsWholeParent } from './Suggestions/Types'

export type MarkNodeMap = Map<string, Set<NodeKey>>

type MarkNodesContextValue = {
  markNodeMap: MarkNodeMap
  activeAnchorKey: NodeKey | null
  activeIDs: string[]
}

const MarkNodesContext = createContext<MarkNodesContextValue | null>(null)

/**
 * MarkNodesContext stores a map of comment/suggestion IDs to their set of
 * respective nodes' keys. It also stores the active IDs and the key of the
 * active anchor node.
 */
export const useMarkNodesContext = () => {
  const context = useContext(MarkNodesContext)
  if (!context) {
    throw new Error('useCommentsContext must be used within a CommentsProvider')
  }
  return context
}

export function MarkNodesProvider({ children }: { children: ReactNode }) {
  const [editor] = useLexicalComposerContext()

  const markNodeMap = useMemo<Map<string, Set<NodeKey>>>(() => {
    return new Map()
  }, [])

  const [activeAnchorKey, setActiveAnchorKey] = useState<NodeKey | null>(null)
  const [activeIDs, setActiveIDs] = useState<string[]>([])

  useEffect(
    /**
     * Adds a "selected" classname to all of the mark
     * nodes associated with the currently active ID(s)
     */
    function addClassToActiveMarkNodes() {
      const changedElements: HTMLElement[] = []
      for (let i = 0; i < activeIDs.length; i++) {
        const id = activeIDs[i]
        const keys = markNodeMap.get(id)
        if (!keys) {
          continue
        }
        for (const key of keys) {
          const element = editor.getElementByKey(key)
          if (!element) {
            continue
          }
          element.classList.add('selected')
          changedElements.push(element)
        }
      }
      return () => {
        for (let i = 0; i < changedElements.length; i++) {
          const changedElem = changedElements[i]
          changedElem.classList.remove('selected')
        }
      }
    },
    [activeIDs, editor, markNodeMap],
  )

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(
        /**
         * Gets current active ID(s) and anchor key based on the
         * latest selection's anchor node.
         */
        function getActiveIDsAndAnchorKey({ editorState }) {
          editorState.read(() => {
            const selection = $getSelection()
            let hasActiveIds = false
            let hasAnchorKey = false

            if ($isRangeSelection(selection)) {
              const anchorNode = selection.anchor.getNode()

              let suggestionThatAffectsWholeNode: ProtonNode | undefined

              if ($isElementNode(anchorNode) && !anchorNode.isInline()) {
                const siblings = anchorNode.getParent()?.getChildren()
                suggestionThatAffectsWholeNode = siblings?.find($isSuggestionThatAffectsWholeParent)
              }

              const nonInlineParent = $findMatchingParent(
                anchorNode,
                (node): node is ElementNode => $isElementNode(node) && !node.isInline(),
              )
              if (nonInlineParent) {
                const children = nonInlineParent.getChildren()
                suggestionThatAffectsWholeNode = children.find($isSuggestionThatAffectsWholeParent)

                if (!suggestionThatAffectsWholeNode) {
                  const siblings = nonInlineParent.getParent()?.getChildren()
                  suggestionThatAffectsWholeNode = siblings?.find($isSuggestionThatAffectsWholeParent)
                }
              }

              if (suggestionThatAffectsWholeNode) {
                setActiveIDs([suggestionThatAffectsWholeNode.getSuggestionIdOrThrow()])
                hasActiveIds = true
              }

              if ($isTextNode(anchorNode)) {
                const commentIDs = $getCommentThreadMarkIDs(anchorNode, selection.anchor.offset)
                if (commentIDs === null) {
                  const suggestionID = $getSuggestionID(anchorNode, selection.anchor.offset)
                  if (suggestionID) {
                    setActiveIDs([suggestionID])
                    hasActiveIds = true
                  }
                } else {
                  setActiveIDs(commentIDs)
                  hasActiveIds = true
                }
                if (!selection.isCollapsed()) {
                  setActiveAnchorKey(anchorNode.getKey())
                  hasAnchorKey = true
                }
              }
            }
            if (!hasActiveIds) {
              setActiveIDs((_activeIds) => (_activeIds.length === 0 ? _activeIds : []))
            }
            if (!hasAnchorKey) {
              setActiveAnchorKey(null)
            }
          })
        },
      ),
    )
  }, [editor])

  return (
    <MarkNodesContext.Provider
      value={{
        markNodeMap,
        activeAnchorKey,
        activeIDs,
      }}
    >
      {children}
    </MarkNodesContext.Provider>
  )
}
