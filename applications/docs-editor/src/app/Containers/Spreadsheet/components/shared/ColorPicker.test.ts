import { normalizeCustomHexColor } from './normalizeCustomHexColor'

describe('normalizeCustomHexColor', () => {
  it('adds a hash to pasted hex colors', () => {
    expect(normalizeCustomHexColor('6D4AFF')).toBe('#6d4aff')
  })

  it('keeps valid hash-prefixed hex colors normalized', () => {
    expect(normalizeCustomHexColor('#ABC')).toBe('#abc')
  })

  it('leaves invalid colors unchanged', () => {
    expect(normalizeCustomHexColor('not-a-color')).toBe('not-a-color')
  })
})
