import { getAccentColorForUsername } from './getAccentColorForUsername'

describe('Docs collaborator accent color', () => {
  it.each([
    ['', 'hsl(240, 100%, 75%)'],
    ['foo', 'hsl(21, 25%, 46%)'],
    ['bar', 'hsl(23, 14%, 29%)'],
    ['baz', 'hsl(165, 77%, 25%)'],
  ])('preserves the existing avatar color for %j', (userName, expected) => {
    expect(getAccentColorForUsername(userName)).toBe(expected)
  })
})
