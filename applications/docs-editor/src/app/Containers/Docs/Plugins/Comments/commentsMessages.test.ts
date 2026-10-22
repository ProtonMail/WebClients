import { commentsMessages } from './commentsMessages'

const { typerNames, typing } = commentsMessages.comments

it('says one person is typing', () => {
  expect(typing('Alice', 1)).toBe('Alice is typing...')
})

it('says several people are typing', () => {
  expect(typing(typerNames('Alice, Bob', 'Carol'), 3)).toBe('Alice, Bob and Carol are typing...')
})
