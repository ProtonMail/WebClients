import { DrawerAppScrollContainer, DefaultQuickSettings, DrawerAllSettingsView } from '@proton/components'

export function DocsQuickSettings() {
  return (
    <DrawerAppScrollContainer>
      <DrawerAllSettingsView />
      <DefaultQuickSettings />
    </DrawerAppScrollContainer>
  )
}
