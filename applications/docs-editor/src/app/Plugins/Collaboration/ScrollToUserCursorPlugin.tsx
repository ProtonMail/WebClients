import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useApplication } from '../../Containers/ApplicationProvider'
import { useEffect } from 'react'
import type { AbsolutePosition, RelativePosition } from 'yjs'
import { createAbsolutePositionFromRelativePosition } from 'yjs'
import type { Binding } from '@lexical/yjs'

/**
 * On a `ScrollToUserCursorData` event call, it will use the passed
 * user state to get the user's selection and scroll to it.
 *
 * This file re-implements some functions that @lexical/yjs does not
 * export. Plan is to contribute to upstream a way to expose this
 * functionality without needing to expose library internals.
 *
 * We have to use this method instead of just finding the cursor element
 * in the DOM because:
 * 1. we don't have control over the rendered cursor element, so we cannot
 * attach info to it that could be used to find it.
 * 2. cursors are absolutely positioned outside the editor's scroll container
 * so trying to scroll it into view might not work.
 */
export function useScrollToUserCursorOnEvent(binding: Binding) {
  const { application } = useApplication()
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return application.syncedState.subscribeToEvent('ScrollToUserCursorData', (data) => {
      const { anchorPos, focusPos } = data.state

      let anchorAbsPos: AbsolutePosition | null = null
      let focusAbsPos: AbsolutePosition | null = null

      if (anchorPos !== null && focusPos !== null) {
        anchorAbsPos = createAbsolutePosition(anchorPos, binding)
        focusAbsPos = createAbsolutePosition(focusPos, binding)
      }

      if (anchorAbsPos !== null && focusAbsPos !== null) {
        const [anchorCollabNode] = getCollabNodeAndOffset(anchorAbsPos.type, anchorAbsPos.index)
        const [focusCollabNode] = getCollabNodeAndOffset(focusAbsPos.type, focusAbsPos.index)

        if (anchorCollabNode !== null && focusCollabNode !== null) {
          const anchorKey = anchorCollabNode.getKey()
          const focusKey = focusCollabNode.getKey()

          const element = editor.getElementByKey(focusKey) || editor.getElementByKey(anchorKey)
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
            })
          }
        }
      }
    })
  }, [application.syncedState, binding, editor])

  return null
}

function createAbsolutePosition(relativePosition: RelativePosition, binding: Binding): AbsolutePosition | null {
  return createAbsolutePositionFromRelativePosition(relativePosition, binding.doc)
}

/**
 * Lexical does not export these types or guard functions so we
 * extract them from types that are exported.
 */

type CollabNode = Binding['root']['_children'][0]
type CollabElementNode = Binding['root']
type CollabTextNode = Extract<CollabNode, { _text: string }>

function isCollabElementNode(node: any): node is CollabElementNode {
  return node.constructor.name === 'CollabElementNode' && '_children' in node
}

function isCollabTextNode(node: CollabNode): node is CollabTextNode {
  return node.constructor.name === 'CollabTextNode' && '_text' in node
}

function getCollabNodeAndOffset(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sharedType: any,
  offset: number,
): [null | CollabNode, number] {
  const collabNode = sharedType._collabNode

  if (collabNode === undefined) {
    return [null, 0]
  }

  if (isCollabElementNode(collabNode)) {
    const { node, offset: collabNodeOffset } = getPositionFromElementAndOffset(collabNode, offset, true)

    if (node === null) {
      return [collabNode, 0]
    } else {
      return [node, collabNodeOffset]
    }
  }

  return [null, 0]
}

function getPositionFromElementAndOffset(
  node: CollabElementNode,
  offset: number,
  boundaryIsEdge: boolean,
): {
  length: number
  node: CollabNode | null
  nodeIndex: number
  offset: number
} {
  let index = 0
  let i = 0
  const children = node._children
  const childrenLength = children.length

  for (; i < childrenLength; i++) {
    const child = children[i]
    const childOffset = index
    const size = child.getSize()
    index += size
    const exceedsBoundary = boundaryIsEdge ? index >= offset : index > offset

    if (exceedsBoundary && isCollabTextNode(child)) {
      let textOffset = offset - childOffset - 1

      if (textOffset < 0) {
        textOffset = 0
      }

      const diffLength = index - offset
      return {
        length: diffLength,
        node: child,
        nodeIndex: i,
        offset: textOffset,
      }
    }

    if (index > offset) {
      return {
        length: 0,
        node: child,
        nodeIndex: i,
        offset: childOffset,
      }
    } else if (i === childrenLength - 1) {
      return {
        length: 0,
        node: null,
        nodeIndex: i + 1,
        offset: childOffset + 1,
      }
    }
  }

  return {
    length: 0,
    node: null,
    nodeIndex: 0,
    offset: 0,
  }
}
