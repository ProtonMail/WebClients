import { useEffect, useMemo, useState } from 'react'
import { Application } from '@proton/docs-core'

import { useApi } from '@proton/components'
import { ApplicationProvider } from '~/utils/application-context'
import { DocumentViewer } from '~/components/document/DocumentViewer/DocumentViewer'
import {
  usePublicDriveCompat,
  type DocumentAction,
  type PublicDriveCompat,
  type PublicNodeMeta,
} from '@proton/drive-store'
import config from '~/config'
import { WordCountProvider } from '~/components/document/WordCount'
import { useDocsUrlBar } from '~/utils/docs-url-bar'
import { DocumentLayout } from '~/components/document/DocumentLayout/DocumentLayout'
import { usePublicSessionUser } from '@proton/drive-store/store'
import { DocsProvider } from '~/components/document/context'
import { useUnleashClient } from '@proton/unleash'
import { DriveCompatWrapper } from '@proton/drive-store/lib/DriveCompatWrapper'
import { Route, Routes } from 'react-router-dom-v5-compat'
import type { ProviderType } from '../../../provider-type'
import { tmpConvertNewDocTypeToOld } from '@proton/drive-store/store/_documents'

export function PublicApplicationContent({
  publicDriveCompat,
  providerType,
}: {
  publicDriveCompat: PublicDriveCompat
  providerType: ProviderType
}) {
  const api = useApi()
  const unleashClient = useUnleashClient()

  const { user, localID } = usePublicSessionUser()

  const { openAction } = useDocsUrlBar({ isDocsEnabled: publicDriveCompat.isDocsEnabled })

  const application = useMemo(() => {
    return new Application(
      api,
      publicDriveCompat.getPublicAuthHeaders(),
      undefined,
      new DriveCompatWrapper({ publicCompat: publicDriveCompat }),
      config.APP_VERSION,
      unleashClient,
    )
    // Ensure only one application instance is created
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                  <Content providerType={providerType} openAction={openAction} />
                </DocumentLayout>
              }
            />
          </Routes>
        </WordCountProvider>
      </DocsProvider>
    </ApplicationProvider>
  )
}

function Content({ openAction, providerType }: { openAction: DocumentAction | null; providerType: ProviderType }) {
  const { linkId } = usePublicDriveCompat()

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
