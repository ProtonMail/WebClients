import { c } from 'ttag'
import { createStringifier } from '../stringifier'
import type { EditorRequiresClientMethods } from '@proton/docs-shared'
import { useApplication } from '../../ApplicationProvider'
import { useActiveBreakpoint } from '@proton/components'
import { useEffect, useState } from 'react'
import { Icon } from './ui'

const { s } = createStringifier(strings)

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
          title: s('Mobile Editing Coming Soon'),
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
    'Mobile Editing Coming Soon': c('sheets_2025:Spreadsheet editing disabled dialog').t`Mobile Editing Coming Soon`,
    Info: c('sheets_2025:Spreadsheet editing disabled dialog')
      .t`We’re working on bringing this feature to you soon. For now, sheets can only be edited on desktop`,
  }
}
