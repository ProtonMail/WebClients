import { AnonymousUserLetters, getRandomAnonymousUserLetter } from './AnonymousUser'

afterEach(() => {
  jest.restoreAllMocks()
})

test.each(Object.keys(AnonymousUserLetters))('selects anonymous cursor %s with its name and color', (letter) => {
  const letters = Object.keys(AnonymousUserLetters)
  jest.spyOn(Math, 'random').mockReturnValue((letters.indexOf(letter) + 0.5) / letters.length)

  expect(getRandomAnonymousUserLetter()).toEqual({ letter, ...AnonymousUserLetters[letter] })
})
