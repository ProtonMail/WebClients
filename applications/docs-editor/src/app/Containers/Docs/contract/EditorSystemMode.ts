/**
 * Determines how the editor presents itself. This mode cannot be changed by the user.
 * The client sends these values in the editor URL's `mode` parameter, so they must match
 * `EditorSystemMode` in `@proton/docs-shared`.
 */
export enum EditorSystemMode {
  /** Full range of editing options displayed. May be further affected by EditorUserMode */
  Edit = 'edit',
  /** Used when displaying a revision. */
  Revision = 'revision',
  /** Used when displaying a public document. */
  PublicView = 'public-view',
}
