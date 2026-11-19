import { getOwnerName, type OwnerContact } from './get-owner-name'
import { defaultHomepageMessages } from './messages/defaultHomepageMessages'

const { names } = defaultHomepageMessages

describe('getOwnerName', () => {
  test('Will return "Me" if the document is owned by the user', () => {
    const recentDocument = { createdBy: undefined }
    expect(getOwnerName(recentDocument, true, [], names)).toBe('Me')
  })

  test('Will return the contact display name if it is present and the document is shared with the user', () => {
    const recentDocument = { createdBy: 'joe@proton.ch' }
    const contacts = [{ Name: 'Joe Bloggs', Email: 'joe@proton.ch' }] satisfies OwnerContact[]
    expect(getOwnerName(recentDocument, false, contacts, names)).toBe('Joe Bloggs')
  })

  test('Will return the contact email if there is no name and the document is shared with the user', () => {
    const recentDocument = { createdBy: 'joe@proton.ch' }
    const contacts = [{ Email: 'joe@proton.ch' }] satisfies OwnerContact[]
    expect(getOwnerName(recentDocument, false, contacts, names)).toBe('joe@proton.ch')
  })

  test('Will return the createdBy email if no contact matches the createdBy field due to incorrect filtering', () => {
    const recentDocument = { createdBy: 'unknown@proton.ch' }
    const contacts = [
      { Name: 'Joe Bloggs', Email: 'joe@proton.ch' },
      { Name: 'Jane Doe', Email: 'jane@proton.ch' },
    ] satisfies OwnerContact[]

    expect(getOwnerName(recentDocument, false, contacts, names)).toBe('unknown@proton.ch')
  })

  test('Will return the contact name if the contact matches the createdBy field', () => {
    const recentDocument = { createdBy: 'jane@proton.ch' }
    const contacts = [
      { Name: 'Joe Bloggs', Email: 'joe@proton.ch' },
      { Name: 'Jane Doe', Email: 'jane@proton.ch' },
    ] satisfies OwnerContact[]

    expect(getOwnerName(recentDocument, false, contacts, names)).toBe('Jane Doe')
  })

  test('Will return "Me" if the document is owned by the user even if a contact matches', () => {
    const recentDocument = { createdBy: 'joe@proton.ch' }
    const contacts = [{ Name: 'Joe Bloggs', Email: 'joe@proton.ch' }] satisfies OwnerContact[]
    expect(getOwnerName(recentDocument, true, contacts, names)).toBe('Me')
  })

  test('Will return undefined if the document is not owned by the user and has no creator', () => {
    const recentDocument = { createdBy: undefined }
    expect(getOwnerName(recentDocument, false, [], names)).toBeUndefined()
  })

  test('Will return the createdBy email if contacts are not loaded', () => {
    const recentDocument = { createdBy: 'joe@proton.ch' }
    expect(getOwnerName(recentDocument, false, undefined, names)).toBe('joe@proton.ch')
  })
})
