import { useCallback, useEffect, useReducer, useState } from 'react'

import { type LoaderDeps, type LoaderStatus, loadDocument } from './loadDocument'
import { DocsLoadMark, markDocsLoad } from './loadMarks'

const nextStatus = (_previous: LoaderStatus, next: LoaderStatus) => next

function createFramePromise() {
  let resolve: (frame: HTMLIFrameElement) => void = () => {}
  const promise = new Promise<HTMLIFrameElement>((resolveFrame) => (resolve = resolveFrame))
  return { promise, resolve }
}

/**
 * Runs `loadDocument` once per mount, aborted on unmount, and holds its status. `deps` must keep their identity, as
 * a new one opens the document again. `onFrameReady` hands the editor frame to the run, whenever it arrives.
 */
export function useDocumentLoader(deps: LoaderDeps): {
  status: LoaderStatus
  onFrameReady: (frame: HTMLIFrameElement) => void
} {
  const [status, dispatch] = useReducer(nextStatus, { name: 'loading', step: 'node' })
  const [frame] = useState(createFramePromise)

  useEffect(() => {
    const controller = new AbortController()
    void loadDocument(deps, { frame: frame.promise, dispatch, signal: controller.signal })
    return () => controller.abort()
  }, [deps, frame])

  const onFrameReady = useCallback(
    (editorFrame: HTMLIFrameElement) => {
      markDocsLoad(DocsLoadMark.FrameReady)
      frame.resolve(editorFrame)
    },
    [frame],
  )

  return { status, onFrameReady }
}
