/** User-controlled presentation mode, constrained by the editor's system mode. */
export enum EditorUserMode {
  /** Full range of editing options available. */
  Edit = 'edit',
  /** Toolbar and distractions are hidden. */
  Preview = 'preview',
  /** Some toolbar options may be unavailable. */
  Suggest = 'suggest',
}
