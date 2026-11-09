type NativeMobileWindow = Window & { Android?: unknown; webkit?: { messageHandlers?: { iOS?: unknown } } }

/** Whether the page runs in the Android or iOS app's webview, as docs-core `Bridge/EditorToClientRequestHandler.ts` tells. */
export function isRunningInNativeMobileWeb(): boolean {
  const { Android, webkit } = window as NativeMobileWindow
  return Android != null || webkit?.messageHandlers?.iOS != null
}
