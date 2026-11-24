/** The app version the sidebar shows beside the storage, as the host computes it for Proton's `AppVersion`. */
export type HomepageAppVersion = {
  /** The version shown, e.g. `5.0.1`. */
  version: string
  /** The version copied to the clipboard, e.g. `5.0.1+abc123`. */
  fullVersion: string
  /** The early access environment's mark (`α`, `β`, `δ`), shown after both. */
  earlyAccessMark?: string
}

/** `textToClipboard` of `@proton/shared/lib/helpers/browser`: copies, then gives the focus back. */
export function copyToClipboard(text: string) {
  const previouslyFocused = document.activeElement
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {})
  } else {
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    textarea.value = text
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
  if (previouslyFocused instanceof HTMLElement) {
    previouslyFocused.focus()
  }
}
