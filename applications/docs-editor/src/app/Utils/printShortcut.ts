import { isMac } from '@proton/shared/lib/helpers/browser'

/**
 * The browser's print shortcut: Cmd+P on macOS, Ctrl+P elsewhere. On layouts without Latin letters (Cyrillic,
 * Greek...) browsers still print with the key in P's place, so its `code` counts when its `key` isn't a Latin letter.
 * The client (`applications/docs`) keeps its own copy.
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
 * Chrome would print the focused frame, but Firefox and Safari print the client's page around this iframe, where the
 * editor is one box that can't split across pages.
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
