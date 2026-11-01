import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'

import {
  getDocsLayoutScrollContainer,
  getGutterClickCaretProbePoint,
  isDocsLayoutGutterTarget,
  isOutsideClientArea,
} from '../Layout/docsLayoutUtils'

type CaretPosition = { node: Node; offset: number }

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

function placeCaretNearPoint(rootElement: HTMLElement, click: { x: number; y: number }, extendSelection: boolean) {
  rootElement.focus({ preventScroll: true })

  const probe = getGutterClickCaretProbePoint(click, rootElement.getBoundingClientRect())
  const caret = getCaretPositionFromPoint(probe.x, probe.y)
  if (!caret || !isSelectableEditorPosition(rootElement, caret.node)) {
    return
  }

  const selection = window.getSelection()
  if (!selection) {
    return
  }

  if (extendSelection && selection.rangeCount > 0 && rootElement.contains(selection.anchorNode)) {
    selection.extend(caret.node, caret.offset)
  } else {
    selection.collapse(caret.node, caret.offset)
  }
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
