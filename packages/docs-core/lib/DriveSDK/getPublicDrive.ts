import type { ProtonDrivePublicLinkClient } from '@proton/drive'
import type { SHARE_URL_PERMISSIONS } from '@proton/shared/lib/drive/permissions'

export type PublicLinkInfo = {
  customPassword: string
  linkId: string | undefined
  volumeId: string
  isSharedUrlAFolder: boolean
  permissions: SHARE_URL_PERMISSIONS
  /**
   * Whether the signed-in viewer has direct (non-public) access to the document.
   * Undefined when it can't be known from the public link alone, see `hasDirectAccessToPublicNode`.
   */
  hasDirectAccess: boolean | undefined
}

/**
 * Holds the public link client authenticated for the currently opened public document,
 * together with the info derived from its root node.
 * The client is set once the public link is authenticated with the Drive SDK, the info once the root node is loaded.
 */
let currentPublicDrive: ProtonDrivePublicLinkClient | undefined
let currentPublicLinkInfo: PublicLinkInfo | undefined

export function setPublicDrive(client: ProtonDrivePublicLinkClient) {
  currentPublicDrive = client
}

export function setPublicLinkInfo(info: PublicLinkInfo) {
  currentPublicLinkInfo = info
}

export function getPublicDrive(): ProtonDrivePublicLinkClient {
  if (!currentPublicDrive) {
    throw new Error('Public drive not initialized')
  }
  return currentPublicDrive
}

export function getPublicLinkInfo(): PublicLinkInfo {
  if (!currentPublicLinkInfo) {
    throw new Error('Public link info not initialized')
  }
  return currentPublicLinkInfo
}
