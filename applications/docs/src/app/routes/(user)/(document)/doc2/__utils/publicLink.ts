import type { DocumentAction } from '@proton/docs-shared/DocumentAction'
import { type NodeEntity, type ProtonDrivePublicLinkClient, getDrive } from '@proton/drive/sdk'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import type { SHARE_URL_PERMISSIONS } from '@proton/shared/lib/drive/permissions'
import { getAuthHeaders, getUIDHeaders } from '@proton/shared/lib/fetch/headers'
import type { UserModel } from '@proton/shared/lib/interfaces/User'
import type { PrivateNodeMeta } from '@proton-docs/realtime-sdk'

import type { ProviderType } from '../../../../../provider-type'
import { DOCUMENT_V2_PATH } from '~/utils/docs-url-bar'

import type { DocumentRole } from './getDocumentRole'

/** What the share URL's sign-in gave, handed to doc2's public page so that doc2 reads none of it from docs-core */
export type PublicLinkHandoff = {
  /** The share-URL client */
  publicDrive: ProtonDrivePublicLinkClient
  /** The link, from its root node */
  linkInfo: {
    /** The document's link id: the root's for a link to the document, the URL's for a link to a folder */
    linkId: string
    volumeId: string
    permissions: SHARE_URL_PERMISSIONS
    isSharedUrlAFolder: boolean
    /** Whether a signed-in visitor can reach the document as a member; undefined when only Drive can tell */
    hasDirectAccess: boolean | undefined
  }
  /** The signed-in visitor; undefined for an anonymous one */
  user?: UserModel
  providerType: ProviderType
}

/**
 * The visitor's role: an editor link makes an editor only while public editing is on. Adapted from
 * `packages/docs-core/lib/UseCase/LoadDocument.ts`, its public role rule; a visitor with access of their own is
 * redirected before it applies.
 */
export function getPublicDocumentRole({
  isEditorLink,
  publicEditing,
}: {
  isEditorLink: boolean
  publicEditing: boolean
}): DocumentRole {
  return publicEditing && isEditorLink ? 'Editor' : 'Viewer'
}

/**
 * Whether a signed-in visitor can reach the document as a member, from the link when it tells, and otherwise from the
 * visitor's own Drive client, since a public node carries no per-user permissions. Adapted from
 * `packages/docs-core/lib/DriveSDK/hasDirectAccessToPublicNode.ts`.
 */
export async function hasAccessOfOwn(
  linkInfo: Pick<PublicLinkHandoff['linkInfo'], 'hasDirectAccess'>,
  node: Pick<NodeEntity, 'uid'>,
): Promise<boolean> {
  if (linkInfo.hasDirectAccess !== undefined) {
    return linkInfo.hasDirectAccess
  }
  return getDrive()
    .getNode(node.uid)
    .then(
      () => true,
      () => false,
    )
}

/**
 * The document's private URL in doc2, under the visitor's local id. Adapted from
 * `packages/docs-shared/lib/URL/getDocumentActionUrl.ts`, with `/doc2` in place of the type's path.
 */
export function getPrivateDocumentUrl({ volumeId, linkId }: PrivateNodeMeta, localID: number | undefined): string {
  const url = new URL(getAppHref(DOCUMENT_V2_PATH, APPS.PROTONDOCS, localID))
  url.searchParams.append('mode', 'open')
  url.searchParams.append('volumeId', volumeId)
  url.searchParams.append('linkId', linkId)
  return url.toString()
}

/**
 * The public link's URL in doc2, `/doc2?mode=open-url`, for a return from sign-in. Adapted from
 * `applications/docs/src/app/utils/docs-url-bar.tsx`, its `navigateToAction` for a public action, which names `/doc`.
 */
export function getPublicLinkUrl(
  action: Extract<DocumentAction, { mode: 'open-url-reauth' }>,
  urlPassword: string,
): string {
  const url = new URL(DOCUMENT_V2_PATH, window.location.origin)
  url.searchParams.set('mode', 'open-url')
  url.searchParams.set('type', action.type)
  if (action.linkId) {
    url.searchParams.set('linkId', action.linkId)
  }
  if (action.action) {
    url.searchParams.set('action', action.action)
  }
  url.searchParams.set('token', action.token)
  url.hash = urlPassword
  return url.toString()
}

/**
 * The share-URL session's headers, which the public client's Docs API requests carry. Copied from
 * `packages/docs-core/lib/DriveSDK/getPublicAuthHeaders.ts`, with the client passed in.
 */
export function getPublicAuthHeaders(publicDrive: Pick<ProtonDrivePublicLinkClient, 'experimental'>) {
  const { uid, accessToken } = publicDrive.experimental.getSessionInfo()
  // SDK returns access token only for newly created session, logged-in user re-uses own session.
  // Unlike legacy, which always sends the public session access token.
  return accessToken ? getAuthHeaders(uid, accessToken) : getUIDHeaders(uid)
}
