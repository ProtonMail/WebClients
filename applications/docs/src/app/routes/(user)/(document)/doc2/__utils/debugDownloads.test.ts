import { CryptoProxy } from '@protontech/crypto'
import type { DebugArtifacts, DecryptedDocumentUpdate, HistoryEntry } from '@proton-docs/realtime-sdk'
import JSZip from 'jszip'

import { getAllUpdatesZip, getBaseCommitZip, getLogsZip } from './debugDownloads'

async function filesOf(zip: Blob) {
  const { files } = await JSZip.loadAsync(zip)
  return Promise.all(Object.values(files).map(async (file) => [file.name, await file.async('uint8array')]))
}

beforeAll(async () => {
  const { Api: CryptoApi } = await import('@protontech/crypto/proxy/endpoint/api.ts')
  CryptoApi.init({})
  CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore())
})

afterAll(() => CryptoProxy.releaseEndpoint())

describe('debug downloads', () => {
  test('all updates: one `${timestamp}-${sha1}.bin` file per History Log entry, in order', async () => {
    const zip = await getAllUpdatesZip(
      [
        historyEntry('u-1', 'baseState', 100, new Uint8Array([1, 2, 3])),
        historyEntry('u-2', 'sent', 200, new Uint8Array([4])),
      ],
      [],
    )

    expect(await filesOf(zip)).toEqual([
      // `sha1sum` of the bytes 01 02 03, and of 04
      ['100-7037807198c22a7d2b0807371d763779a84fdfcf.bin', new Uint8Array([1, 2, 3])],
      ['200-a42c6cf1de3abfdea9b95f34687cbbe92b9a7383.bin', new Uint8Array([4])],
    ])
  })

  test("all updates, while edits are pending: a sent one the server hasn't acknowledged, then the buffer's, each marked", async () => {
    const zip = await getAllUpdatesZip(
      [
        historyEntry('u-1', 'sent', 200, new Uint8Array([4])),
        historyEntry('u-2', 'sent', 300, new Uint8Array([5]), { acknowledged: false }),
      ],
      [
        { since: 400, content: new Uint8Array([6]) },
        { since: 400, content: new Uint8Array([7]) },
      ],
    )

    expect(await filesOf(zip)).toEqual([
      // `sha1sum` of the bytes 04, 05, 06 and 07
      ['200-a42c6cf1de3abfdea9b95f34687cbbe92b9a7383.bin', new Uint8Array([4])],
      ['300-8dc00598417d4eb788a77ac6ccef3cb484905d8b-unacknowledged.bin', new Uint8Array([5])],
      ['400-2d0134ed3b9de132c720fe697b532b4c232ff9fe-buffered.bin', new Uint8Array([6])],
      ['400-5d1be7e9dda1ee8896be5b7e34a85ee16452a7b4-buffered.bin', new Uint8Array([7])],
    ])
  })

  test("base commit: each readable update's plaintext as `${timestamp}.bin`, as /doc downloads it", async () => {
    const baseCommit: DebugArtifacts['baseCommit'] = {
      commitId: 'commit-1',
      updates: [
        {
          uuid: 'u-1',
          encrypted: new Uint8Array([9]),
          decrypted: decrypted(new Uint8Array([1]) as Uint8Array<ArrayBuffer>, 100),
        },
        { uuid: 'u-2', encrypted: new Uint8Array([9]), decrypted: undefined },
        { uuid: 'u-3', encrypted: new Uint8Array([9]), decrypted: decrypted(new Uint8Array([3]), 300) },
      ],
    }

    expect(await filesOf(await getBaseCommitZip(baseCommit))).toEqual([
      ['100.bin', new Uint8Array([1])],
      ['300.bin', new Uint8Array([3])],
    ])
  })

  test("logs: the editor's Y.Doc and editor state as JSON", async () => {
    const editorInvoker = {
      getYDocAsJSON: async () => ({ root: ['ydoc'] }),
      getCurrentEditorState: async () => ({ root: { type: 'root' } }) as never,
    }

    const files = await filesOf(await getLogsZip(editorInvoker, '2026-11-11T10-00-00-000Z'))

    expect(
      files.map(([name, content]) => [name, JSON.parse(new TextDecoder().decode(content as Uint8Array<ArrayBuffer>))]),
    ).toEqual([
      ['ydoc-2026-11-11T10-00-00-000Z.json', { root: ['ydoc'] }],
      ['editor-2026-11-11T10-00-00-000Z.json', { root: { type: 'root' } }],
    ])
  })
})

function decrypted(content: Uint8Array<ArrayBuffer>, timestamp: number) {
  return { content, timestamp, authorAddress: 'author@example.com' } as DecryptedDocumentUpdate
}

function historyEntry(
  uuid: string,
  origin: HistoryEntry['origin'],
  timestamp: number,
  content: Uint8Array<ArrayBuffer>,
  { acknowledged = true } = {},
): HistoryEntry {
  return { uuid, origin, timestamp, authorAddress: 'author@example.com', content, acknowledged }
}
