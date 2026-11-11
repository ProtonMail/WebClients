import { fetchExternalImageAsBase64 } from './fetchExternalImageAsBase64'

const PROXY = { apiUrl: 'https://docs.proton.dev/api', uid: 'session-uid' }

describe('fetchExternalImageAsBase64', () => {
  const fetchMock = jest.fn()

  beforeEach(() => {
    global.fetch = fetchMock
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('fetches the image through the image proxy, for this session, as a data URL', async () => {
    fetchMock.mockResolvedValue({ blob: async () => new Blob(['png'], { type: 'image/png' }) })

    const image = await fetchExternalImageAsBase64('https://example.com/cat.png', PROXY)

    expect(image).toBe('data:image/png;base64,cG5n')
    const proxied = new URL(fetchMock.mock.lastCall[0])
    expect(proxied.origin + proxied.pathname).toBe('https://docs.proton.dev/api/core/v4/images')
    expect(proxied.searchParams.get('Url')).toBe('https://example.com/cat.png')
    expect(proxied.searchParams.get('UID')).toBe('session-uid')
  })

  test('leaves out what the proxy answers that is not an image', async () => {
    fetchMock.mockResolvedValue({ blob: async () => new Blob(['<html>'], { type: 'text/html' }) })

    await expect(fetchExternalImageAsBase64('https://example.com/page', PROXY)).resolves.toBeUndefined()
  })

  test('leaves out an image that cannot be fetched', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(fetchExternalImageAsBase64('https://example.com/cat.png', PROXY)).resolves.toBeUndefined()
  })
})
