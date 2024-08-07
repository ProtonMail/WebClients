import type { EditorState } from 'lexical'

export type DocxExportContext = {
  state: EditorState
  fetchExternalImageAsBase64: (url: string) => Promise<string | undefined>
}
