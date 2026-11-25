import { useEffect } from 'react'

import { isMac } from '@proton/shared/lib/helpers/browser'

import { useEvent } from './misc'

/**
 * The browser's print shortcut: Cmd+P on macOS, Ctrl+P elsewhere. On layouts without Latin letters (Cyrillic,
 * Greek...) browsers still print with the key in P's place, so its `code` counts when its `key` isn't a Latin letter.
 */
export function isPrintShortcut(event: KeyboardEvent, onMac: boolean): boolean {
  const hasModifier = onMac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey
  if (!hasModifier || event.shiftKey || event.altKey) {
    return false
  }
  if (/^[a-z]$/i.test(event.key)) {
    return event.key.toLowerCase() === 'p'
  }
  return event.code === 'KeyP'
}

/**
 * Runs `print` instead of the browser's print on the print shortcut, until the returned function is called.
 * The browser would print this page, where the editor's iframe is one box that can't split across pages (Firefox,
 * Safari), so `print` should print from inside the editor, as Download → PDF does.
 */
export function listenForPrintShortcut(target: Window, print: () => void): () => void {
  const onMac = isMac()
  const onKeyDown = (event: KeyboardEvent) => {
    if (!isPrintShortcut(event, onMac)) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    if (!event.repeat) {
      print()
    }
  }
  target.addEventListener('keydown', onKeyDown, { capture: true })
  return () => target.removeEventListener('keydown', onKeyDown, { capture: true })
}

/**
 * Prints the document with `print` on Cmd/Ctrl+P while focus is outside the editor (header, panels). Pass
 * `undefined` while the editor can't print yet, to leave the shortcut to the browser. The editor handles the
 * shortcut itself while it has focus.
 */
export function usePrintShortcut(print: (() => void) | undefined) {
  const canPrint = print !== undefined
  const printWithLatest = useEvent(print)
  useEffect(() => {
    if (!canPrint) {
      return
    }
    return listenForPrintShortcut(window, printWithLatest)
  }, [canPrint, printWithLatest])
}
