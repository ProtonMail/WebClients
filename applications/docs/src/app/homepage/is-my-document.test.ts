import { isMyDocument, type UserAddress } from './is-my-document'

describe('isMyDocument', () => {
  const addresses = [{ Email: 'john.doe@proton.me' }, { Email: 'other@pm.me' }] satisfies UserAddress[]

  test('Will return false if addresses are not loaded', () => {
    expect(isMyDocument({ createdBy: 'john.doe@proton.me' }, undefined)).toBe(false)
  })

  test('Will return false if the document has no creator', () => {
    expect(isMyDocument({ createdBy: undefined }, addresses)).toBe(false)
  })

  test('Will return false if the user has no addresses', () => {
    expect(isMyDocument({ createdBy: 'john.doe@proton.me' }, [])).toBe(false)
  })

  test('Will return true if the creator matches one of the addresses', () => {
    expect(isMyDocument({ createdBy: 'other@pm.me' }, addresses)).toBe(true)
  })

  test('Will return false if the creator does not match any address', () => {
    expect(isMyDocument({ createdBy: 'jane@proton.me' }, addresses)).toBe(false)
  })

  test('Will match regardless of case', () => {
    expect(isMyDocument({ createdBy: 'John.Doe@Proton.ME' }, addresses)).toBe(true)
  })

  test('Will match ignoring dots, underscores and hyphens in the local part', () => {
    expect(isMyDocument({ createdBy: 'john_do-e@proton.me' }, addresses)).toBe(true)
    expect(isMyDocument({ createdBy: 'johndoe@proton.me' }, addresses)).toBe(true)
  })

  test('Will match ignoring the plus alias', () => {
    expect(isMyDocument({ createdBy: 'john.doe+docs@proton.me' }, addresses)).toBe(true)
  })

  test('Will not match the same local part on a different domain', () => {
    expect(isMyDocument({ createdBy: 'john.doe@gmail.com' }, addresses)).toBe(false)
  })
})
