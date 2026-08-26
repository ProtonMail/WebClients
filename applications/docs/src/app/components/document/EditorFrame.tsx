import type { EditorSystemMode, DocumentType } from '@proton/docs-shared'
import {
  BridgeOriginProvider,
  EDITOR_IFRAME_FOCUS_EVENT,
  EDITOR_READY_POST_MESSAGE_EVENT,
  EDITOR_TAG_INFO_EVENT,
  EDITOR_REQUESTS_TOTAL_CLIENT_RELOAD,
  EDITOR_CONFIRMS_VERSIONS_MATCH,
} from '@proton/docs-shared'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { versionCookieAtLoad } from '@proton/components/helpers/versionCookie'
import type { LoggerInterface } from '@proton/utils/logs'
import OpenTracer from '@proton/docs-shared/lib/Tracer/Module'
import { getCookie } from '@proton/shared/lib/helpers/cookies'

// normalize 'default' tag to undefined, only pass valid early access tags
const earlyAccessTag =
  versionCookieAtLoad === 'alpha' || versionCookieAtLoad === 'beta' ? versionCookieAtLoad : undefined

function getEditorUrl(systemMode: EditorSystemMode, documentType: DocumentType) {
  const url = new URL(BridgeOriginProvider.GetEditorOrigin())

  url.searchParams.set('type', documentType)
  url.searchParams.set('mode', systemMode)
  if (earlyAccessTag) {
    url.searchParams.set('tag', earlyAccessTag)
  }

  return url.toString()
}

/**
 * allow-scripts: required for the editor to load JS
 * allow-same-origin: required for the editor to load CSS
 * allow-forms: required for the editor to submit forms
 * allow-downloads: required for downloading customer support logs
 * allow-modals: required for the editor to open modals (e.g. print dialog)
 */
const SANDBOX_OPTIONS = 'allow-scripts allow-same-origin allow-forms allow-downloads allow-modals'

export type EditorFrameProps = {
  onFrameReady: (frame: HTMLIFrameElement) => void
  documentType?: DocumentType
  systemMode: EditorSystemMode
  logger: LoggerInterface
}

export function EditorFrame({ onFrameReady, documentType = 'doc', systemMode, logger }: EditorFrameProps) {
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null)
  /**
   * The URL cannot change once initially set, since reloading just the editor iframe is disallowed,
   * as it would require many other classes (like DocController) to re-send the document state
   */
  const url = useMemo(() => getEditorUrl(systemMode, documentType), [documentType, systemMode])
  const initialUrlRef = useRef(url)
  const didAlreadyLoad = useRef(false)

  useEffect(() => {
    if (url !== initialUrlRef.current) {
      throw new Error('URL cannot be changed after initial render')
    }
  }, [url])

  const onReady = useCallback(() => {
    if (!iframe) {
      throw new Error('Frame not found')
    }

    if (didAlreadyLoad.current) {
      return
    }

    didAlreadyLoad.current = true

    onFrameReady(iframe)

    iframe.contentWindow?.focus()
  }, [iframe, onFrameReady])

  const handleContentWindowReady = useCallback((contentWindow: Window) => {
    void OpenTracer.trace('boot_editor_frame_editor_content_window_ready_cookie_shell', {
      cookieAtLoad: versionCookieAtLoad,
      cookieLive: getCookie('Tag'),
    })

    contentWindow.postMessage(
      {
        type: EDITOR_TAG_INFO_EVENT,
        versionCookieAtLoad: earlyAccessTag,
      },
      BridgeOriginProvider.GetEditorOrigin(),
    )
  }, [])

  useEffect(() => {
    let pollTimeoutId: ReturnType<typeof setTimeout> | null = null

    const eventListener = (event: MessageEvent) => {
      if (!iframe) {
        return
      }

      if (event.source !== iframe.contentWindow) {
        return
      }

      if (typeof event.data === 'object' && event.data?.type === EDITOR_REQUESTS_TOTAL_CLIENT_RELOAD) {
        logger.info('Editor requested client reload')
        void OpenTracer.trace('boot_editor_frame_editor_requested_client_reload', {
          ...event.data,
          cookieAtLoad: versionCookieAtLoad,
          cookieLive: getCookie('Tag'),
        })
          .catch(() => {
            logger.error('Error tracing editor requested client reload')
          })
          .finally(() => {
            window.location.reload()
          })
        return
      }

      if (event.data === EDITOR_CONFIRMS_VERSIONS_MATCH) {
        logger.info('Editor confirms versions match')
        onReady()
        return
      }

      if (event.data === EDITOR_READY_POST_MESSAGE_EVENT) {
        logger.info('Editor ready event received')

        /**
         * In Sentry we see instances where the editor ready event is received, but contentWindow is still null.
         * Given that we cannot communicate with the editor at all until contentWindow is ready, we poll until it is ready.
         */
        const MAX_POLLING_TIME = 10_000 // 10 seconds
        const startTime = Date.now()

        const pollForContentWindow = () => {
          if (!iframe.contentWindow) {
            if (Date.now() - startTime > MAX_POLLING_TIME) {
              logger.error(`${systemMode} editor contentWindow not available after 10 seconds of polling; restarting`)
              void OpenTracer.trace('boot_editor_frame_editor_content_window_not_available')
              window.location.reload()
              return
            }

            logger.warn(`${systemMode} editor contentWindow not ready, polling...`)
            pollTimeoutId = setTimeout(pollForContentWindow, 10)
            return
          }

          handleContentWindowReady(iframe.contentWindow)
        }

        pollForContentWindow()
      }

      if (event.data === EDITOR_IFRAME_FOCUS_EVENT) {
        document.dispatchEvent(new CustomEvent('dropdownclose'))
      }
    }

    window.addEventListener('message', eventListener)

    return () => {
      window.removeEventListener('message', eventListener)
      if (pollTimeoutId) {
        clearTimeout(pollTimeoutId)
      }
    }
  }, [iframe, logger, onReady, handleContentWindowReady, systemMode])

  return (
    <iframe
      id="editor-frame"
      title="Docs Editor"
      src={url}
      style={{ width: '100%', height: '100%' }}
      ref={setIframe}
      sandbox={SANDBOX_OPTIONS}
      allow="clipboard-write; clipboard-read"
      data-testid={`editor-frame-${systemMode}`}
    ></iframe>
  )
}
