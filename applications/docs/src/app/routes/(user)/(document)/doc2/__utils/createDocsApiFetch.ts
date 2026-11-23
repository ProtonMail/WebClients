import type { ApiError } from '@proton/shared/lib/fetch/ApiError'
import type { Api } from '@proton/shared/lib/interfaces/Api'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import type { DocsApiFetch } from '@proton-docs/realtime-sdk'

/** Squash uploads can be large. */
const DOCS_API_TIMEOUT_MS = 120_000

/**
 * The SDK's Docs API fetch over the app's `useApi()`, so its calls get the app's 401 refresh, 429 wait, headers and
 * modals. Every HTTP answer resolves as a `Response`, 4xx and 5xx included; a rejection means no answer came.
 * Adapted from `packages/drive/internal/useHttpClient.ts`, its `fetchJson`, which is not exported.
 */
export function createDocsApiFetch(api: Api, apiUrl: string, logger: Pick<LoggerInterface, 'warn'>): DocsApiFetch {
  const prefix = `${apiUrl}/`

  return async (input, init) => {
    // The app's fetch only listens for a later abort, so it would still send a request aborted before the call.
    init.signal?.throwIfAborted()
    if (!input.startsWith(prefix)) {
      // The SDK drops this error, so this log is the only trace of the URL. Not `error`, which reports to Sentry.
      const message = `Docs API URL outside the API: ${withoutIds(input)}`
      logger.warn(message)
      throw new Error(message)
    }

    try {
      const request = api<Response>({
        // The app's API prefixes the API URL itself.
        url: input.slice(prefix.length),
        method: init.method,
        // The SDK's x-pm-uid and x-pm-appversion match the app's; createApi then sets x-pm-locale to the app's locale.
        headers: Object.fromEntries(new Headers(init.headers)),
        data: init.body ?? undefined,
        input: 'body',
        signal: init.signal,
        // The SDK reports failures itself.
        silence: true,
        timeout: DOCS_API_TIMEOUT_MS,
        output: 'raw',
      })
      return await (init.signal ? Promise.race([request, rejectOnAbort(init.signal)]) : request)
    } catch (error) {
      if (isStatusCodeError(error)) {
        return new Response(JSON.stringify(error.data ?? {}), {
          status: error.status,
          headers: { 'content-type': 'application/json' },
        })
      }
      // The app's API already failed its 401 refresh and logged the user out.
      if (error instanceof Error && error.name === 'InactiveSession') {
        return new Response(null, { status: 401 })
      }
      throw error
    }
  }
}

/**
 * The app's fetch aborts only the request in flight, not its wait for a 401 refresh or a 429 retry, nor the retry
 * after it. Rejecting here keeps the SDK's timeouts working, but unlike `fetch`, that retry can still be sent.
 */
function rejectOnAbort(signal: AbortSignal) {
  return new Promise<never>((_, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  })
}

/**
 * The URL with no query or fragment and its path ids masked, to keep the user's document ids and any token out of the
 * log they may share with support. shortcut: masks the id segments of the SDK's paths today; mask any new one an SDK
 * version adds.
 */
function withoutIds(url: string) {
  return url.split(/[?#]/)[0].replace(/\/(volumes|documents|commits|threads|comments)\/[^/]+/g, '/$1/…')
}

/** The app's fetch throws a `StatusCodeError` for every non-2xx answer, its JSON body parsed into `data`. */
function isStatusCodeError(error: unknown): error is ApiError {
  return error instanceof Error && error.name === 'StatusCodeError' && 'status' in error
}
