import { defaultHomepageMessages } from '../messages/defaultHomepageMessages'
import { validateDocumentName } from './validateDocumentName'

const messages = defaultHomepageMessages.documentsTable.invalidName

describe('validateDocumentName', () => {
  test('accepts the names Drive accepts', () => {
    expect(validateDocumentName('Meeting notes', messages)).toBeUndefined()
    expect(validateDocumentName('a'.repeat(255), messages)).toBeUndefined()
  })

  test.each([
    ['', 'Name must not be empty'],
    ['a'.repeat(256), 'Name must be 255 characters long at most'],
    ['a/b', 'Name must not contain slashes (/)'],
    ['../../x', 'Name must not contain slashes (/)'],
  ])('refuses %j', (name, error) => {
    expect(validateDocumentName(name, messages)).toBe(error)
  })
})
