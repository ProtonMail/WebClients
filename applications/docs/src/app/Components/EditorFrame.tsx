import { useCallback, useEffect, useState } from 'react'

type Props = {
  onFrameReady: (frame: HTMLIFrameElement) => void
  isViewOnly?: boolean
}

function getEditorUrl(isViewOnly = false) {
  const url = new URL(window.location.origin.replace('docs', 'docs-editor'))
  if (isViewOnly) {
    url.searchParams.set('viewOnly', 'true')
  }
  return url.toString()
}

/**
 * allow-scripts: required for the editor to load JS
 * allow-same-origin: required for the editor to load CSS
 * allow-forms: required for the editor to submit forms
 */
const SANDBOX_OPTIONS = 'allow-scripts allow-same-origin allow-forms'

export function EditorFrame({ onFrameReady, isViewOnly = false }: Props) {
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null)

  useEffect(() => {
    if (!iframe) {
      return
    }

    onFrameReady(iframe)
  }, [iframe, onFrameReady])

  const onLoad = useCallback(() => {
    if (!iframe) {
      throw new Error('Frame not found')
    }

    onFrameReady(iframe)
  }, [iframe, onFrameReady])

  return (
    <iframe
      title="Docs Editor"
      src={getEditorUrl(isViewOnly)}
      style={{ width: '100%', height: '100%' }}
      ref={setIframe}
      onLoad={onLoad}
      sandbox={SANDBOX_OPTIONS}
    ></iframe>
  )
}
