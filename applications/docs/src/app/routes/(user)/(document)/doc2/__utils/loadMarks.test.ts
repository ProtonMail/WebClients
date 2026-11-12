import { DocsLoadMark, markDocsLoad } from './loadMarks'
import { withNodePerformance } from './loadMarksTesting'

describe('markDocsLoad', () => {
  const performanceSpy = withNodePerformance()

  test('places each mark once per page load: a later pass places nothing', () => {
    markDocsLoad(DocsLoadMark.CaughtUp)
    const [first] = performance.getEntriesByName(DocsLoadMark.CaughtUp, 'mark')

    markDocsLoad(DocsLoadMark.CaughtUp)

    expect(performance.getEntriesByName(DocsLoadMark.CaughtUp, 'mark')).toEqual([first])
  })

  test('places nothing, and throws nothing, where marks cannot be placed', () => {
    performanceSpy().mockReturnValue({
      getEntriesByName: () => [],
      mark: () => {
        throw new Error('no marks here')
      },
    } as unknown as Performance)

    expect(() => markDocsLoad(DocsLoadMark.RouteMounted)).not.toThrow()

    performanceSpy().mockReturnValue(undefined as unknown as Performance)

    expect(() => markDocsLoad(DocsLoadMark.RouteMounted)).not.toThrow()
  })
})
