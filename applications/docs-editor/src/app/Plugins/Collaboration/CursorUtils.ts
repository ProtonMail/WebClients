import type { Binding, UserState } from '@lexical/yjs'
import type { RelativePosition, AbsolutePosition } from 'yjs'
import { createAbsolutePositionFromRelativePosition } from 'yjs'

function createAbsolutePosition(relativePosition: RelativePosition, binding: Binding): AbsolutePosition | null {
  return createAbsolutePositionFromRelativePosition(relativePosition, binding.doc)
}

/**
 * Lexical does not export these types or guard functions so we
 * extract them from types that are exported.
 */

type AnyCollabNode = Binding['root']['_children'][0]
type CollabElementNode = Binding['root']
type CollabTextNode = Extract<AnyCollabNode, { _text: string }>

// Lexical does not export the `CollabElementNode` and `CollabTextNode`
// classes, which means we cannot use those with `instanceof` checks
// in these two typeguard functions. Instead we check for properties
// that are exclusive to those particular nodes. A strict instanceof
// check is not required in the contexts these functions are used
// where the nodes passed into these are always going to be some CollabNode
// and the properties we're checking only exist in the node we're checking for.
function isCollabElementNode(node: any): node is CollabElementNode {
  return '_children' in node
}
function isCollabTextNode(node: AnyCollabNode): node is CollabTextNode {
  return '_text' in node
}

function getCollabNodeAndOffset(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sharedType: any,
  offset: number,
): [null | AnyCollabNode, number] {
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
  node: AnyCollabNode | null
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

// Upstream change to expose this function has been merged (https://github.com/facebook/lexical/pull/6942)
// Once that is available in a release this code should be removed in favor of that
export function getAnchorAndFocusCollabNodesForUserState(binding: Binding, userState: UserState) {
  const { anchorPos, focusPos } = userState

  let anchorCollabNode: AnyCollabNode | null = null
  let anchorOffset = 0
  let focusCollabNode: AnyCollabNode | null = null
  let focusOffset = 0

  if (anchorPos !== null && focusPos !== null) {
    const anchorAbsPos = createAbsolutePosition(anchorPos, binding)
    const focusAbsPos = createAbsolutePosition(focusPos, binding)

    if (anchorAbsPos !== null && focusAbsPos !== null) {
      ;[anchorCollabNode, anchorOffset] = getCollabNodeAndOffset(anchorAbsPos.type, anchorAbsPos.index)
      ;[focusCollabNode, focusOffset] = getCollabNodeAndOffset(focusAbsPos.type, focusAbsPos.index)
    }
  }

  return {
    anchorCollabNode,
    anchorOffset,
    focusCollabNode,
    focusOffset,
  }
}
