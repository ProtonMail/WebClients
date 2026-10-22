import { addLocale, useLocale } from 'ttag'
import { createCommentsMessages } from './comments'

// These are the msgids of the existing translations, which the adapter must keep matching.
addLocale('fr', {
  charset: 'utf-8',
  headers: { 'plural-forms': 'nplurals=2; plural=(n > 1);' },
  contexts: {
    Info: {
      '${ usersTranslation } is typing...': ['${ usersTranslation } écrit...', '${ usersTranslation } écrivent...'],
      '${ allTypersExceptLast } and ${ lastTyper }': ['${ allTypersExceptLast } et ${ lastTyper }'],
    },
    Label: {
      'with "${ replaceWith }"': ['par « ${ replaceWith } »'],
    },
  },
})

afterEach(() => {
  useLocale('en')
})

it('translates who is typing with the plural form for the number of typers', () => {
  useLocale('fr')
  const { typerNames, typing } = createCommentsMessages().comments

  expect(typing('Alice', 1)).toBe('Alice écrit...')
  expect(typing(typerNames('Alice, Bob', 'Carol'), 3)).toBe('Alice, Bob et Carol écrivent...')
})

it('translates the replacement text of a suggestion', () => {
  useLocale('fr')

  expect(createCommentsMessages().comments.suggestionSummary.replaceWith('chat')).toBe('par « chat »')
})
