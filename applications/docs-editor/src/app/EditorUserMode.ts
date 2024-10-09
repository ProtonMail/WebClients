/**
 * Determines how the editor presents itself, but this option, unlike EditorSystemMode, can be changed by the user.
 * However, it cannot override the system mode if they conflict with each other.
 */
export enum EditorUserMode {
  /** Full range of editing options available */
  Edit = 'edit',
  /** Toolbar and all distractions are hidden */
  Preview = 'preview',
  /** Some toolbar options may be unavailable. */
  Suggest = 'suggest',
}
