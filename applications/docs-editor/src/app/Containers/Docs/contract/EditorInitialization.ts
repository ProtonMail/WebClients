/** Data formats accepted by the Docs editor's conversion pipeline. */
export type ConvertibleDataType = {
  docType: 'doc'
  dataType: 'txt' | 'md' | 'html' | 'json' | 'docx' | 'odt'
}

export type EditorInitializationConfig =
  { mode: 'creation' } | { mode: 'conversion'; data: Uint8Array<ArrayBuffer>; type: ConvertibleDataType }

export type DataTypesThatDocumentCanBeExportedAs = 'docx' | 'odt' | 'html' | 'txt' | 'md' | 'yjs'
