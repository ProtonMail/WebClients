import { matchEmojiShortcode } from './matchEmojiShortcode'
import { readRecentEmojis, rememberEmoji } from './recentEmojis'
import { loadEmojis, searchEmojis } from './emojiData'

test('search finds spaghetti by shortcode and returns native Unicode', async () => {
  expect(searchEmojis((await loadEmojis()).getValue(), 'spa', []).map((emoji) => emoji.native)).toContain('🍝')
})

test.each(['10:30', 'http://example.com', 'https://example.com/:spa', 'hello:spa', ':s'])(
  'does not autocomplete %s',
  (text) => {
    expect(matchEmojiShortcode(text)).toBeNull()
  },
)

test.each([':spa', 'hello :spa', '(:spa', '[:spa', '{:spa', '\n:spa'])(
  'recognizes a shortcode at a word boundary in %s',
  (text) => {
    expect(matchEmojiShortcode(text)?.query).toBe('spa')
  },
)

test('a closing colon marks an exact shortcode conversion', () => {
  expect(matchEmojiShortcode(':spaghetti:')).toEqual({ query: 'spaghetti', start: 0, closed: true })
})

test('search supports ids, names, aliases, keywords and recent ranking, using Emoji 14 or older', async () => {
  const emojis = (await loadEmojis()).getValue()
  expect(searchEmojis(emojis, '+1', [])[0].native).toBe('👍')
  expect(searchEmojis(emojis, 'thumbs up', [])[0].native).toBe('👍')
  expect(searchEmojis(emojis, 'pasta', []).map((emoji) => emoji.native)).toContain('🍝')
  expect(searchEmojis(emojis, 'food', ['spaghetti'])[0].native).toBe('🍝')
  expect(emojis.some((emoji) => emoji.id === 'shaking_face')).toBe(false)
})

test('recent emoji are deduplicated and bounded per browser', () => {
  localStorage.clear()
  for (let i = 0; i < 14; i++) {
    rememberEmoji(String(i))
  }
  expect(rememberEmoji('13')).toEqual(['13', '12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2'])
  expect(readRecentEmojis()).toHaveLength(12)
})

test('broken storage does not prevent reading or inserting emoji', () => {
  localStorage.setItem('proton-docs-recent-emojis', '{broken')
  expect(readRecentEmojis()).toEqual([])
  const storage = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('unavailable')
  })
  expect(() => rememberEmoji('spaghetti')).not.toThrow()
  storage.mockRestore()
  localStorage.clear()
})

test('a single-character exact closed shortcode can convert without opening a single-character query', () => {
  expect(matchEmojiShortcode(':v')).toBeNull()
  expect(matchEmojiShortcode(':v:')).toEqual({ query: 'v', start: 0, closed: true })
})
