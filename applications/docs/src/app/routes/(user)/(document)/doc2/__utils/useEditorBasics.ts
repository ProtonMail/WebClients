import { useEffect } from 'react'

import { useGetUserSettings } from '@proton/account/userSettings/hooks'
import { useTheme } from '@proton/components/containers/themes/ThemeProvider'

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
 * Gives the editor what /doc's `DocumentViewer.tsx` gives it once it is there: dark mode, the user's settings (not in a
 * public-link session), and Suggesting turned off.
 */
export function useEditorBasics(editorInvoker: EditorInvoker | undefined, isDarkMode: boolean) {
  const { isPublicMode, logger } = useApplication()
  const getUserSettings = useGetUserSettings()

  useEffect(() => {
    editorInvoker?.setDarkMode(isDarkMode).catch((error) => logger.warn('Failed to set the editor theme', error))
  }, [editorInvoker, isDarkMode, logger])

  useEffect(() => {
    if (!editorInvoker || isPublicMode) {
      return
    }
    getUserSettings()
      .then((settings) => editorInvoker.loadUserSettings(settings))
      .catch((error) => logger.warn('Failed to give the editor the user settings', error))
  }, [editorInvoker, getUserSettings, isPublicMode, logger])

  useEffect(() => {
    // Suggestions create comment threads, which doc2 can't store until comments come to it after SDK Phase 2
    editorInvoker
      ?.syncProperty('suggestionsEnabled', false)
      .catch((error) => logger.warn('Failed to turn off suggestions in the editor', error))
  }, [editorInvoker, logger])
}
