import { toSheetsInitialization } from './sheetsInitializationAdapter'

describe('toSheetsInitialization', () => {
  it('maps an existing spreadsheet and a newly created spreadsheet', () => {
    expect(toSheetsInitialization(undefined)).toEqual({ mode: 'existing' })
    expect(toSheetsInitialization({ mode: 'creation' })).toEqual({ mode: 'creation' })
  })

  it.each(['csv', 'tsv', 'xlsx', 'ods'] as const)('maps a %s conversion without copying its bytes', (dataType) => {
    const source = new Uint8Array(new ArrayBuffer(8), 2, 4)

    const result = toSheetsInitialization({
      mode: 'conversion',
      data: source,
      type: { docType: 'sheet', dataType },
    })

    expect(result).toEqual({ mode: 'conversion', data: source, dataType })
    if (result.mode !== 'conversion') {
      throw new Error('Expected a conversion initialization')
    }
    expect(result.data).toBe(source)
    expect(result.data.byteOffset).toBe(2)
    expect(result.data.byteLength).toBe(4)
  })
})
