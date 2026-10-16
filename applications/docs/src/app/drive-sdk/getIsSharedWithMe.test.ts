import { MemberRole, type NodeEntity } from '@proton/drive'
import { getIsSharedWithMe } from './getIsSharedWithMe'

describe('getIsSharedWithMe', () => {
  test('directly shared node is shared with me', () => {
    expect(getIsSharedWithMe({ membership: {}, directRole: MemberRole.Editor } as NodeEntity)).toBe(true)
  })

  test('node in shared folder is shared with me', () => {
    expect(getIsSharedWithMe({ directRole: MemberRole.Inherited } as NodeEntity)).toBe(true)
  })

  test('own node is not shared with me', () => {
    expect(getIsSharedWithMe({ directRole: MemberRole.Admin } as NodeEntity)).toBe(false)
  })
})
