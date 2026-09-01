import NotificationsChildren from '@proton/components/containers/notifications/Children'
import NotificationsProvider from '@proton/components/containers/notifications/Provider'
import { App } from './App'
import { ApplicationProvider } from './ApplicationProvider'
import { ThemeStyles } from '../Theme'
import { useBridge } from '../Lib/useBridge'
import Icons from '@proton/icons/Icons'
import type { EditorSystemMode } from '@proton/docs-shared/'
import { EditorStateProvider } from './EditorStateProvider'
import type { DocumentType } from '@proton/docs-shared'
import { EditorThemeProvider } from '../Theme/EditorThemeProvider'

type ContainerProps = {
  documentType: DocumentType
  systemMode: EditorSystemMode
}

export function RootContainer({ documentType, systemMode }: ContainerProps) {
  const bridgeState = useBridge({
    systemMode,
  })

  return (
    <EditorThemeProvider
      initialTheme={new URLSearchParams(window.location.search).get('theme') === 'dark' ? 'dark' : 'light'}
    >
      <ThemeStyles />
      <ApplicationProvider application={bridgeState.application}>
        <EditorStateProvider systemMode={systemMode}>
          <NotificationsProvider>
            <App documentType={documentType} systemMode={systemMode} bridgeState={bridgeState} />
            <NotificationsChildren />
          </NotificationsProvider>
        </EditorStateProvider>
      </ApplicationProvider>
      <Icons />
    </EditorThemeProvider>
  )
}
