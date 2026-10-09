import { createStandaloneDocSession } from './session'

function setup() {
  const ready = jest.fn()
  const error = jest.fn()
  const session = createStandaloneDocSession(ready, error)
  return { session, ready, error }
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

  it('replays awareness to late subscribers and stops delivering after unsubscribe or disposal', () => {
    const { session } = setup()
    const state = {
      name: 'Local user',
      color: '#abc',
      focusing: false,
      anchorPos: null,
      focusPos: null,
      awarenessData: undefined,
    }
    const first = jest.fn()
    const second = jest.fn()
    try {
      session.docState.awareness.setLocalState(state)
      const unsubscribe = session.subscribeToAwarenessStates(first)
      expect(first).toHaveBeenLastCalledWith([state])
      const next = { ...state, name: 'Renamed user' }
      session.docState.awareness.setLocalState(next)
      expect(first).toHaveBeenLastCalledWith([next])
      session.subscribeToAwarenessStates(second)
      expect(second).toHaveBeenLastCalledWith([next])
      unsubscribe()
      first.mockClear()
      session.docState.awareness.setLocalState(state)
      expect(first).not.toHaveBeenCalled()
      expect(second).toHaveBeenLastCalledWith([state])
      second.mockClear()
      session.destroy()
      expect(second).not.toHaveBeenCalled()
      session.subscribeToAwarenessStates(first)
      expect(first).not.toHaveBeenCalled()
    } finally {
      session.destroy()
    }
  })

  it('keeps a cached page live and disposes it on an actual page exit', () => {
    const { session, ready } = setup()
    const removeLifecycle = session.attachPageLifecycle()
    const docDestroyed = jest.fn()
    session.docState.getDoc().on('destroy', docDestroyed)
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))
    session.editorLoaded()
    expect(ready).toHaveBeenCalledTimes(1)
    expect(session.docMap.get(session.documentId)).toBe(session.docState.getDoc())
    expect(docDestroyed).not.toHaveBeenCalled()
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }))
    expect(docDestroyed).toHaveBeenCalledTimes(1)
    expect(session.docMap.size).toBe(0)
    removeLifecycle()
    expect(docDestroyed).toHaveBeenCalledTimes(1)
  })

  it('removes the page lifecycle listener and disposes on unmount', () => {
    const { session } = setup()
    const destroy = jest.fn()
    session.docState.getDoc().on('destroy', destroy)
    session.attachPageLifecycle()()
    expect(destroy).toHaveBeenCalledTimes(1)
    window.dispatchEvent(new PageTransitionEvent('pagehide'))
    expect(destroy).toHaveBeenCalledTimes(1)
  })
})
