import { isDoc2Path } from './isDoc2Path'

describe('isDoc2Path', () => {
  it.each([
    ['/doc2', true],
    ['/u/1/doc2', true],
    ['/doc2/', true],
    ['/doc', false],
    ['/doc22', false],
    ['/new2', false],
    ['/', false],
  ])('%s: %s', (pathname, expected) => {
    expect(isDoc2Path(pathname)).toBe(expected)
  })
})
