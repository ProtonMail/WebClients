import type { NodeEntity } from '@protontech/drive-sdk'
import { getNodeName, getNodeNameOrFallback } from './getNodeName'
import { defaultHomepageMessages } from '../messages/defaultHomepageMessages'

describe('getNodeName', () => {
  test('returns placeholder of invalid name', () => {
    const name = { ok: false, error: { name: 'Invalid/Name', error: 'Name must not contain the character "/"' } }

    expect(getNodeName({ name } as NodeEntity)).toBe('Invalid/Name')
  })

  test('returns undefined for undecryptable name instead of error name', () => {
    const name = { ok: false, error: new Error('Failed to decrypt name') }

    expect(getNodeName({ name } as NodeEntity)).toBeUndefined()
  })
})

describe('getNodeNameOrFallback', () => {
  test('returns fallback for undecryptable name', () => {
    const name = { ok: false, error: new Error('Failed to decrypt name') }

    expect(getNodeNameOrFallback({ name } as NodeEntity, defaultHomepageMessages.names)).toBe('⚠️ Undecryptable name')
  })
})
