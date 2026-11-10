import { InactiveSessionError } from '@proton/shared/lib/api/helpers/errors'
import { createApiError, createOfflineError, createTimeoutError } from '@proton/shared/lib/fetch/ApiError'

import { createDocsApiFetch } from './createDocsApiFetch'

const api = jest.fn()
const docsApiFetch = createDocsApiFetch(api, '/api')
const commitUrl = '/api/docs/volumes/volume-1/documents/link-1/commits/commit-1'

function statusCodeError(status: number, data: unknown) {
  return createApiError('StatusCodeError', new Response(null, { status }), {}, data)
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('createDocsApiFetch', () => {
  test('sends the request through the app API without the API prefix and returns its response', async () => {
    const response = new Response('commit bytes')
    api.mockResolvedValue(response)
    const signal = new AbortController().signal
    const body = new Uint8Array([1, 2, 3])

    const result = await docsApiFetch(commitUrl, {
      method: 'PUT',
      headers: { 'content-type': 'application/x-protobuf', 'x-pm-uid': 'session-uid' },
      credentials: 'include',
      body,
      signal,
    })

    expect(result).toBe(response)
    expect(api).toHaveBeenCalledWith({
      url: 'docs/volumes/volume-1/documents/link-1/commits/commit-1',
      method: 'PUT',
      headers: { 'content-type': 'application/x-protobuf', 'x-pm-uid': 'session-uid' },
      data: body,
      input: 'body',
      signal,
      silence: true,
      timeout: 120_000,
      output: 'raw',
    })
  })

  test('sends a JSON body as is, and no body when there is none', async () => {
    api.mockResolvedValue(new Response('{}'))

    await docsApiFetch('/api/docs/lock', { method: 'POST', body: '{"FetchCommitID":"commit-1"}' })
    await docsApiFetch('/api/docs/meta', { method: 'GET' })

    expect(api).toHaveBeenNthCalledWith(1, expect.objectContaining({ data: '{"FetchCommitID":"commit-1"}' }))
    expect(api).toHaveBeenNthCalledWith(2, expect.objectContaining({ data: undefined, headers: {} }))
  })

  test('turns a status code error into a response with its status and JSON body', async () => {
    api.mockRejectedValue(statusCodeError(422, { Code: 2501, Error: 'Document not found' }))

    const response = await docsApiFetch(commitUrl, { method: 'GET' })

    expect(response.status).toBe(422)
    expect(response.headers.get('content-type')).toBe('application/json')
    expect(await response.json()).toEqual({ Code: 2501, Error: 'Document not found' })
  })

  test('turns a status code error whose body was not JSON into a response with that status', async () => {
    // The app's fetch reads a non-JSON error body as `{}`.
    api.mockRejectedValue(statusCodeError(503, {}))

    const response = await docsApiFetch(commitUrl, { method: 'GET' })

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({})
  })

  test('turns an inactive session into a 401 response, so the SDK stops as authExpired', async () => {
    api.mockRejectedValue(InactiveSessionError())

    const response = await docsApiFetch(commitUrl, { method: 'GET' })

    expect(response.status).toBe(401)
  })

  test.each([
    ['offline', createOfflineError({})],
    ['timeout', createTimeoutError({})],
    ['abort', new DOMException('The operation was aborted.', 'AbortError')],
    ['unexpected', new TypeError('Failed to fetch')],
  ])('rethrows an error with no HTTP answer (%s)', async (_, error) => {
    api.mockRejectedValue(error)

    await expect(docsApiFetch(commitUrl, { method: 'GET' })).rejects.toBe(error)
  })

  test('rejects an already aborted request without sending it', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(docsApiFetch(commitUrl, { method: 'GET', signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    })
    expect(api).not.toHaveBeenCalled()
  })

  test('rejects as soon as the request is aborted, even while the app API waits to retry', async () => {
    // A 401 refresh or a 429 wait between attempts, which the app's fetch does not abort.
    api.mockReturnValue(new Promise(() => {}))
    const controller = new AbortController()

    const request = docsApiFetch(commitUrl, { method: 'GET', signal: controller.signal })
    controller.abort(new DOMException('The operation timed out.', 'TimeoutError'))

    await expect(request).rejects.toMatchObject({ name: 'TimeoutError' })
  })

  test('rejects a URL outside the API without sending it', async () => {
    await expect(docsApiFetch('https://example.com/api/docs/meta', { method: 'GET' })).rejects.toThrow(
      'Docs API URL outside the API: https://example.com/api/docs/meta',
    )
    expect(api).not.toHaveBeenCalled()
  })
})
