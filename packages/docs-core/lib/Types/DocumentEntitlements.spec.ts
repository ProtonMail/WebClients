import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions'
import { rawPermissionToRole } from './DocumentEntitlements'

describe('DocumentEntitlements', () => {
  describe('rawPermissionToRole', () => {
    it('should return Admin role for Admin permission', () => {
      const result = rawPermissionToRole(SHARE_MEMBER_PERMISSIONS.ADMIN_EDITOR)

      expect(result.roleType).toEqual('Admin')
    })

    it('should return Editor role for Write permission', () => {
      const result = rawPermissionToRole(SHARE_MEMBER_PERMISSIONS.EDITOR)

      expect(result.roleType).toEqual('Editor')
    })

    it('should return Admin role for Owner permission', () => {
      const result = rawPermissionToRole(SHARE_MEMBER_PERMISSIONS.OWNER)

      expect(result.roleType).toEqual('Admin')
    })

    it('should return Viewer role for Read permission', () => {
      const result = rawPermissionToRole(SHARE_MEMBER_PERMISSIONS.VIEWER)

      expect(result.roleType).toEqual('Viewer')
    })
  })
})
