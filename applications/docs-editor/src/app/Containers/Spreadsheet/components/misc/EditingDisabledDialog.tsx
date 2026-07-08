import { c } from 'ttag'
import { createStringifier } from '../../stringifier'
import type { EditorRequiresClientMethods } from '@proton/docs-shared'
import { useApplication } from '../../../ApplicationProvider'
import { useEffect, useRef } from 'react'
import { useAppPlatform } from '../../../../Hooks/useAppPlatform'
import { useActiveBreakpoint } from '../../useActiveBreakpoint'

const { s } = createStringifier(strings)

interface EditingDisabledDialogProps {
  clientInvoker: EditorRequiresClientMethods
}

export function EditingDisabledDialog({ clientInvoker }: EditingDisabledDialogProps) {
  const alertShown = useRef(false)
  const { application } = useApplication()
  const { viewportWidth } = useActiveBreakpoint()
  const canEdit = application.getRole().canEdit()
  const isSmallViewport = viewportWidth['<=small']
  const appPlatform = useAppPlatform(clientInvoker)

  useEffect(() => {
    if (appPlatform === 'web' && canEdit && isSmallViewport && alertShown.current === false) {
      alertShown.current = true
      clientInvoker.showGenericInfoModal({
        title: s('Screen too small for editing'),
        translatedMessage: s('Info'),
      })
    }
  }, [appPlatform, canEdit, isSmallViewport, clientInvoker])

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
