import type { NodeEntity } from '@proton/drive'
import { getFullPathFromAncestry } from './getFullPathFromAncestry'

describe('getFullPathFromAncestry', () => {
  test('skips root and keeps order of folders', () => {
    const ancestry = ['My files', 'Projects', 'Docs'].map((value) => ({ name: { ok: true, value } }) as NodeEntity)

    expect(getFullPathFromAncestry(ancestry)).toEqual(['Projects', 'Docs'])
  })

  test('keeps folders with invalid or undecryptable name', () => {
    const ancestry = [
      { name: { ok: true, value: 'My files' } },
      { name: { ok: false, error: { name: 'Invalid/Name', error: 'Name must not contain the character "/"' } } },
      { name: { ok: false, error: new Error('Failed to decrypt name') } },
    ] as NodeEntity[]

    expect(getFullPathFromAncestry(ancestry)).toEqual(['Invalid/Name', '⚠️ Undecryptable name'])
  })
})
