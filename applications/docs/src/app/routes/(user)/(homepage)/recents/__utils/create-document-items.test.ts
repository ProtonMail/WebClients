import { MemberRole, type NodeEntity } from '@proton/drive/sdk'
import { createDocumentItem } from './create-document-items'

describe('createDocumentItem', () => {
  test('location is shared with me even if document has path', () => {
    const item = createDocumentItem(createNode(), { ...documentDetails, isSharedWithMe: true, path: ['Folder'] })

    expect(item.location).toEqual({ type: 'shared-with-me' })
  })

  test('takes volume, link and parent link IDs from node UIDs', () => {
    const item = createDocumentItem({ ...createNode(), parentUid: 'volume1~folder' }, documentDetails)

    expect(item).toMatchObject({ volumeId: 'volume1', linkId: 'doc', parentLinkId: 'folder' })
  })

  test('throws on a malformed node UID', () => {
    expect(() => createDocumentItem({ ...createNode(), uid: 'volume1' }, documentDetails)).toThrow(
      '"volume1" is not a valid node UID',
    )
  })
})

const documentDetails = {
  isSharedWithMe: false,
  path: [],
  ancestorsNodeUids: [],
  effectiveRole: MemberRole.Admin,
  lastOpenTime: 1000,
}

function createNode(): NodeEntity {
  return {
    uid: 'volume1~doc',
    name: { ok: true, value: 'Document' },
    keyAuthor: { ok: true, value: 'author@example.com' },
    directRole: MemberRole.Admin,
    mediaType: 'application/vnd.proton.doc',
  } as NodeEntity
}
