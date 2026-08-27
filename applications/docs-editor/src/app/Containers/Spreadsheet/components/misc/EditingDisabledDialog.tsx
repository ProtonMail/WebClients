import { c } from 'ttag'
import { createStringifier } from '../../stringifier'
import { useEffect, useRef } from 'react'
import { useActiveBreakpoint } from '../../useActiveBreakpoint'
import { useSheetsDependencies } from '../../SheetsDependenciesProvider'

const { s } = createStringifier(strings)

export function EditingDisabledDialog() {
  const alertShown = useRef(false)
  const { canEdit, appPlatform, showGenericInfoModal } = useSheetsDependencies()
  const { viewportWidth } = useActiveBreakpoint()
  const isSmallViewport = viewportWidth['<=small']

  useEffect(() => {
    if (appPlatform === 'web' && canEdit && isSmallViewport && alertShown.current === false) {
      alertShown.current = true
      showGenericInfoModal({
        title: s('Screen too small for editing'),
        translatedMessage: s('Info'),
      })
    }
  }, [appPlatform, canEdit, isSmallViewport, showGenericInfoModal])

  return null
}

function strings() {
  return {
    'Screen too small for editing': c('sheets_2025:Spreadsheet editing disabled dialog')
      .t`Screen too small for editing`,
    Info: c('sheets_2025:Spreadsheet editing disabled dialog')
      .t`Your screen is too small to edit this spreadsheet. You’re in view-only mode. To make changes, please open this spreadsheet on a larger screen or expand your browser window.`,
  }
}
