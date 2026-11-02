import { SheetsDependenciesProvider, StandaloneSheetsEditor } from '../../Spreadsheet/public'

/** The editor and its dependencies context must come from the same editor, so they are picked together. */
export type SheetsEditorSource = {
  SheetsDependenciesProvider: typeof SheetsDependenciesProvider
  StandaloneSheetsEditor: typeof StandaloneSheetsEditor
}

/** The Sheets editor in `Containers/Spreadsheet`, used while `SheetsEditorPackageEnabled` is off. */
export const sheetsContainerSource: SheetsEditorSource = { SheetsDependenciesProvider, StandaloneSheetsEditor }

/**
 * The stylesheet loads only once the code has: it carries Tailwind preflight, which must stay off the
 * page when a failed load falls back to `Containers/Spreadsheet`.
 */
export async function loadSheetsEditorPackage(): Promise<SheetsEditorSource> {
  const sheetsEditorPackage = await import('@proton-docs/sheets-editor')
  await import('@proton-docs/sheets-editor/style.css')

  return {
    SheetsDependenciesProvider: sheetsEditorPackage.SheetsDependenciesProvider,
    StandaloneSheetsEditor: sheetsEditorPackage.StandaloneSheetsEditor,
  }
}
