/**
 * Determines how the editor presents itself. This mode cannot be changed by the user.
 * The editor keeps its own copy in `Containers/Docs/contract/EditorSystemMode.ts`; change both together.
 */
export enum EditorSystemMode {
  /** Full range of editing options displayed. May be further affected by EditorUserMode */
  Edit = 'edit',
  /** Used when displaying a revision. */
  Revision = 'revision',
  /** Used when displaying a public document. */
  PublicView = 'public-view',
}
