import { MemberRole } from '@proton/drive/sdk'

import { getDocumentRole } from './getDocumentRole'

describe('getDocumentRole', () => {
  test.each([
    [[MemberRole.Admin], 'Admin'],
    [[MemberRole.Editor], 'Editor'],
    [[MemberRole.Viewer], 'Viewer'],
    [[MemberRole.Inherited, MemberRole.Editor, MemberRole.Viewer], 'Editor'],
    [[MemberRole.Viewer, MemberRole.Admin], 'Admin'],
    [[MemberRole.Inherited, MemberRole.Inherited], 'Viewer'],
    [[], 'Viewer'],
  ])('a hierarchy with roles %j is %s', (roles, role) => {
    expect(getDocumentRole(roles.map((directRole) => ({ directRole })))).toBe(role)
  })
})
