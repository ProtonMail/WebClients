import { createStandaloneSession } from './session'

function setup() {
  const ready = jest.fn()
  const error = jest.fn()
  const session = createStandaloneSession(ready, error)
  return { session, ready, error }
}

describe('standalone-sheet initialization', () => {
  it('waits for editor observers, applies the fixture, then signals readiness exactly once', () => {
    const { session, ready, error } = setup()
    try {
      const doc = session.docState.getDoc()
      const changes: string[] = []
      doc.getArray('sheets').observe(() => changes.push('sheets'))
      doc.getMap('sheetDataV2').observeDeep(() => changes.push('cells'))
      ready.mockImplementation(() => {
        expect(changes).toEqual(expect.arrayContaining(['sheets', 'cells']))
        expect(doc.getMap('kv').get('version')).toBe(2)
      })
      expect(doc.getArray('sheets').length).toBe(0)
      expect(ready).not.toHaveBeenCalled()
      session.editorLoaded()
      session.editorLoaded()
      expect(ready).toHaveBeenCalledTimes(1)
      expect(doc.getArray('sheets').toJSON()[0].title).toBe('Standalone fixture')
      expect(doc.getMap('sheetDataV2').toJSON()['1'][2].values[3]).toEqual({
        formattedValue: '6',
        userEnteredValue: { formulaValue: '=A2*B2' },
        effectiveValue: { numberValue: 6 },
      })
      expect(error).not.toHaveBeenCalled()
    } finally {
      session.destroy()
    }
  })

  it('keeps separate sessions independent and does not initialize after disposal', () => {
    const first = setup()
    const second = setup()
    try {
      first.session.editorLoaded()
      expect(second.session.docState.getDoc().getArray('sheets').length).toBe(0)
      second.session.destroy()
      second.session.editorLoaded()
      expect(second.ready).not.toHaveBeenCalled()
    } finally {
      first.session.destroy()
      second.session.destroy()
    }
  })
})
