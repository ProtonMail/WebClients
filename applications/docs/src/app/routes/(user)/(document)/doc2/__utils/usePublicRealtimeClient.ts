import { useCallback, useState } from 'react'

import { useGetAddresses } from '@proton/account/addresses/hooks'
import { useGetAddressKeys } from '@proton/account/addressKeys/hooks'
import { useApi } from '@proton/app-context/useApi'
import { useConfig } from '@proton/app-context/useConfig'
import { type Author, generateNodeUid, getDrive } from '@proton/drive/sdk'
import { getClientID } from '@proton/shared/lib/apps/helper'
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors'
import { getAppVersionStr } from '@proton/shared/lib/fetch/headers'
import { getIsAddressEnabled } from '@proton/shared/lib/helpers/address'
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email'
import { type DocumentKeys, type PublicNodeMeta, createClient } from '@proton-docs/realtime-sdk'

import { useApplication } from '~/utils/application-context'

import { createDocsApiFetch } from './createDocsApiFetch'
import { getWebSocketServerURL } from './getWebSocketServerURL'
import { type PublicLinkHandoff, getPublicAuthHeaders } from './publicLink'
import { signRealtimeDocumentUpdate } from './signRealtimeDocumentUpdate'

/**
 * The realtime client for a document reached through a share link, as `useRealtimeClient` is for a member's. Its Docs
 * API requests carry the share-URL session's headers. Its keys are the share-URL client's content key, plus a signed-in
 * visitor's default share address and its key, which sign their edits; an anonymous visitor's edits go unsigned.
 */
export function usePublicRealtimeClient({
  publicDrive,
  linkInfo,
  providerType,
}: Pick<PublicLinkHandoff, 'publicDrive' | 'linkInfo' | 'providerType'>) {
  const application = useApplication()
  const { API_URL, APP_NAME, APP_VERSION } = useConfig()
  const api = useApi()
  const getDefaultShareAddressKeys = useGetDefaultShareAddressKeys()

  const [client] = useState(() => {
    // The x-pm-appversion value the docs-core api and websocket send, such as `web-docs@0.0.2.89`
    const appVersion = getAppVersionStr(getClientID(APP_NAME), APP_VERSION)
    const fetch = createDocsApiFetch(api, API_URL, application.logger)
    const getNodeUid = ({ linkId }: PublicNodeMeta) => generateNodeUid(linkInfo.volumeId, linkId)

    return createClient({
      mode: 'public',
      api: {
        baseUrl: API_URL,
        appVersion,
        uid: publicDrive.experimental.getSessionInfo().uid,
        // Read per request, as docs-core's public Docs API sends them
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            headers: { ...Object.fromEntries(new Headers(init.headers)), ...getPublicAuthHeaders(publicDrive) },
          }),
      },
      rts: {
        serverUrl: getWebSocketServerURL(),
        appVersion,
        subProtocol: APP_VERSION,
        signMessage: signRealtimeDocumentUpdate,
      },
      bootstrap: {
        getNode: (nodeMeta) => publicDrive.getNode(getNodeUid(nodeMeta)),
        // Adapted from `packages/docs-core/lib/DriveSDK/getDocumentKeys.ts`, its `getPublicDocumentKeys`, and the keys
        // `applications/docs/src/app/components/document/DocumentViewer/DocumentViewer.tsx` gives it: none of the
        // visitor's for an anonymous visitor.
        getDocumentKeys: async (nodeMeta) => {
          const [documentContentKey, addressKeys] = await Promise.all([
            publicDrive.experimental.getDocsKey(getNodeUid(nodeMeta)),
            providerType === 'public-unauthenticated' ? undefined : getDefaultShareAddressKeys(),
          ])
          return { documentContentKey, ...addressKeys }
        },
      },
      logging: { enabled: true, sink: (line) => application.logger.info(line) },
    })
  })

  return client
}

/**
 * The signed-in visitor's default share address and its key: the address of their My files root's key author.
 * Adapted from `packages/docs-core/lib/Crypto/useGetDefaultShareAddressKeys.ts`, which doc2 must not import.
 */
function useGetDefaultShareAddressKeys() {
  const getAddresses = useGetAddresses()
  const getAddressKeys = useGetAddressKeys()

  return useCallback(async (): Promise<Pick<DocumentKeys, 'userAddressPrivateKey' | 'userOwnAddress'>> => {
    // Like legacy, the main volume is created when missing
    const myFiles = await getMyFilesRootFolder()
    // Legacy finds the address by the default share address ID, SDK exposes only the email of the root key author
    const email = getAuthorEmail(myFiles.keyAuthor)
    const address = email
      ? (await getAddresses()).find(
          (address) =>
            canonicalizeInternalEmail(address.Email) === canonicalizeInternalEmail(email) &&
            getIsAddressEnabled(address),
        )
      : undefined
    if (!address) {
      throw new Error('Address is not available')
    }
    const keys = await getAddressKeys(address.ID)
    if (!keys[0]?.privateKey) {
      throw new Error('Primary private key is not available')
    }
    return { userAddressPrivateKey: keys[0].privateKey, userOwnAddress: address.Email }
  }, [getAddressKeys, getAddresses])
}

// Copied from `packages/docs-core/lib/DriveSDK/getMyFilesNodeMeta.ts`, its `getMyFilesRootFolder`.
async function getMyFilesRootFolder() {
  const drive = getDrive()
  // No debounce and cache - done by SDK
  try {
    return await drive.getMyFilesRootFolder()
  } catch (error) {
    if ((error as { code?: number })?.code === API_CUSTOM_ERROR_CODES.ALREADY_EXISTS) {
      // Another Drive client created the fresh account's main volume first.
      // The SDK cache is updated after the failed creation, so retry the lookup once.
      return drive.getMyFilesRootFolder()
    }
    throw error
  }
}

function getAuthorEmail(author: Author) {
  return author.ok ? author.value : author.error.claimedAuthor
}
