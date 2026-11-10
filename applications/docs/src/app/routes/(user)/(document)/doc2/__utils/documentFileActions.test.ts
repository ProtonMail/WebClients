import { getDrive } from '@proton/drive/sdk'

import {
  getDriveFolderPath,
  getNewDocumentHref,
  getSpreadsheetHref,
  restoreNode,
  trashNode,
} from './documentFileActions'

jest.mock('@proton/drive/sdk', () => ({ ...jest.requireActual('@proton/drive/sdk'), getDrive: jest.fn() }))

const drive = { trashNodes: jest.fn(), restoreNodes: jest.fn(), getNodeHierarchy: jest.fn() }

async function* results(...items: ({ ok: true } | { ok: false; error: Error })[]) {
  for (const item of items) {
    yield { uid: 'VOLUME~LINK', ...item }
  }
}

describe('documentFileActions', () => {
  beforeEach(() => jest.mocked(getDrive).mockReturnValue(drive as unknown as ReturnType<typeof getDrive>))
  afterEach(() => jest.clearAllMocks())

  test('getNewDocumentHref creates in the sibling folder, without a local ID too', () => {
    expect(getNewDocumentHref({ uid: 'VOLUME~LINK', parentUid: 'VOLUME~PARENT' }, undefined)).toBe(
      'http://docs.localhost/doc2?mode=create&volumeId=VOLUME&parentLinkId=PARENT',
    )
  })

  test('getSpreadsheetHref opens legacy sheets', () => {
    expect(getSpreadsheetHref({ volumeId: 'VOLUME', linkId: 'SHEET' }, 0)).toBe(
      'http://docs.localhost/u/0/sheet?mode=open&volumeId=VOLUME&linkId=SHEET',
    )
  })

  test("getDriveFolderPath without the root's share ID opens the Drive root", async () => {
    drive.getNodeHierarchy.mockResolvedValue([{ uid: 'VOLUME~ROOT', directRole: 'admin' }])

    await expect(getDriveFolderPath({ uid: 'VOLUME~LINK', parentUid: 'VOLUME~PARENT' })).resolves.toBe('/')
  })

  test.each([
    ['trashNode', trashNode, drive.trashNodes],
    ['restoreNode', restoreNode, drive.restoreNodes],
  ] as const)('%s resolves on success and throws a failed result', async (_name, run, sdkCall) => {
    sdkCall.mockImplementationOnce(() => results({ ok: true }))
    await expect(run('VOLUME~LINK')).resolves.toBeUndefined()
    expect(sdkCall).toHaveBeenCalledWith(['VOLUME~LINK'])

    sdkCall.mockImplementationOnce(() => results({ ok: false, error: new Error('Insufficient permissions') }))
    await expect(run('VOLUME~LINK')).rejects.toThrow('Error: Insufficient permissions; UID=VOLUME~LINK')
  })
})
