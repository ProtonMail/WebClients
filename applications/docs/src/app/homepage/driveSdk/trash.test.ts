import type { ProtonDriveClient } from '@protontech/drive-sdk'
import { deleteDocument, restoreDocument, trashDocument } from './trash'

async function* results(items: unknown[]) {
  yield* items
}

const failure = { uid: 'vol~node', ok: false, error: { name: 'PermissionError', message: 'Insufficient permissions' } }

describe.each([
  { name: 'trashDocument', run: trashDocument, method: 'trashNodes' },
  { name: 'restoreDocument', run: restoreDocument, method: 'restoreNodes' },
  { name: 'deleteDocument', run: deleteDocument, method: 'deleteNodes' },
] as const)('$name', ({ run, method }) => {
  it(`calls ${method} with the node uid`, async () => {
    const drive = { [method]: jest.fn(() => results([{ uid: 'vol~node', ok: true }])) }

    await run(drive as unknown as ProtonDriveClient, 'vol~node')

    expect(drive[method]).toHaveBeenCalledWith(['vol~node'])
  })

  it('throws with the error name, message and uid when the node fails', async () => {
    const drive = { [method]: jest.fn(() => results([failure])) }

    await expect(run(drive as unknown as ProtonDriveClient, 'vol~node')).rejects.toThrow(
      'PermissionError: Insufficient permissions; UID=vol~node',
    )
  })
})
