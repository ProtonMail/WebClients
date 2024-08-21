/**
 * If window.Android or window.webkit.messageHandlers.iOS are not null,
 * this means we are running inside the native Android or iOS app.
 * These values are injected by the native apps directly.
 */
export interface CustomWindow extends Window {
  Android?: unknown
  webkit?: {
    messageHandlers?: {
      iOS?: unknown
    }
  }
}
