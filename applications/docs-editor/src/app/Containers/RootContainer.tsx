import { App } from './App'
import { ApplicationProvider } from './ApplicationProvider'
import { NotificationsChildren, NotificationsProvider } from '@proton/components'
import { ThemeStyles } from '../Theme'
import { useBridge } from '../Lib/useBridge'
import Icons from '@proton/icons/Icons'
import type { EditorSystemMode } from '@proton/docs-shared/'
import { EditorStateProvider } from './EditorStateProvider'

type ContainerProps = {
  systemMode: EditorSystemMode
}

export function RootContainer({ systemMode }: ContainerProps) {
  const bridgeState = useBridge({
    systemMode,
  })

  return (
    <>
      <ThemeStyles />
      <ApplicationProvider application={bridgeState.application}>
        <EditorStateProvider editorState={bridgeState.editorState}>
          <NotificationsProvider>
            <App systemMode={systemMode} bridgeState={bridgeState} />
            <NotificationsChildren />
          </NotificationsProvider>
        </EditorStateProvider>
      </ApplicationProvider>
      <Icons />
    </>
  )
}
