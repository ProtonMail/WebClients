import { CryptoProxy } from '@protontech/crypto'
import type { DebugArtifacts, DecryptedDocumentUpdate } from '@proton-docs/realtime-sdk'
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
  test('all updates: one `${timestamp}-${sha1}.bin` file per recorded update, in order', async () => {
    const zip = await getAllUpdatesZip([
      { origin: 'baseState', timestamp: 100, content: new Uint8Array([1, 2, 3]) },
      { origin: 'sent', timestamp: 200, content: new Uint8Array([4]) },
    ])

    expect(await filesOf(zip)).toEqual([
      // `sha1sum` of the bytes 01 02 03, and of 04
      ['100-7037807198c22a7d2b0807371d763779a84fdfcf.bin', new Uint8Array([1, 2, 3])],
      ['200-a42c6cf1de3abfdea9b95f34687cbbe92b9a7383.bin', new Uint8Array([4])],
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
