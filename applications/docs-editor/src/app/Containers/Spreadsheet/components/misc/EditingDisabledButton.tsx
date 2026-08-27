import { c } from 'ttag'
import { createStringifier } from '../../stringifier'
import { Icon } from '../ui'
import { useActiveBreakpoint } from '../../useActiveBreakpoint'
import { useSheetsDependencies } from '../../SheetsDependenciesProvider'

const { s } = createStringifier(strings)

export function EditingDisabledButton() {
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
