import { DrawerAppScrollContainer, DefaultQuickSettings, DrawerAllSettingsView } from '@proton/components'

const DocsQuickSettings = () => {
  return (
    <DrawerAppScrollContainer>
      <DrawerAllSettingsView />
      <DefaultQuickSettings />
    </DrawerAppScrollContainer>
  )
}

export default DocsQuickSettings
