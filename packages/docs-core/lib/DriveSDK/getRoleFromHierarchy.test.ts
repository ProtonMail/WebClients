import { MemberRole, type NodeEntity } from '@proton/drive/sdk'
import { getRoleFromHierarchy } from './getRoleFromHierarchy'

describe('getRoleFromHierarchy', () => {
  test('ancestor role overrides lower role of node', () => {
    expect(getRoleFromHierarchy(createHierarchy(MemberRole.Viewer, MemberRole.Inherited, MemberRole.Admin))).toBe(
      MemberRole.Admin,
    )
  })

  test('node role is not lowered by ancestors', () => {
    expect(getRoleFromHierarchy(createHierarchy(MemberRole.Editor, MemberRole.Viewer))).toBe(MemberRole.Editor)
  })

  test('inherited node role resolves to ancestor role', () => {
    expect(getRoleFromHierarchy(createHierarchy(MemberRole.Inherited, MemberRole.Editor))).toBe(MemberRole.Editor)
  })
})

function createHierarchy(...roles: MemberRole[]) {
  return roles.map((directRole) => ({ directRole }) as NodeEntity)
}
