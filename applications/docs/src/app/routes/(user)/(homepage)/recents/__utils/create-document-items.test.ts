import { MemberRole, type NodeEntity } from '@proton/drive'
import { createDocumentItem } from './create-document-items'

describe('createDocumentItem', () => {
  test('location is shared with me even if document has path', () => {
    const item = createDocumentItem(createNode(), { ...documentDetails, isSharedWithMe: true, path: ['Folder'] })

    expect(item.location).toEqual({ type: 'shared-with-me' })
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
