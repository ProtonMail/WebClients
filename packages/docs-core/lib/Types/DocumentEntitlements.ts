import { getCanWrite, getCanAdmin, getIsOwner } from '@proton/shared/lib/drive/permissions'
import type { DocumentKeys, PublicDocumentKeys } from '@proton/drive-store/lib/_documents/DocumentKeys'
import { isPublicNodeMeta } from '@proton/drive-store/lib/NodeMeta'
import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store/lib/NodeMeta'
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions'
import { DocumentRole } from '@proton/docs-shared'
import type { PrivateKeyReference } from '@proton/crypto'

export type DocumentEntitlements = {
  keys: DocumentKeys
  nodeMeta: NodeMeta
}

export type PublicDocumentEntitlements = {
  keys: PublicDocumentKeys
  nodeMeta: PublicNodeMeta
}

export function isPublicDocumentEntitlements(
  entitlements: PublicDocumentEntitlements | DocumentEntitlements,
): entitlements is PublicDocumentEntitlements {
  return isPublicNodeMeta(entitlements.nodeMeta)
}

/** Returns true if the keychain contains a private key that can be used to sign data */
export function canKeysSign(keys: {
  userAddressPrivateKey?: PrivateKeyReference
}): keys is { userAddressPrivateKey: PrivateKeyReference; userOwnAddress: string } {
  return keys.userAddressPrivateKey !== undefined
}

export function doKeysBelongToAuthenticatedUser(keys: { userAddressPrivateKey?: PrivateKeyReference }): boolean {
  return canKeysSign(keys)
}

export function rawPermissionToRole(permission: SHARE_MEMBER_PERMISSIONS): DocumentRole {
  if (getCanAdmin(permission)) {
    return new DocumentRole('Admin')
  }

  if (getCanWrite(permission)) {
    return new DocumentRole('Editor')
  }

  if (getIsOwner(permission)) {
    return new DocumentRole('Owner')
  }

  return new DocumentRole('Viewer')
}
