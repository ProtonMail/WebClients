import { App } from './App'
import { ApplicationProvider } from './ApplicationProvider'
import { NotificationsChildren, NotificationsProvider } from '@proton/components'
import { ThemeStyles } from '../Theme'
import { useBridge } from '../Lib/useBridge'
import Icons from '@proton/icons/Icons'
import type { EditorSystemMode } from '@proton/docs-shared/'
import { EditorStateProvider } from './EditorStateProvider'
import type { DocumentType } from '@proton/drive-store/store/_documents'

type ContainerProps = {
  documentType: DocumentType
  systemMode: EditorSystemMode
}

export function RootContainer({ documentType, systemMode }: ContainerProps) {
  const bridgeState = useBridge({
    systemMode,
  })

  return (
    <>
      <ThemeStyles />
      <ApplicationProvider application={bridgeState.application}>
        <EditorStateProvider editorState={bridgeState.editorState}>
          <NotificationsProvider>
            <App documentType={documentType} systemMode={systemMode} bridgeState={bridgeState} />
            <NotificationsChildren />
          </NotificationsProvider>
        </EditorStateProvider>
      </ApplicationProvider>
      <Icons />
    </>
  )
}
