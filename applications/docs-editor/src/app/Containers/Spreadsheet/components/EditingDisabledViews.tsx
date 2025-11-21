import { c } from 'ttag'
import { createStringifier } from '../stringifier'
import type { EditorRequiresClientMethods } from '@proton/docs-shared'
import { useApplication } from '../../ApplicationProvider'
import { useActiveBreakpoint } from '@proton/components'
import { useEffect, useRef, useState } from 'react'
import { Icon } from './ui'

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

  useEffect(() => {
    if (canEdit && isSmallViewport && alertShown.current === false) {
      alertShown.current = true
      clientInvoker.showGenericInfoModal({
        title: s('Screen too small for editing'),
        translatedMessage: s('Info'),
      })
    }
  }, [canEdit, isSmallViewport, clientInvoker])

  return null
}

interface EditingButtonProps {
  clientInvoker: EditorRequiresClientMethods
}

export function EditingDisabledButton({ clientInvoker }: EditingButtonProps) {
  const { application } = useApplication()
  const { viewportWidth } = useActiveBreakpoint()
  const canEdit = application.getRole().canEdit()
  const isSmallViewport = viewportWidth['<=small']
  const [isRunningInNativeMobileWeb, setIsRunningInNativeMobileWeb] = useState(false)

  // TODO: Extract this into a custom hook
  useEffect(() => {
    let ignore = false
    clientInvoker
      .getIsRunningInNativeMobileWeb()
      .then((response) => {
        if (!ignore) {
          setIsRunningInNativeMobileWeb(response)
        }
      })
      .catch(() => {})

    return () => {
      ignore = true
    }
  }, [clientInvoker, setIsRunningInNativeMobileWeb])

  const visible = isRunningInNativeMobileWeb && canEdit && isSmallViewport
  if (!visible) {
    return null
  }

  return (
    <button
      onClick={() => {
        clientInvoker.showGenericInfoModal({
          title: s('Screen too small for editing'),
          translatedMessage: s('Info'),
        })
      }}
      className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#EAE7E4] pl-3 pr-4 text-sm text-[#5C5958]"
    >
      <Icon legacyName="pencil" />
      Edit
    </button>
  )
}

function strings() {
  return {
    'Screen too small for editing': c('sheets_2025:Spreadsheet editing disabled dialog')
      .t`Screen too small for editing`,
    Info: c('sheets_2025:Spreadsheet editing disabled dialog')
      .t`Your screen is too small to edit this spreadsheet. You’re in view-only mode. To make changes, please open this spreadsheet on a larger screen or expand your browser window.`,
  }
}
