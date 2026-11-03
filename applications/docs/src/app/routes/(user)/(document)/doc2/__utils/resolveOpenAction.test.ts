import { parseOpenAction } from '~/utils/docs-url-bar'
import { resolveOpenAction } from './resolveOpenAction'

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

  test('mode create resolves to creating in the parent folder', () => {
    expect(resolveUrl('/doc2?mode=create&volumeId=VOLUME&parentLinkId=PARENT')).toEqual({
      kind: 'create',
      parentLinkId: 'PARENT',
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

  test.each([
    '/doc2?mode=convert&volumeId=VOLUME&linkId=LINK',
    '/doc2?mode=history&volumeId=VOLUME&linkId=LINK',
    '/doc2?mode=download&volumeId=VOLUME&linkId=LINK',
    '/doc2?mode=copy-public',
    '/doc2?mode=open-url&token=TOKEN&linkId=LINK',
    '/doc2?mode=open-url-download&token=TOKEN&linkId=LINK',
  ])('%s is unsupported on this page', (url) => {
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
