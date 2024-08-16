import { isCJK, isKana, isThai, isWithinCodePointRange, isWordDelimiter, toCodePoint } from './CharacterUtils'

const getCodePointOrThrow = (char: string) => {
  const codePoint = toCodePoint(char)
  if (typeof codePoint !== 'number') {
    throw new Error('Invalid code point')
  }
  return codePoint
}

test.each([
  ['言', true],
  ['。', true],
  ['a', false],
])('isCJK %s => %s', (char, expected) => {
  expect(isCJK(getCodePointOrThrow(char))).toBe(expected)
})

test.each([
  ['อ', true],
  ['บ', true],
  ['a', false],
])('isThai %s => %s', (char, expected) => {
  expect(isThai(getCodePointOrThrow(char))).toBe(expected)
})

test.each([
  ['す', true],
  ['が', true],
  ['a', false],
])('isKana %s => %s', (char, expected) => {
  expect(isKana(getCodePointOrThrow(char))).toBe(expected)
})

test('isWithinCodePointRange', () => {
  expect(isWithinCodePointRange(0x17, [0x15, 0x18])).toBe(true)
  expect(isWithinCodePointRange(0x17, [0x18, 0x19])).toBe(false)
  expect(isWithinCodePointRange(0x17, [0x15, 0x16])).toBe(false)
  expect(isWithinCodePointRange(0x17, [0x17, 0x17])).toBe(true)
  expect(isWithinCodePointRange(0x17, [0x16, 0x17])).toBe(true)
  expect(isWithinCodePointRange(0x17, [0x17, 0x18])).toBe(true)
})

test.each([
  ['.', true],
  [',', true],
  [' ', true],
  ['a', false],
])('isWordDelimiter', (delimiter, expected) => {
  expect(isWordDelimiter(toCodePoint(delimiter))).toBe(expected)
})
