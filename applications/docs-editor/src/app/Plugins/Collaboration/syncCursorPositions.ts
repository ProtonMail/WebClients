import type { Binding, Provider } from '@lexical/yjs'
import { getAnchorAndFocusCollabNodesForUserState } from '@lexical/yjs'
import type { NodeKey, NodeMap } from 'lexical'
import { $isLineBreakNode } from 'lexical'
import { createDOMRange } from '@lexical/selection'
import { isHTMLElement } from '../../Utils/guard'

// Forked and modified from https://github.com/facebook/lexical/blob/main/packages/lexical-yjs/src/SyncCursors.ts to have custom behavior.

type ExtractValueGenericFromMapType<Type> = Type extends Map<unknown, infer Value> ? Value : never
type Cursor = ExtractValueGenericFromMapType<Binding['cursors']>
type CursorSelection = NonNullable<Cursor['selection']>
type Point = CursorSelection['anchor']

function createCursor(name: string, color: string): Cursor {
  return {
    color: color,
    name: name,
    selection: null,
  }
}

const CaretShowNameTimeouts = new WeakMap<Element, number>()

function showCursorName(caret: Element) {
  caret.classList.add('show')
  const timeout = CaretShowNameTimeouts.get(caret)
  if (timeout) {
    clearTimeout(timeout)
  }
}

function hideCursorNameAfterTimeout(caret: Element) {
  CaretShowNameTimeouts.set(
    caret,
    window.setTimeout(() => {
      caret.classList.remove('show')
      CaretShowNameTimeouts.delete(caret)
    }, 1500),
  )
}

function onCaretPointerEnter(event: PointerEvent) {
  if (!isHTMLElement(event.target)) {
    return
  }
  const caret = event.target.closest('.Lexical__cursorCaret')
  if (!caret) {
    return
  }
  showCursorName(caret)
}

function onCaretPointerLeave(event: PointerEvent) {
  if (!isHTMLElement(event.target)) {
    return
  }
  const caret = event.target.closest('.Lexical__cursorCaret')
  if (!caret) {
    return
  }
  hideCursorNameAfterTimeout(caret)
}

function createCursorSelection(
  cursor: Cursor,
  anchorKey: NodeKey,
  anchorOffset: number,
  focusKey: NodeKey,
  focusOffset: number,
): CursorSelection {
  const color = cursor.color

  const caret = document.createElement('span')
  caret.classList.add('Lexical__cursorCaret')
  caret.style.cssText = `background-color:${color};`

  caret.addEventListener('pointerenter', onCaretPointerEnter)
  caret.addEventListener('pointerleave', onCaretPointerLeave)

  const caretHandle = document.createElement('span')
  caretHandle.classList.add('Lexical__cursorCaretHandle')

  const name = document.createElement('span')
  name.textContent = cursor.name
  name.classList.add('Lexical__cursorNamePopup')
  name.style.cssText = `background-color:${color};color:#fff;`

  caret.appendChild(caretHandle)
  caret.appendChild(name)

  return {
    anchor: {
      key: anchorKey,
      offset: anchorOffset,
    },
    caret,
    color,
    focus: {
      key: focusKey,
      offset: focusOffset,
    },
    name,
    selections: [],
  }
}

function destroyCursor(binding: Binding, cursor: Cursor) {
  const selection = cursor.selection
  if (selection !== null) {
    destroySelection(binding, selection)
  }
}

function destroySelection(binding: Binding, selection: CursorSelection) {
  const cursorsContainer = binding.cursorsContainer

  const caret = selection.caret
  caret.removeEventListener('pointerenter', onCaretPointerEnter)
  caret.removeEventListener('pointerleave', onCaretPointerLeave)

  if (cursorsContainer === null) {
    return
  }

  const selections = selection.selections
  const selectionsLength = selections.length

  for (let i = 0; i < selectionsLength; i++) {
    cursorsContainer.removeChild(selections[i])
  }
}

type AnchorAndFocusPoints = {
  anchor: Point
  focus: Point
}

function updateCursor(
  binding: Binding,
  cursor: Cursor,
  nextSelection: null | CursorSelection,
  nodeMap: NodeMap,
  prevPoints?: AnchorAndFocusPoints,
): void {
  const editor = binding.editor
  const rootElement = editor.getRootElement()
  const cursorsContainer = binding.cursorsContainer

  if (cursorsContainer === null || rootElement === null) {
    return
  }

  const cursorsContainerOffsetParent = cursorsContainer.offsetParent
  if (cursorsContainerOffsetParent === null) {
    return
  }

  const containerRect = cursorsContainerOffsetParent.getBoundingClientRect()
  const prevSelection = cursor.selection

  if (nextSelection === null) {
    if (prevSelection === null) {
      return
    } else {
      cursor.selection = null
      destroySelection(binding, prevSelection)
      return
    }
  } else {
    cursor.selection = nextSelection
  }

  const caret = nextSelection.caret
  const color = nextSelection.color
  const selections = nextSelection.selections

  const anchor = nextSelection.anchor
  const focus = nextSelection.focus
  const anchorKey = anchor.key
  const focusKey = focus.key
  const anchorOffset = anchor.offset
  const focusOffset = focus.offset
  const anchorNode = nodeMap.get(anchorKey)
  const focusNode = nodeMap.get(focusKey)

  if (anchorNode == null || focusNode == null) {
    return
  }
  let selectionRects: DOMRect[]

  // In the case of a collapsed selection on a linebreak, we need
  // to improvise as the browser will return nothing here as <br>
  // apparantly take up no visual space :/
  // This won't work in all cases, but it's better than just showing
  // nothing all the time.
  if (anchorNode === focusNode && $isLineBreakNode(anchorNode)) {
    const brRect = (editor.getElementByKey(anchorKey) as HTMLElement).getBoundingClientRect()
    selectionRects = [brRect]
  } else {
    const range = createDOMRange(editor, anchorNode, anchor.offset, focusNode, focus.offset)

    if (range === null) {
      return
    }

    selectionRects = Array.from(range.getClientRects())

    //sort rects from top left to bottom right.
    selectionRects.sort((a, b) => {
      const top = a.top - b.top
      // Some rects match position closely, but not perfectly,
      // so we give a 3px tolerance.
      if (Math.abs(top) <= 3) {
        return a.left - b.left
      }
      return top
    })

    let prevRect
    let selectionRectsLength = selectionRects.length
    for (let i = 0; i < selectionRectsLength; i++) {
      const selectionRect = selectionRects[i]

      // Exclude rects that overlap preceding Rects in the sorted list.
      const isOverlappingRect =
        prevRect &&
        prevRect.top <= selectionRect.top &&
        prevRect.top + prevRect.height > selectionRect.top &&
        prevRect.left + prevRect.width > selectionRect.left
      if (isOverlappingRect) {
        selectionRects.splice(i--, 1)
        selectionRectsLength--
        continue
      }

      prevRect = selectionRect
    }
  }

  const selectionsLength = selections.length
  const selectionRectsLength = selectionRects.length

  for (let i = 0; i < selectionRectsLength; i++) {
    const selectionRect = selectionRects[i]
    let selection = selections[i]

    if (selection === undefined) {
      selection = document.createElement('span')
      selections[i] = selection
      const selectionBg = document.createElement('span')
      selection.appendChild(selectionBg)
      cursorsContainer.appendChild(selection)
    }

    const top = selectionRect.top + (cursorsContainerOffsetParent.scrollTop - containerRect.top)
    const left = selectionRect.left
    const style = `position:absolute;top:${top}px;left:${left}px;height:${selectionRect.height}px;width:${selectionRect.width}px;pointer-events:none;z-index:5;`
    selection.style.cssText = style
    ;(selection.firstChild as HTMLSpanElement).style.cssText =
      `${style}left:0;top:0;background-color:${color};opacity:0.3;`

    if (i === selectionRectsLength - 1) {
      if (caret.parentNode !== selection) {
        selection.appendChild(caret)
      }

      if (prevPoints) {
        const prevAnchor = prevPoints.anchor
        const prevAnchorKey = prevAnchor.key
        const prevAnchorOffset = prevAnchor.offset
        const prevFocus = prevPoints.focus
        const prevFocusKey = prevFocus.key
        const prevFocusOffset = prevFocus.offset

        const hasChanged =
          anchorKey !== prevAnchorKey ||
          anchorOffset !== prevAnchorOffset ||
          focusKey !== prevFocusKey ||
          focusOffset !== prevFocusOffset

        if (hasChanged) {
          showCursorName(caret)
          hideCursorNameAfterTimeout(caret)
        }
      } else {
        showCursorName(caret)
        hideCursorNameAfterTimeout(caret)
      }
    }
  }

  for (let i = selectionsLength - 1; i >= selectionRectsLength; i--) {
    const selection = selections[i]
    cursorsContainer.removeChild(selection)
    selections.pop()
  }
}

export function syncCursorPositions(binding: Binding, provider: Provider) {
  const awarenessStates = Array.from(provider.awareness.getStates())
  const localClientID = binding.clientID
  const cursors = binding.cursors
  const editor = binding.editor
  const nodeMap = editor._editorState._nodeMap
  const visitedClientIDs = new Set()

  for (let i = 0; i < awarenessStates.length; i++) {
    const [clientID, awareness] = awarenessStates[i]

    if (clientID === localClientID) {
      continue
    }

    visitedClientIDs.add(clientID)

    const { name, color } = awareness

    let selection: CursorSelection | null = null

    let cursor = cursors.get(clientID)
    if (cursor === undefined) {
      cursor = createCursor(name, color)
      cursors.set(clientID, cursor)
    }

    const { anchorCollabNode, anchorOffset, focusCollabNode, focusOffset } = getAnchorAndFocusCollabNodesForUserState(
      binding,
      awareness,
    )

    let prevPoints: AnchorAndFocusPoints | undefined = undefined

    if (anchorCollabNode !== null && focusCollabNode !== null) {
      const anchorKey = anchorCollabNode.getKey()
      const focusKey = focusCollabNode.getKey()
      selection = cursor.selection

      if (selection === null) {
        selection = createCursorSelection(cursor, anchorKey, anchorOffset, focusKey, focusOffset)
      } else {
        const anchor = selection.anchor
        const focus = selection.focus

        prevPoints = {
          anchor: {
            key: anchor.key,
            offset: anchor.offset,
          },
          focus: {
            key: focus.key,
            offset: focus.offset,
          },
        }

        anchor.key = anchorKey
        anchor.offset = anchorOffset
        focus.key = focusKey
        focus.offset = focusOffset
      }
    }

    updateCursor(binding, cursor, selection, nodeMap, prevPoints)
  }

  const allClientIDs = Array.from(cursors.keys())

  for (let i = 0; i < allClientIDs.length; i++) {
    const clientID = allClientIDs[i]

    if (!visitedClientIDs.has(clientID)) {
      const cursor = cursors.get(clientID)

      if (cursor !== undefined) {
        destroyCursor(binding, cursor)
        cursors.delete(clientID)
      }
    }
  }
}
