import { getCanWrite, getCanAdmin, getIsOwner } from '@proton/shared/lib/drive/permissions'
import type { DocumentKeys, NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions'
import { DocumentRole } from '@proton/docs-shared'

export type DocumentEntitlements = {
  keys: DocumentKeys
  nodeMeta: NodeMeta
}

export type PublicDocumentKeys = Pick<DocumentKeys, 'documentContentKey'>

export type PublicDocumentEntitlements = {
  keys: PublicDocumentKeys
  nodeMeta: PublicNodeMeta
}

export function isPublicDocumentEntitlements(
  entitlements: PublicDocumentEntitlements | DocumentEntitlements,
): entitlements is PublicDocumentEntitlements {
  return isPublicDocumentKeys(entitlements.keys)
}

export function isPrivateDocumentEntitlements(
  entitlements: PublicDocumentEntitlements | DocumentEntitlements,
): entitlements is DocumentEntitlements {
  return isPrivateDocumentKeys(entitlements.keys)
}

export function isPublicDocumentKeys(keys: DocumentKeys | PublicDocumentKeys): keys is PublicDocumentKeys {
  return !('userAddressPrivateKey' in keys)
}

export function isPrivateDocumentKeys(keys: DocumentKeys | PublicDocumentKeys): keys is DocumentKeys {
  return 'userAddressPrivateKey' in keys
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
