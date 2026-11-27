import { validateDocumentName } from './validateDocumentName'

describe('validateDocumentName', () => {
  test('accepts the names Drive accepts', () => {
    expect(validateDocumentName('Meeting notes')).toBeUndefined()
    expect(validateDocumentName('..')).toBeUndefined()
    expect(validateDocumentName('a\\b')).toBeUndefined()
    expect(validateDocumentName('a'.repeat(255))).toBeUndefined()
  })

  test('refuses an empty name', () => {
    expect(validateDocumentName('')).toBe('Name must not be empty')
  })

  test('refuses a name longer than 255 characters', () => {
    expect(validateDocumentName('a'.repeat(256))).toBe('Name must be 255 characters long at most')
  })

  test.each(['a/b', '../../x', '/'])('refuses a name with a slash: %s', (name) => {
    expect(validateDocumentName(name)).toBe('Name must not contain slashes (/)')
  })
})
