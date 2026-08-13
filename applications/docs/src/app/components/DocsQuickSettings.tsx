import DrawerAppScrollContainer from '@proton/components/components/drawer/views/shared/DrawerAppScrollContainer';
import DefaultQuickSettings from '@proton/components/components/drawer/views/quickSettings/DefaultQuickSettings';
import DrawerAllSettingsView from '@proton/components/components/drawer/views/quickSettings/DrawerAllSettingsView';

export function DocsQuickSettings() {
  return (
    <DrawerAppScrollContainer>
      <DrawerAllSettingsView />
      <DefaultQuickSettings />
    </DrawerAppScrollContainer>
  )
}
