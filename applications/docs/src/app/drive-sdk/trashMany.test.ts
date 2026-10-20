import { restoreDocuments, trashDocuments } from './trashMany'

const mockTrashNodes = jest.fn()
const mockRestoreNodes = jest.fn()

jest.mock('@proton/drive', () => ({
  ...jest.requireActual('@proton/drive'),
  getDrive: () => ({ trashNodes: mockTrashNodes, restoreNodes: mockRestoreNodes }),
}))

async function* yieldThenThrow(items: unknown[], error?: Error) {
  yield* items
  if (error) {
    throw error
  }
}

describe('trashDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns all uids as succeeded when every node is trashed', async () => {
    mockTrashNodes.mockReturnValue(
      yieldThenThrow([
        { uid: 'a', ok: true },
        { uid: 'b', ok: true },
      ]),
    )

    await expect(trashDocuments(['a', 'b'])).resolves.toEqual({ succeeded: ['a', 'b'], failed: [] })
    expect(mockTrashNodes).toHaveBeenCalledTimes(1)
    expect(mockTrashNodes).toHaveBeenCalledWith(['a', 'b'])
  })

  it('wraps per-node errors with name, message and uid', async () => {
    mockTrashNodes.mockReturnValue(
      yieldThenThrow([
        { uid: 'a', ok: true },
        { uid: 'b', ok: false, error: { name: 'ValidationError', message: 'nope' } },
      ]),
    )

    const { succeeded, failed } = await trashDocuments(['a', 'b'])

    expect(succeeded).toEqual(['a'])
    expect(failed[0].uid).toBe('b')
    expect(failed[0].error.message).toBe('ValidationError: nope; UID=b')
  })

  it('keeps results yielded before a thrown error and fails the rest with that error', async () => {
    const error = new Error('network')
    mockTrashNodes.mockReturnValue(yieldThenThrow([{ uid: 'a', ok: true }], error))

    const { succeeded, failed } = await trashDocuments(['a', 'b', 'c'])

    expect(succeeded).toEqual(['a'])
    expect(failed.map((f) => f.uid)).toEqual(['b', 'c'])
    failed.forEach((f) => expect(f.error).toBe(error))
  })

  it('fails every uid when the SDK throws before yielding', async () => {
    const error = new Error('network')
    mockTrashNodes.mockReturnValue(yieldThenThrow([], error))

    const { succeeded, failed } = await trashDocuments(['a', 'b'])

    expect(succeeded).toEqual([])
    expect(failed).toHaveLength(2)
    failed.forEach((f) => expect(f.error).toBe(error))
  })
})

describe('restoreDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('uses restoreNodes and collects results', async () => {
    mockRestoreNodes.mockReturnValue(
      yieldThenThrow([
        { uid: 'a', ok: true },
        { uid: 'b', ok: false, error: { name: 'ValidationError', message: 'nope' } },
      ]),
    )

    const { succeeded, failed } = await restoreDocuments(['a', 'b'])

    expect(mockRestoreNodes).toHaveBeenCalledWith(['a', 'b'])
    expect(mockTrashNodes).not.toHaveBeenCalled()
    expect(succeeded).toEqual(['a'])
    expect(failed).toHaveLength(1)
  })
})
