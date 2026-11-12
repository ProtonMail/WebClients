/**
 * The milestones of loading a document on /doc2, as Performance API marks on the page's time line, measured from
 * navigation start, so that one `performance.getEntriesByType('mark')` reads the load. The names are the ones the
 * doc2 performance spec gives the milestones, without `socket-open`: doc2's socket is inside the realtime SDK.
 * Marks rather than OpenTracer events, since the doc2 gate's load benchmark reads them from the browser.
 */
export const DocsLoadMark = {
  RouteMounted: 'docs-load:route-mounted',
  FrameReady: 'docs-load:frame-ready',
  DocumentLoaded: 'docs-load:document-loaded',
  BaseStateSent: 'docs-load:base-state-sent',
  CaughtUp: 'docs-load:caught-up',
  /** When the editor answers doc2's `showEditor`, and the loader in front of it goes */
  EditorShown: 'docs-load:editor-shown',
  /**
   * The last of: the editor shown, its Lexical editor rendered (its first `updateFrameSize`), and its answer to doc2's
   * latest lock call, an unlock. The editor's own lock is out of doc2's sight.
   */
  EditorEditable: 'docs-load:editor-editable',
} as const

export type DocsLoadMarkName = (typeof DocsLoadMark)[keyof typeof DocsLoadMark]

/**
 * Places the mark `name` once per page load: a reconnect or a rebootstrap that passes the same point places nothing.
 * A mark that can't be placed is skipped, never thrown.
 */
export function markDocsLoad(name: DocsLoadMarkName): void {
  try {
    if (performance.getEntriesByName(name, 'mark').length === 0) {
      performance.mark(name)
    }
  } catch {
    // No Performance API: the load goes on without the mark
  }
}
