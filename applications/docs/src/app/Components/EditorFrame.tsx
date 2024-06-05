import { BridgeOriginProvider } from '@proton/docs-shared'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Props = {
  onFrameReady: (frame: HTMLIFrameElement) => void
  isViewOnly?: boolean
}

function GetEditorUrl(isViewOnly = false) {
  const url = new URL(BridgeOriginProvider.GetEditorOrigin())

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
  const url = useMemo(() => GetEditorUrl(isViewOnly), [isViewOnly])

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
      src={url}
      style={{ width: '100%', height: '100%' }}
      ref={setIframe}
      onLoad={onLoad}
      sandbox={SANDBOX_OPTIONS}
    ></iframe>
  )
}
