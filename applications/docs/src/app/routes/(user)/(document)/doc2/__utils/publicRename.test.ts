import { canRenamePublicDocument, renamePublicDocument } from './publicRename'

const MINE = { keyAuthor: { ok: true, value: 'visitor@proton.me' } } as const
const ALLOWED = {
  node: MINE,
  isSharedUrlAFolder: true,
  isEditor: true,
  addresses: ['other@proton.me', 'visitor@proton.me'],
}

describe('canRenamePublicDocument', () => {
  test('a signed-in editor on a link to a folder renames a document they created, however long ago', () => {
    expect(canRenamePublicDocument(ALLOWED)).toBe(true)
  })

  test("not another visitor's document, nor one by an anonymous visitor", () => {
    expect(
      canRenamePublicDocument({ ...ALLOWED, node: { ...MINE, keyAuthor: { ok: true, value: 'a@proton.me' } } }),
    ).toBe(false)
    expect(canRenamePublicDocument({ ...ALLOWED, node: { ...MINE, keyAuthor: { ok: true, value: null } } })).toBe(false)
  })

  test("the claimed author counts when the author's signature doesn't verify, as on Drive's public folder page", () => {
    const unverified = {
      ok: false,
      error: { claimedAuthor: 'visitor@proton.me', error: 'Signature mismatch' },
    } as const
    expect(canRenamePublicDocument({ ...ALLOWED, node: { ...MINE, keyAuthor: unverified } })).toBe(true)
  })

  test('not for an anonymous visitor, until the addresses load, on a document link, or for a viewer', () => {
    expect(canRenamePublicDocument({ ...ALLOWED, addresses: undefined })).toBe(false)
    expect(canRenamePublicDocument({ ...ALLOWED, addresses: [] })).toBe(false)
    expect(canRenamePublicDocument({ ...ALLOWED, isSharedUrlAFolder: false })).toBe(false)
    expect(canRenamePublicDocument({ ...ALLOWED, isEditor: false })).toBe(false)
  })
})

describe('renamePublicDocument', () => {
  test('renames through the share-URL client and returns the name Drive gave', async () => {
    const renameNode = vi.fn(async () => ({ name: { ok: true, value: 'Roadmap' } }))

    await expect(renamePublicDocument({ renameNode } as any, { uid: 'VOLUME~LINK' }, 'Roadmap')).resolves.toBe(
      'Roadmap',
    )
    expect(renameNode).toHaveBeenCalledWith('VOLUME~LINK', 'Roadmap')
  })

  test('fails as the share-URL client fails', async () => {
    const renameNode = vi.fn(async () => {
      throw new Error('Not allowed')
    })

    await expect(renamePublicDocument({ renameNode } as any, { uid: 'VOLUME~LINK' }, 'Roadmap')).rejects.toThrow(
      'Not allowed',
    )
  })
})
