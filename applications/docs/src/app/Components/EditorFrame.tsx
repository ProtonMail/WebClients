import type { EditorSystemMode } from '@proton/docs-shared'
import {
  BridgeOriginProvider,
  EDITOR_IFRAME_FOCUS_EVENT,
  EDITOR_READY_POST_MESSAGE_EVENT,
  EDITOR_TAG_INFO_EVENT,
  EDITOR_REQUESTS_TOTAL_CLIENT_RELOAD,
} from '@proton/docs-shared'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { versionCookieAtLoad } from '@proton/components/helpers/versionCookie'

type Props = {
  onFrameReady: (frame: HTMLIFrameElement) => void
  systemMode: EditorSystemMode
}

function GetEditorUrl(systemMode: EditorSystemMode) {
  const url = new URL(BridgeOriginProvider.GetEditorOrigin())

  url.searchParams.set('mode', systemMode)

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

export function EditorFrame({ onFrameReady, systemMode }: Props) {
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null)
  /**
   * The URL cannot change once initially set, since reloading just the editor iframe is disallowed,
   * as it would require many other classes (like DocController) to re-send the document state
   */
  const url = useMemo(() => GetEditorUrl(systemMode), [systemMode])
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

  useEffect(() => {
    const eventListener = (event: MessageEvent) => {
      if (!iframe) {
        return
      }

      if (event.source !== iframe.contentWindow) {
        return
      }

      if (event.data === EDITOR_REQUESTS_TOTAL_CLIENT_RELOAD) {
        window.location.reload()
        return
      }

      if (event.data === EDITOR_READY_POST_MESSAGE_EVENT) {
        onReady()

        iframe.contentWindow?.postMessage(
          {
            type: EDITOR_TAG_INFO_EVENT,
            versionCookieAtLoad,
          },
          BridgeOriginProvider.GetEditorOrigin(),
        )
      }

      if (event.data === EDITOR_IFRAME_FOCUS_EVENT) {
        document.dispatchEvent(new CustomEvent('dropdownclose'))
      }
    }

    window.addEventListener('message', eventListener)

    return () => {
      window.removeEventListener('message', eventListener)
    }
  }, [iframe, onReady])

  return (
    <iframe
      id="editor-frame"
      title="Docs Editor"
      src={url}
      style={{ width: '100%', height: '100%' }}
      ref={setIframe}
      sandbox={SANDBOX_OPTIONS}
      allow="clipboard-write"
    ></iframe>
  )
}
