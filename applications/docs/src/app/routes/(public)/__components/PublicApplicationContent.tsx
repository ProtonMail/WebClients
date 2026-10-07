import { useApi } from '@proton/app-context/useApi'
import { useEffect, useMemo, useState } from 'react'
import { Application } from '@proton/docs-core'

import { ApplicationProvider } from '~/utils/application-context'
import { DocumentViewer } from '~/components/document/DocumentViewer/DocumentViewer'
import type { PublicDriveCompat } from '@proton/drive-store'
import type { UserModel } from '@proton/shared/lib/interfaces'
import type { DocumentAction, PublicNodeMeta } from '@proton/docs-shared'
import { tmpConvertNewDocTypeToOld } from '@proton/docs-shared/lib/Doc/convert-doc-type'
import config from '~/config'
import { WordCountProvider } from '~/components/document/WordCount'
import { useDocsUrlBar } from '~/utils/docs-url-bar'
import { DocumentLayout } from '~/components/document/DocumentLayout/DocumentLayout'
import { usePublicSessionUser } from '@proton/drive-store/store'
import { DocsProvider } from '~/components/document/context'
import { useUnleashClient } from '@proton/unleash/proxy'
import { DriveCompatWrapper } from '@proton/drive-store/lib/DriveCompatWrapper'
import { Route, Routes } from 'react-router-dom-v5-compat'
import type { ProviderType } from '../../../provider-type'
import { getPublicLinkInfo } from '@proton/docs-core/lib/DriveSDK/getPublicDrive'
import { getPublicAuthHeaders } from '@proton/docs-core/lib/DriveSDK/getPublicAuthHeaders'
import { sharedLogger } from '~/drive-sdk/logger'

export function PublicApplicationContent({
  publicDriveCompat,
  user: sdkUser,
  providerType,
}: {
  publicDriveCompat?: PublicDriveCompat
  user?: UserModel
  providerType: ProviderType
}) {
  const api = useApi()
  const unleashClient = useUnleashClient()

  const { user: legacyUser, localID } = usePublicSessionUser()
  const user = sdkUser ?? legacyUser

  const { openAction } = useDocsUrlBar()

  const application = useMemo(() => {
    return new Application(
      api,
      publicDriveCompat ? publicDriveCompat.getPublicAuthHeaders() : getPublicAuthHeaders(),
      undefined,
      new DriveCompatWrapper({ publicCompat: publicDriveCompat }),
      config.APP_NAME,
      config.APP_VERSION,
      unleashClient,
      { logger: sharedLogger },
    )
  }, [])

  useEffect(() => {
    application.updateCompatInstance({ publicCompat: publicDriveCompat })
  }, [application, publicDriveCompat])

  const [isAppReady, setIsAppReady] = useState(false)

  useEffect(() => {
    if (!isAppReady) {
      setIsAppReady(true)
    }
  }, [application, isAppReady])

  useEffect(() => {
    if (openAction) {
      application.logger.info('Opening doc through action', {
        mode: openAction.mode,
        linkId: 'linkId' in openAction ? openAction.linkId : undefined,
        volumeId: 'volumeId' in openAction ? openAction.volumeId : undefined,
      })
    }
  }, [application.logger, openAction])

  if (!isAppReady || !openAction) {
    return null
  }

  return (
    <ApplicationProvider application={application}>
      <DocsProvider
        publicContext={{ user, localID, compat: publicDriveCompat, openParams: openAction }}
        privateContext={undefined}
      >
        <WordCountProvider>
          <Routes>
            <Route
              path="*"
              element={
                <DocumentLayout documentType={tmpConvertNewDocTypeToOld(openAction.type)}>
                  <Content
                    providerType={providerType}
                    openAction={openAction}
                    linkId={publicDriveCompat ? publicDriveCompat.linkId : getPublicLinkInfo().linkId}
                  />
                </DocumentLayout>
              }
            />
          </Routes>
        </WordCountProvider>
      </DocsProvider>
    </ApplicationProvider>
  )
}

function Content({
  openAction,
  providerType,
  linkId,
}: {
  openAction: DocumentAction | null
  providerType: ProviderType
  linkId: string | undefined
}) {
  if (openAction?.mode !== 'open-url' && openAction?.mode !== 'open-url-download') {
    return null
  }

  if (!linkId) {
    return null
  }

  const nodeMeta: PublicNodeMeta = {
    token: openAction.token,
    linkId: linkId,
  }

  return (
    <DocumentViewer
      nodeMeta={nodeMeta}
      openAction={openAction}
      actionMode={undefined}
      providerType={providerType}
      documentType={openAction.type}
    />
  )
}
