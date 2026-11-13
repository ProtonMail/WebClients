type NativeMobileWindow = Window & { Android?: unknown; webkit?: { messageHandlers?: { iOS?: unknown } } }

/**
 * Whether the page runs in the Android or iOS app's webview. Adapted from
 * `packages/docs-core/lib/Bridge/EditorToClientRequestHandler.ts`, its `getAppPlatform`.
 */
export function isRunningInNativeMobileWeb(): boolean {
  const { Android, webkit } = window as NativeMobileWindow
  return Android != null || webkit?.messageHandlers?.iOS != null
}
