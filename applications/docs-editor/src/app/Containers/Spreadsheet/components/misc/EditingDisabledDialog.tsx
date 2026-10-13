import { useSheetsMessages, useSheetsDependencies } from '../../SheetsDependenciesProvider'

import { useEffect, useRef } from 'react'
import { useActiveBreakpoint } from '../../useActiveBreakpoint'

export function EditingDisabledDialog() {
  const messages = useSheetsMessages()

  const alertShown = useRef(false)
  const { canEdit, appPlatform, showGenericInfoModal } = useSheetsDependencies()
  const { viewportWidth } = useActiveBreakpoint()
  const isSmallViewport = viewportWidth['<=small']

  useEffect(() => {
    if (appPlatform === 'web' && canEdit && isSmallViewport && alertShown.current === false) {
      alertShown.current = true
      showGenericInfoModal({
        title: messages.editingDisabledDialog['Screen too small for editing'],
        translatedMessage: messages.editingDisabledDialog.Info,
      })
    }
  }, [messages, appPlatform, canEdit, isSmallViewport, showGenericInfoModal])

  return null
}

export const editingDisabledDialogMessages = {
  editingDisabledDialog: {
    'Screen too small for editing': `Screen too small for editing`,
    Info: `Your screen is too small to edit this spreadsheet. You’re in view-only mode. To make changes, please open this spreadsheet on a larger screen or expand your browser window.`,
  },
}
