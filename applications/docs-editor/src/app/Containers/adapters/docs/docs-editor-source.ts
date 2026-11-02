import {
  DocsDependenciesProvider,
  DocsLayoutContainer,
  exportDataFromEditorState,
  getDocsLayoutScrollContainer,
  getEditorStateFromSerializedNodes,
  PreviewModeEditor,
  rejectAllSuggestions,
  removeCommentThreadMarks,
  SHOW_ALL_COMMENTS_COMMAND,
  StandaloneDocsEditor,
} from '../../Docs/public'

/**
 * The Docs editor exports the app uses at runtime. Components, the dependencies context and Lexical
 * commands must all come from the same editor, so they are picked together.
 */
export type DocsEditorSource = {
  DocsDependenciesProvider: typeof DocsDependenciesProvider
  DocsLayoutContainer: typeof DocsLayoutContainer
  PreviewModeEditor: typeof PreviewModeEditor
  StandaloneDocsEditor: typeof StandaloneDocsEditor
  SHOW_ALL_COMMENTS_COMMAND: typeof SHOW_ALL_COMMENTS_COMMAND
  exportDataFromEditorState: typeof exportDataFromEditorState
  getDocsLayoutScrollContainer: typeof getDocsLayoutScrollContainer
  getEditorStateFromSerializedNodes: typeof getEditorStateFromSerializedNodes
  rejectAllSuggestions: typeof rejectAllSuggestions
  removeCommentThreadMarks: typeof removeCommentThreadMarks
}

/** The Docs editor in `Containers/Docs`, used while `DocsEditorPackageEnabled` is off. */
export const docsContainerSource: DocsEditorSource = {
  DocsDependenciesProvider,
  DocsLayoutContainer,
  PreviewModeEditor,
  StandaloneDocsEditor,
  SHOW_ALL_COMMENTS_COMMAND,
  exportDataFromEditorState,
  getDocsLayoutScrollContainer,
  getEditorStateFromSerializedNodes,
  rejectAllSuggestions,
  removeCommentThreadMarks,
}

/**
 * Loads `@proton-docs/docs-editor` in its own chunk, so the app downloads it only when
 * `DocsEditorPackageEnabled` is on. The stylesheet loads only once the code has: it carries Tailwind
 * preflight, which must stay off the page when a failed load falls back to `Containers/Docs`.
 */
export async function loadDocsEditorPackage(): Promise<DocsEditorSource> {
  // The e2e suite tells which editor a Doc opened in by whether this chunk was requested.
  const docsEditorPackage = await import(/* webpackChunkName: "docs-editor-package" */ '@proton-docs/docs-editor')
  await import(/* webpackChunkName: "docs-editor-package-style" */ '@proton-docs/docs-editor/style.css')

  return {
    DocsDependenciesProvider: docsEditorPackage.DocsDependenciesProvider,
    DocsLayoutContainer: docsEditorPackage.DocsLayoutContainer,
    PreviewModeEditor: docsEditorPackage.PreviewModeEditor,
    StandaloneDocsEditor: docsEditorPackage.StandaloneDocsEditor,
    SHOW_ALL_COMMENTS_COMMAND: docsEditorPackage.SHOW_ALL_COMMENTS_COMMAND,
    exportDataFromEditorState: docsEditorPackage.exportDataFromEditorState,
    getDocsLayoutScrollContainer: docsEditorPackage.getDocsLayoutScrollContainer,
    getEditorStateFromSerializedNodes: docsEditorPackage.getEditorStateFromSerializedNodes,
    rejectAllSuggestions: docsEditorPackage.rejectAllSuggestions,
    removeCommentThreadMarks: docsEditorPackage.removeCommentThreadMarks,
  }
}
