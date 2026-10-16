import { getAuthorName } from './getAuthorName'

describe('getAuthorName', () => {
  test('anonymous author is unknown user', () => {
    expect(getAuthorName({ ok: true, value: null })).toBe('Unknown user')
  })

  test('unverified author falls back to claimed author', () => {
    expect(
      getAuthorName({ ok: false, error: { claimedAuthor: 'author@example.com', error: 'Invalid signature' } }),
    ).toBe('author@example.com')
  })

  test('unverified anonymous author is unknown user', () => {
    expect(getAuthorName({ ok: false, error: { claimedAuthor: null, error: 'Invalid signature' } })).toBe(
      'Unknown user',
    )
  })
})
