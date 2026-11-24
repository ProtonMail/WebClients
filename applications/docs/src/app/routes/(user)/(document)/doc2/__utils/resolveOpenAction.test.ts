import { parseOpenAction } from '~/utils/docs-url-bar'
import { loggableResolution, resolveOpenAction } from './resolveOpenAction'

function resolveUrl(url: string) {
  const { pathname, search } = new URL(url, 'https://docs.proton.dev')
  return resolveOpenAction(parseOpenAction(new URLSearchParams(search), pathname), search)
}

describe('resolveOpenAction', () => {
  test('mode open resolves to the node to open', () => {
    expect(resolveUrl('/doc2?mode=open&volumeId=VOLUME&linkId=LINK')).toEqual({
      kind: 'open',
      nodeMeta: { volumeId: 'VOLUME', linkId: 'LINK' },
    })
  })

  test("mode download, Drive's Download, resolves to the node to open and download", () => {
    expect(resolveUrl('/doc2?mode=download&volumeId=VOLUME&linkId=LINK')).toEqual({
      kind: 'open',
      nodeMeta: { volumeId: 'VOLUME', linkId: 'LINK' },
      downloadOnOpen: true,
    })
  })

  test('mode history resolves to the node to open, and its version history to open once it shows', () => {
    expect(resolveUrl('/doc2?mode=history&volumeId=VOLUME&linkId=LINK')).toEqual({
      kind: 'open',
      nodeMeta: { volumeId: 'VOLUME', linkId: 'LINK' },
      historyOnOpen: true,
    })
  })

  test('mode open neither downloads nor opens the history', () => {
    const resolution = resolveUrl('/doc2?mode=open&volumeId=VOLUME&linkId=LINK')
    expect(resolution).not.toHaveProperty('downloadOnOpen')
    expect(resolution).not.toHaveProperty('historyOnOpen')
  })

  test('mode download does not open the history', () => {
    expect(resolveUrl('/doc2?mode=download&volumeId=VOLUME&linkId=LINK')).not.toHaveProperty('historyOnOpen')
  })

  test('mode history without a linkId is an invalid URL', () => {
    expect(resolveUrl('/doc2?mode=history&volumeId=VOLUME')).toEqual({ kind: 'error', reason: 'invalidUrl' })
  })

  test('mode create resolves to creating in the parent folder', () => {
    expect(resolveUrl('/doc2?mode=create&volumeId=VOLUME&parentLinkId=PARENT')).toEqual({
      kind: 'create',
      parent: { volumeId: 'VOLUME', linkId: 'PARENT' },
    })
  })

  test('mode new resolves to creating in the root', () => {
    expect(resolveOpenAction({ type: 'doc', mode: 'new' }, '')).toEqual({ kind: 'create' })
  })

  test.each(['/doc2', '/new2', '/u/0/doc2', '/u/0/new2'])('a bare %s resolves to creating in the root', (path) => {
    expect(resolveUrl(path)).toEqual({ kind: 'create' })
  })

  test('mode open-url-reauth redirects back to the public context', () => {
    expect(resolveUrl('/doc2?mode=open-url-reauth&token=TOKEN&linkId=LINK')).toEqual({
      kind: 'redirect',
      to: 'public',
    })
  })

  test.each(['/doc2?mode=open-url&token=TOKEN&linkId=LINK', '/doc2?mode=open-url&token=TOKEN'])(
    '%s opens the public link',
    (url) => {
      expect(resolveUrl(url)).toEqual({ kind: 'openPublicLink', token: 'TOKEN' })
    },
  )

  test('mode copy-public is the copy window, which gets a public document from its opener', () => {
    expect(resolveUrl('/doc2?mode=copy-public')).toEqual({ kind: 'copyPublic' })
  })

  test("mode open-url-download opens the public link, to download it: Drive's Download of a public link", () => {
    expect(resolveUrl('/doc2?mode=open-url-download&token=TOKEN&linkId=LINK')).toEqual({
      kind: 'openPublicLink',
      token: 'TOKEN',
      downloadOnOpen: true,
    })
  })

  test.each(['/doc2?mode=convert&volumeId=VOLUME&linkId=LINK'])('%s is unsupported on this page', (url) => {
    expect(resolveUrl(url)).toEqual({ kind: 'error', reason: 'unsupported' })
  })

  test.each([
    ['open without a linkId', '/doc2?mode=open&volumeId=VOLUME'],
    ['create without a parentLinkId', '/doc2?mode=create&volumeId=VOLUME'],
    ['an unknown mode', '/doc2?mode=unknown&volumeId=VOLUME&linkId=LINK'],
    ['only unrelated parameters', '/doc2?foo=bar'],
  ])('%s is an invalid URL, not a new document', (_, url) => {
    expect(resolveUrl(url)).toEqual({ kind: 'error', reason: 'invalidUrl' })
  })

  test.each(['/doc2?mode=open&volumeId=VOLU[%E2%80%A6]', '/doc2?mode=open&volumeId=VOLUME&linkId=LI[%E2%80%A6]'])(
    '%s, truncated by Slack, is reported as such, not opened or created',
    (url) => {
      expect(resolveUrl(url)).toEqual({ kind: 'error', reason: 'slackTruncated' })
    },
  )
})

describe('loggableResolution', () => {
  test("a public link's resolution logs its kind, never its token", () => {
    const logged = loggableResolution(resolveUrl('/doc2?mode=open-url&token=TOKEN&linkId=LINK'))
    expect(logged).toEqual({ kind: 'openPublicLink' })
    expect(JSON.stringify(logged)).not.toContain('TOKEN')
  })

  test("an error's resolution logs its reason", () => {
    expect(loggableResolution(resolveUrl('/doc2?foo=bar'))).toEqual({ kind: 'error', reason: 'invalidUrl' })
  })
})
