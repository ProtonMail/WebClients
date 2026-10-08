import { stepFontSize } from './stepFontSize'

describe('stepFontSize', () => {
  it.each([
    ['8px', 1, '10px'],
    ['12px', 1, '14px'],
    ['22px', 1, '30px'],
    ['30px', -1, '22px'],
    ['14px', 2, '18px'],
    ['14px', 0, '14px'],
    ['8px', -1, '8px'],
    ['96px', 1, '96px'],
    ['14.5px', 1, '8px'],
    ['14.5px', -1, '14.5px'],
    ['invalid', 1, '8px'],
    ['invalid', -1, 'invalid'],
  ])('steps %s by %s to %s', (current, step, expected) => {
    expect(stepFontSize(current, step)).toBe(expected)
  })
})
