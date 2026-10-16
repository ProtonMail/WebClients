import type { NodeEntity } from '@proton/drive'
import { getNodeName, getNodeNameOrFallback } from './getNodeName'

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

    expect(getNodeNameOrFallback({ name } as NodeEntity)).toBe('⚠️ Undecryptable name')
  })
})
