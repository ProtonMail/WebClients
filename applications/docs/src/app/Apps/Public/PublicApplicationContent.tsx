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

function PublicApplicationContent({ publicDriveCompat }: { publicDriveCompat: PublicDriveCompat }) {
  void import('../../tailwind.scss')

  const api = useApi()

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
      application.logger.info('Opening doc through action', openAction)
    }
  }, [application.logger, openAction])

  if (!isAppReady) {
    return null
  }

  return (
    <ApplicationProvider application={application}>
      <WordCountContextProvider>
        <Switch>
          <Route path={'*'}>
            <Content openAction={openAction} actionMode={action} />
          </Route>
        </Switch>
      </WordCountContextProvider>
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

  return <DocumentViewer lookup={nodeMeta} action={actionMode} />
}

export default PublicApplicationContent
