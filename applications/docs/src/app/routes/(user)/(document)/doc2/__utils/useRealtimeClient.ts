import { useState } from 'react'

import { useApi } from '@proton/app-context/useApi'
import { useConfig } from '@proton/app-context/useConfig'
import useAuthentication from '@proton/components/hooks/useAuthentication'
import { generateNodeUid, getDrive } from '@proton/drive/sdk'
import { getClientID } from '@proton/shared/lib/apps/helper'
import { getAppVersionStr } from '@proton/shared/lib/fetch/headers'
import { type PrivateNodeMeta, createClient } from '@proton-docs/realtime-sdk'

import { useApplication } from '~/utils/application-context'

import { getWebSocketServerURL } from './getWebSocketServerURL'
import { useGetMemberAddressKeys } from './useGetMemberAddressKeys'
import { signRealtimeDocumentUpdate } from './signRealtimeDocumentUpdate'

export function useRealtimeClient() {
  const application = useApplication()
  const { API_URL, APP_NAME, APP_VERSION } = useConfig()
  const { UID } = useAuthentication()
  const getMemberAddressKeys = useGetMemberAddressKeys(useApi())

  const [client] = useState(() => {
    // The x-pm-appversion value the docs-core api and websocket send, such as `web-docs@0.0.2.89`
    const appVersion = getAppVersionStr(getClientID(APP_NAME), APP_VERSION)

    const getNodeUid = ({ volumeId, linkId }: PrivateNodeMeta) => generateNodeUid(volumeId, linkId)

    return createClient({
      mode: 'private',
      // No api.fetch: the app has no fetch that refreshes the session on 401, only the `useApi()` client.
      api: { baseUrl: API_URL, appVersion, uid: UID },
      rts: {
        serverUrl: getWebSocketServerURL(),
        appVersion,
        subProtocol: APP_VERSION,
        signMessage: signRealtimeDocumentUpdate,
      },
      bootstrap: {
        getNode: (nodeMeta) => getDrive().getNode(getNodeUid(nodeMeta)),
        getDocumentKeys: async (nodeMeta) => {
          const [documentContentKey, memberAddressKeys] = await Promise.all([
            getDrive().experimental.getDocsKey(getNodeUid(nodeMeta)),
            getMemberAddressKeys(nodeMeta),
          ])
          return { documentContentKey, ...memberAddressKeys }
        },
      },
      logging: { enabled: true, sink: (line) => application.logger.info(line) },
    })
  })

  return client
}
