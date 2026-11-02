import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'

import {
  clampToContentBoxX,
  getDocsLayoutScrollContainer,
  getGutterClickCaretProbePoint,
  isDocsLayoutGutterTarget,
  isOutsideClientArea,
} from '../Layout/docsLayoutUtils'

type CaretPosition = { node: Node; offset: number }
type Point = { x: number; y: number }

/**
 * Clicking the empty space beside the document places the caret on the closest line, as if the
 * click had landed at the edge of the text, instead of taking focus away from the editor.
 */
export function GutterClickPlugin({ isEditorHidden }: { isEditorHidden: boolean }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (isEditorHidden) {
      return
    }

    let removeMouseDownListener: (() => void) | undefined

    const unregisterRootListener = editor.registerRootListener((rootElement) => {
      removeMouseDownListener?.()
      removeMouseDownListener = undefined

      const layoutGrid = getDocsLayoutScrollContainer(rootElement)
      if (!rootElement || !layoutGrid) {
        return
      }

      const handleMouseDown = (event: MouseEvent) => {
        if (event.button !== 0 || !isDocsLayoutGutterTarget(event.target) || !editor.isEditable()) {
          return
        }

        // The layout grid is the scroll container: clicks on its scrollbar target the grid too.
        if (isOutsideClientArea(event, event.target as Element)) {
          return
        }

        // Prevents the browser from moving focus out of the editor.
        event.preventDefault()
        placeCaretNearPoint(rootElement, { x: event.clientX, y: event.clientY }, event.shiftKey)
      }

      layoutGrid.addEventListener('mousedown', handleMouseDown)
      removeMouseDownListener = () => layoutGrid.removeEventListener('mousedown', handleMouseDown)
    })

    return () => {
      unregisterRootListener()
      removeMouseDownListener?.()
    }
  }, [editor, isEditorHidden])

  return null
}

function placeCaretNearPoint(rootElement: HTMLElement, click: Point, extendSelection: boolean) {
  rootElement.focus({ preventScroll: true })

  const selection = window.getSelection()
  if (!selection) {
    return
  }

  const editorRect = rootElement.getBoundingClientRect()
  const caret = getCaretNearEditorEdge(rootElement, editorRect, click)
  if (!caret) {
    return
  }

  const extend = extendSelection && selection.rangeCount > 0 && rootElement.contains(selection.anchorNode)

  // Where a paragraph wraps, the end of a line and the start of the next one are the same DOM position,
  // and a caret placed there shows at the start of the next line. So for a click past the end of a line,
  // place the caret at the start of that line, then let the browser move it to the end of the same line.
  // The start of the line is taken in the clicked block, so in a table row it is the last cell's.
  const block = getBlockContainer(caret.node)
  if (block && isPastLineEnd(click, editorRect, block) && typeof selection.modify === 'function') {
    const blockRect = block.getBoundingClientRect()
    const lineStartEdge = { x: click.x > editorRect.right ? blockRect.left : blockRect.right, y: click.y }
    const lineStart = getCaretNearEditorEdge(rootElement, editorRect, lineStartEdge)
    if (lineStart && getBlockContainer(lineStart.node) === block) {
      setSelectionFocus(selection, lineStart, extend)
      selection.modify(extend ? 'extend' : 'move', 'forward', 'lineboundary')
      return
    }
  }

  setSelectionFocus(selection, caret, extend)
}

/** The caret position on the line at `point`'s height, on the side of the editor closest to `point`. */
function getCaretNearEditorEdge(rootElement: HTMLElement, editorRect: DOMRect, point: Point): CaretPosition | null {
  const probe = moveProbeOntoText(rootElement, getGutterClickCaretProbePoint(point, editorRect))
  const caret = getCaretPositionFromPoint(probe.x, probe.y)
  return caret && isSelectableEditorPosition(rootElement, caret.node) ? caret : null
}

/** Moves the probe past the padding of the blocks under it, nested ones included (a list in a quote...). */
function moveProbeOntoText(rootElement: HTMLElement, probe: Point): Point {
  for (let depth = 0; depth < 8; depth++) {
    // Skips overlays drawn above the editor, such as the table column resizer.
    const element = document.elementsFromPoint(probe.x, probe.y).find((candidate) => rootElement.contains(candidate))
    if (!element) {
      break
    }

    const x = clampToContentBoxX(probe.x, element.getBoundingClientRect(), getComputedStyle(element))
    if (x === probe.x) {
      break
    }
    probe = { x, y: probe.y }
  }

  return probe
}

function setSelectionFocus(selection: Selection, caret: CaretPosition, extend: boolean) {
  if (extend) {
    selection.extend(caret.node, caret.offset)
  } else {
    selection.collapse(caret.node, caret.offset)
  }
}

/** The closest ancestor not laid out inline: the paragraph, list item, table cell... holding the node. */
function getBlockContainer(node: Node): Element | null {
  let element = node instanceof Element ? node : node.parentElement
  while (element && getComputedStyle(element).display.startsWith('inline')) {
    element = element.parentElement
  }
  return element
}

/** Whether the click is beside the side of the editor where the block's lines end: the right in left-to-right text. */
function isPastLineEnd(click: Point, editorRect: DOMRect, block: Element): boolean {
  return getComputedStyle(block).direction === 'rtl' ? click.x < editorRect.left : click.x > editorRect.right
}

function getCaretPositionFromPoint(x: number, y: number): CaretPosition | null {
  if (typeof document.caretPositionFromPoint === 'function') {
    const position = document.caretPositionFromPoint(x, y)
    return position ? { node: position.offsetNode, offset: position.offset } : null
  }

  // Safari before 18.4 only has the WebKit API.
  if (typeof document.caretRangeFromPoint === 'function') {
    const range = document.caretRangeFromPoint(x, y)
    return range ? { node: range.startContainer, offset: range.startOffset } : null
  }

  return null
}

// Decorator nodes (images, page breaks...) are not editable; a caret inside them would confuse Lexical.
function isSelectableEditorPosition(rootElement: HTMLElement, node: Node): boolean {
  if (!rootElement.contains(node)) {
    return false
  }

  const element = node instanceof Element ? node : node.parentElement
  const nonEditableAncestor = element?.closest('[contenteditable="false"]')
  return !nonEditableAncestor || !rootElement.contains(nonEditableAncestor)
}
