import { createStandaloneDocSession } from './session'

function setup() {
  const ready = jest.fn()
  const error = jest.fn()
  const awareness = jest.fn()
  const session = createStandaloneDocSession(ready, error, awareness)
  return { session, ready, error, awareness }
}

describe('standalone-doc initialization', () => {
  it('binds the editor map to DocState and signals readiness only after the editor loads', () => {
    const { session, ready, error } = setup()
    try {
      expect(session.docMap.get(session.documentId)).toBe(session.docState.getDoc())
      expect(session.initialization).toMatchObject({ mode: 'conversion', type: { docType: 'doc', dataType: 'md' } })
      expect(ready).not.toHaveBeenCalled()
      session.editorLoaded()
      session.editorLoaded()
      expect(ready).toHaveBeenCalledTimes(1)
      expect(error).not.toHaveBeenCalled()
    } finally {
      session.destroy()
    }
  })

  it('keeps separate sessions independent and disposes the doc and awareness once', () => {
    const first = setup()
    const second = setup()
    const docDestroyed = jest.fn()
    const awarenessDestroyed = jest.fn()
    first.session.docState.getDoc().on('destroy', docDestroyed)
    first.session.docState.awareness.on('destroy', awarenessDestroyed)
    try {
      first.session.docState.getDoc().getMap('fixture').set('text', 'local edit')
      expect(second.session.docState.getDoc().getMap('fixture').size).toBe(0)
      first.session.destroy()
      first.session.destroy()
      first.session.editorLoaded()
      expect(first.ready).not.toHaveBeenCalled()
      expect(first.session.docMap.size).toBe(0)
      expect(docDestroyed).toHaveBeenCalledTimes(1)
      expect(awarenessDestroyed).toHaveBeenCalledTimes(1)
    } finally {
      first.session.destroy()
      second.session.destroy()
    }
  })
})
