/**
 * A request to the Proton API. The host injects its authenticated API caller, which accepts this shape.
 */
export type ApiRequest = {
  method: 'get' | 'post' | 'put' | 'delete'
  url: string
  params?: Record<string, unknown>
  data?: unknown
  signal?: AbortSignal
  /** Suppresses the host's error notification for a failed request. */
  silence?: boolean
}

/** Resolves with the response body, rejects when the request fails. */
export type Api = <T>(request: ApiRequest) => Promise<T>
