import type {
  resolveDefaultWorkbookLocale,
  SheetsDependenciesProvider,
  StandaloneSheetsEditor,
} from '@proton-docs/sheets-editor'

/**
 * The Sheets editor exports the app uses at runtime. They come from one lazily loaded chunk, so Docs
 * never downloads the Sheets editor.
 */
export type SheetsEditorSource = {
  SheetsDependenciesProvider: typeof SheetsDependenciesProvider
  StandaloneSheetsEditor: typeof StandaloneSheetsEditor
  resolveDefaultWorkbookLocale: typeof resolveDefaultWorkbookLocale
}

/**
 * Loads `@proton-docs/sheets-editor` and its stylesheet in their own chunks. The stylesheet carries
 * Tailwind preflight, which must stay off the page for Docs.
 */
export async function loadSheetsEditorPackage(): Promise<SheetsEditorSource> {
  const sheetsEditorPackage = await import(/* webpackChunkName: "sheets-editor-package" */ '@proton-docs/sheets-editor')
  await import(/* webpackChunkName: "sheets-editor-package-style" */ '@proton-docs/sheets-editor/style.css')

  return {
    SheetsDependenciesProvider: sheetsEditorPackage.SheetsDependenciesProvider,
    StandaloneSheetsEditor: sheetsEditorPackage.StandaloneSheetsEditor,
    resolveDefaultWorkbookLocale: sheetsEditorPackage.resolveDefaultWorkbookLocale,
  }
}
