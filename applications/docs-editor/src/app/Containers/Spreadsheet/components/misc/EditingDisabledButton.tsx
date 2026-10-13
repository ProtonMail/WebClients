import { useSheetsMessages, useSheetsDependencies } from '../../SheetsDependenciesProvider'
import * as Icons from '../icons'

import { Icon } from '../ui'
import { useActiveBreakpoint } from '../../useActiveBreakpoint'

export function EditingDisabledButton() {
  const messages = useSheetsMessages()

  const { canEdit, appPlatform, showGenericInfoModal } = useSheetsDependencies()
  const { viewportWidth } = useActiveBreakpoint()
  const isSmallViewport = viewportWidth['<=small']

  const visible = appPlatform === 'nativeMobileWeb' && canEdit && isSmallViewport
  if (!visible) {
    return null
  }

  return (
    <button
      type="button"
      onClick={() => {
        showGenericInfoModal({
          title: messages.editingDisabledButton['Mobile Editing Coming Soon'],
          translatedMessage: messages.editingDisabledButton.Info,
        })
      }}
      className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#EAE7E4] pl-3 pr-4 text-sm text-[#5C5958]"
    >
      <Icon data={Icons.pencil} />
      {messages.editingDisabledButton.Edit}
    </button>
  )
}

export const editingDisabledButtonMessages = {
  editingDisabledButton: {
    'Mobile Editing Coming Soon': `Mobile Editing Coming Soon`,
    Info: `We’re working on bringing this feature to you soon. For now, sheets can only be edited on desktop`,

    Edit: 'Edit',
  },
}
