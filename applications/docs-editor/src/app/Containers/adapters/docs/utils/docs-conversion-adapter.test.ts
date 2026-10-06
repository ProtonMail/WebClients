import { toDocsExportFormat, toDocsInitialization } from './docs-conversion-adapter'

describe('toDocsInitialization', () => {
  it('preserves existing and newly created document initialization', () => {
    expect(toDocsInitialization(undefined)).toBeUndefined()
    expect(toDocsInitialization({ mode: 'creation' })).toEqual({ mode: 'creation' })
  })

  it.each(['txt', 'md', 'html', 'json', 'docx', 'odt'] as const)(
    'maps a %s conversion without copying its bytes',
    (dataType) => {
      const source = new Uint8Array(new ArrayBuffer(8), 2, 4)
      const result = toDocsInitialization({
        mode: 'conversion',
        data: source,
        type: { docType: 'doc', dataType },
      })

      expect(result).toEqual({ mode: 'conversion', data: source, type: { docType: 'doc', dataType } })
      if (result?.mode !== 'conversion') {
        throw new Error('Expected a conversion initialization')
      }
      expect(result.data).toBe(source)
      expect(result.data.byteOffset).toBe(2)
      expect(result.data.byteLength).toBe(4)
    },
  )

  it.each(['doc', 'sheet'] as const)('rejects all spreadsheet formats with docType %s', (docType) => {
    for (const dataType of ['xlsx', 'csv', 'tsv', 'ods'] as const) {
      expect(() =>
        toDocsInitialization({ mode: 'conversion', data: new Uint8Array(), type: { docType, dataType } }),
      ).toThrow(`Unsupported Docs conversion: ${docType}/${dataType}`)
    }
  })

  it('rejects a sheet conversion even with a document format', () => {
    expect(() =>
      toDocsInitialization({ mode: 'conversion', data: new Uint8Array(), type: { docType: 'sheet', dataType: 'txt' } }),
    ).toThrow('Unsupported Docs conversion: sheet/txt')
  })
})

describe('toDocsExportFormat', () => {
  it.each(['docx', 'odt', 'html', 'txt', 'md', 'yjs'] as const)('accepts %s document exports', (format) => {
    expect(toDocsExportFormat(format)).toBe(format)
  })

  it.each(['xlsx', 'csv', 'tsv', 'ods'] as const)('rejects %s spreadsheet exports', (format) => {
    expect(() => toDocsExportFormat(format)).toThrow(`Unsupported format: ${format}`)
  })
})
