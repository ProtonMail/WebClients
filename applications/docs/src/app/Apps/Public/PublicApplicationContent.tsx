import { useEffect, useMemo, useState } from 'react'
import { Application } from '@proton/docs-core'

import { useApi } from '@proton/components/index'
import { Route, Switch } from 'react-router-dom'
import ApplicationProvider from '../../Containers/ApplicationProvider'
import { DocumentViewer } from '../../Components/DocumentViewer'
import type { DocumentAction, PublicDriveCompat, PublicNodeMeta } from '@proton/drive-store'
import { APP_VERSION } from '../../config'
import { WordCountContextProvider } from '../../Components/WordCount/WordCountProvider'
import { useDocsUrlBar } from '../../Containers/useDocsUrlBar'
import SharedLayout from '../SharedLayout'
import { usePublicSessionUser } from '@proton/drive-store/store'
import UserProvider from '../../Containers/ContextProvider'

function PublicApplicationContent({ publicDriveCompat }: { publicDriveCompat: PublicDriveCompat }) {
  const api = useApi()

  const { user, UID } = usePublicSessionUser()

  if (user) {
    /** Allow the API to make authenticated requests, such as bookmarking a document for the current session user */
    ;(api as any).UID = UID
  }

  const { openAction } = useDocsUrlBar({ isDocsEnabled: publicDriveCompat.isDocsEnabled })

  const [action] = useState<DocumentAction['mode']>()

  const application = useMemo(() => {
    return new Application(
      api,
      publicDriveCompat.getPublicAuthHeaders(),
      undefined,
      { publicCompat: publicDriveCompat },
      APP_VERSION,
    )
    // Ensure only one application instance is created
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  if (!isAppReady) {
    return null
  }

  return (
    <ApplicationProvider application={application}>
      <UserProvider publicContext={{ user, compat: publicDriveCompat }} privateContext={undefined}>
        <WordCountContextProvider>
          <Switch>
            <Route path={'*'}>
              <SharedLayout>
                <Content openAction={openAction} actionMode={action} />
              </SharedLayout>
            </Route>
          </Switch>
        </WordCountContextProvider>
      </UserProvider>
    </ApplicationProvider>
  )
}

function Content({
  openAction,
  actionMode,
}: {
  openAction: DocumentAction | null
  actionMode: DocumentAction['mode'] | undefined
}) {
  if (openAction?.mode !== 'open-url') {
    return null
  }

  const nodeMeta: PublicNodeMeta = {
    token: openAction.token,
    linkId: openAction.linkId,
  }

  return <DocumentViewer nodeMeta={nodeMeta} action={actionMode} />
}

export default PublicApplicationContent
