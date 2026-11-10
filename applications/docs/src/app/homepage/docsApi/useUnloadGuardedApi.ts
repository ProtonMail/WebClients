import { useEffect, useMemo, useRef } from 'react'

import type { Api } from './api'

/**
 * Wraps the injected api so the browser asks for confirmation before the page unloads while a request is
 * pending, as `DocsApi` does for its requests (`handleWindowUnload` in packages/docs-core/lib/Api/DocsApi.ts).
 */
export function useUnloadGuardedApi(api: Api): Api {
  const inflight = useRef(0)

  useEffect(() => {
    const handleWindowUnload = (event: BeforeUnloadEvent) => {
      if (inflight.current !== 0) {
        event.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleWindowUnload)
    return () => window.removeEventListener('beforeunload', handleWindowUnload)
  }, [])

  return useMemo(() => {
    const guardedApi: Api = async (request) => {
      inflight.current++
      try {
        return await api(request)
      } finally {
        inflight.current--
      }
    }
    return guardedApi
  }, [api])
}
