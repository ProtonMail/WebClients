import { DefaultFont, FontOptions, getFontFaceIdFromValue, getFontFaceValueFromId } from './Fonts'

describe('document font lookup', () => {
  it.each(FontOptions)('round-trips the saved font id for $label', ({ id, value }) => {
    expect(getFontFaceValueFromId(id)).toBe(value)
    expect(getFontFaceIdFromValue(value)).toBe(id)
  })

  it('keeps Arial as the default font', () => {
    expect(DefaultFont).toEqual({ id: 'Arial', label: 'Arial', value: 'Arial, sans-serif' })
    expect(FontOptions).toContain(DefaultFont)
  })

  it.each([null, undefined, '', 'Unknown font', 'arial'])('does not resolve an unknown font id: %s', (id) => {
    expect(getFontFaceValueFromId(id)).toBeUndefined()
  })

  it.each(['', 'Unknown font', 'arial, sans-serif', 'Arial'])('does not resolve an unknown font value: %s', (value) => {
    expect(getFontFaceIdFromValue(value)).toBeUndefined()
  })
})
