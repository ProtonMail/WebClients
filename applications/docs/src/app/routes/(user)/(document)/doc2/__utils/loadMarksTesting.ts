import type { MockInstance } from 'vitest'
import { performance as nodePerformance } from 'node:perf_hooks'

/**
 * For tests: in each test of the calling `describe`, `performance` is Node's, cleared, since jsdom's has no User Timing
 * marks or measures. Returns a getter for the spy, so that a test can swap in another `performance`.
 */
export function withNodePerformance(): () => MockInstance {
  let performanceSpy: MockInstance
  beforeEach(() => {
    performanceSpy = vi
      .spyOn(globalThis, 'performance', 'get')
      .mockReturnValue(nodePerformance as unknown as Performance)
    nodePerformance.clearMarks()
    nodePerformance.clearMeasures()
  })
  afterEach(() => performanceSpy.mockRestore())
  return () => performanceSpy
}

/** For tests: the names of the `docs-load:` marks placed, in order */
export function docsLoadMarks(): string[] {
  return performance
    .getEntriesByType('mark')
    .map(({ name }) => name)
    .filter((name) => name.startsWith('docs-load:'))
}
