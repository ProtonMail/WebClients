import { getAuthorName } from './getAuthorName'
import { defaultHomepageMessages } from '../messages/defaultHomepageMessages'

const { names } = defaultHomepageMessages

describe('getAuthorName', () => {
  test('anonymous author is unknown user', () => {
    expect(getAuthorName({ ok: true, value: null }, names)).toBe('Unknown user')
  })

  test('unverified author falls back to claimed author', () => {
    expect(
      getAuthorName({ ok: false, error: { claimedAuthor: 'author@example.com', error: 'Invalid signature' } }, names),
    ).toBe('author@example.com')
  })

  test('unverified anonymous author is unknown user', () => {
    expect(getAuthorName({ ok: false, error: { claimedAuthor: null, error: 'Invalid signature' } }, names)).toBe(
      'Unknown user',
    )
  })
})
