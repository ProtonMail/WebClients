import { useEffect } from 'react'

import { useUser } from '@proton/account/user/hooks'
import { useTheme } from '@proton/components/containers/themes/ThemeProvider'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import type { UserModel } from '@proton/shared/lib/interfaces/User'
import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings'

import { useApplication } from '~/utils/application-context'
import { useIsDarkThemeEnabled } from '~/utils/flags'
import type { EditorInvoker } from './EditorInvoker'

/** Whether the editor shows in dark mode: when the app theme is dark and `DocsDarkTheme` allows it, as in /doc. */
export function useIsEditorDarkMode() {
  const isDarkThemeEnabled = useIsDarkThemeEnabled()
  const { information } = useTheme()
  return isDarkThemeEnabled && information.dark
}

/**
 * The name the editor's presence carries. Adapted from
 * `applications/docs/src/app/routes/(user)/(document)/doc/__components/PrivateHookChangesToEvents.tsx`
 */
export function useUserName(): string {
  const [user] = useUser()
  return getUserName(user)
}

export function getUserName(user: Pick<UserModel, 'DisplayName' | 'Name' | 'Email'>): string {
  return user.DisplayName || user.Name || user.Email
}

export type EditorBasics = {
  isDarkMode: boolean
  userName: string
  /** Whether the editor offers Suggesting: on with `useSuggestionsAllowed` (`flags.ts`) and the session's comments */
  suggestionsEnabled: boolean
  /** Undefined in a public-link session, which has no user settings */
  getUserSettings?: () => Promise<UserSettings>
}

type BasicsEditor = Pick<EditorInvoker, 'setDarkMode' | 'loadUserSettings' | 'syncProperty'>

/**
 * Gives the editor what /doc gives it before it is initialized: dark mode, the user's settings, whether it offers
 * Suggesting, and the user's name, which its presence carries. Sent, not awaited: the bridge delivers them before a later
 * `initializeEditor`. A failure is only logged. Adapted from
 * `applications/docs/src/app/components/document/DocumentViewer/DocumentViewer.tsx`.
 */
export function sendEditorBasics(
  editorInvoker: BasicsEditor,
  { isDarkMode, userName, suggestionsEnabled, getUserSettings }: EditorBasics,
  logger: LoggerInterface,
): void {
  const warnOnFailure = (call: Promise<void>, failure: string) => {
    call.catch((error) => logger.warn(failure, error))
  }
  warnOnFailure(editorInvoker.setDarkMode(isDarkMode), 'Failed to set the editor theme')
  if (getUserSettings) {
    warnOnFailure(
      getUserSettings().then((settings) => editorInvoker.loadUserSettings(settings)),
      'Failed to give the editor the user settings',
    )
  }
  warnOnFailure(
    editorInvoker.syncProperty('suggestionsEnabled', suggestionsEnabled),
    'Failed to give the editor the suggestions setting',
  )
  warnOnFailure(editorInvoker.syncProperty('userName', userName), 'Failed to give the editor the user name')
}

/**
 * Keeps an open editor's theme, the user's name and whether it offers Suggesting in sync with the app's, once the
 * Loader has given it them. Its first run repeats them, which changes nothing.
 */
export function useEditorBasicsInSync(
  editorInvoker: BasicsEditor | undefined,
  { isDarkMode, userName, suggestionsEnabled }: Pick<EditorBasics, 'isDarkMode' | 'userName' | 'suggestionsEnabled'>,
) {
  const { logger } = useApplication()

  useEffect(() => {
    editorInvoker?.setDarkMode(isDarkMode).catch((error) => logger.warn('Failed to set the editor theme', error))
  }, [editorInvoker, isDarkMode, logger])

  useEffect(() => {
    editorInvoker
      ?.syncProperty('userName', userName)
      .catch((error) => logger.warn('Failed to give the editor the user name', error))
  }, [editorInvoker, logger, userName])

  useEffect(() => {
    editorInvoker
      ?.syncProperty('suggestionsEnabled', suggestionsEnabled)
      .catch((error) => logger.warn('Failed to give the editor the suggestions setting', error))
  }, [editorInvoker, logger, suggestionsEnabled])
}
