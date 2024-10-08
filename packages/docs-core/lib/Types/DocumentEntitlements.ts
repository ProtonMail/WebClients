import { getCanWrite, getCanAdmin, getIsOwner } from '@proton/shared/lib/drive/permissions'
import type { DocumentKeys } from '@proton/drive-store'
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants'
import { DocumentRole } from '@proton/docs-shared'

export type DocumentEntitlements = {
  keys: DocumentKeys
  role: DocumentRole
}

export type PublicDocumentEntitlements = {
  keys: Pick<DocumentKeys, 'documentContentKey'>
  role: DocumentRole
}

export function rawPermissionToRole(permission: SHARE_MEMBER_PERMISSIONS): DocumentRole {
  if (getCanAdmin(permission)) {
    return new DocumentRole('Admin')
  }

  if (getCanWrite(permission)) {
    return new DocumentRole('Editor')
  }

  if (getIsOwner(permission)) {
    return new DocumentRole('Admin')
  }

  return new DocumentRole('Viewer')
}
