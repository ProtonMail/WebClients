import { createFakePublicSession, createFakeSession } from './createFakeSession'

describe('createFakePublicSession', () => {
  test('has no squash and an anonymous visitor by default', () => {
    const { session, mocks } = createFakePublicSession()

    expect('squash' in session).toBe(false)
    expect(session.getNodeMeta()).toEqual({ volumeId: 'VOLUME', linkId: 'LINK', userOwnAddress: undefined })
    expect(mocks.config.nodeMeta).toEqual({ token: 'TOKEN', linkId: 'LINK' })
  })

  test('takes the visitor’s own address when given one', () => {
    const { session } = createFakePublicSession({}, { userOwnAddress: 'visitor@example.com' })

    expect(session.getNodeMeta().userOwnAddress).toBe('visitor@example.com')
  })

  test('bootstraps into itself, and still emits and changes snapshots by hand', async () => {
    const { session, mocks, emit, setSnapshot, listenerCount } = createFakePublicSession({ caughtUp: false })
    const listener = vi.fn()
    const off = session.on('error' as never, listener as never)
    const seen = vi.fn()
    session.subscribe(seen)

    expect(await mocks.bootstrap()).toBe(session)
    emit('error' as never, 'boom' as never)
    setSnapshot({ caughtUp: true })

    expect(listener).toHaveBeenCalledWith('boom')
    expect(seen).toHaveBeenCalledTimes(1)
    expect(session.getSnapshot().caughtUp).toBe(true)
    off()
    expect(listenerCount()).toBe(0)
  })

  test('leaves the private fake unchanged', () => {
    const { session, mocks } = createFakeSession()

    expect(session.getNodeMeta().userOwnAddress).toBe('member@example.com')
    expect(mocks.squash).toBeDefined()
  })
})
