import { DefaultQuickSettings } from '@proton/components/components/drawer/views/quickSettings';
import DrawerAllSettingsView from '@proton/components/components/drawer/views/quickSettings/DrawerAllSettingsView';
import { DrawerAppScrollContainer } from '@proton/components/components/drawer/views/shared';

const WalletQuickSettings = () => {
    return (
        <DrawerAppScrollContainer>
            <DrawerAllSettingsView />
            <DefaultQuickSettings />
        </DrawerAppScrollContainer>
    );
};

export default WalletQuickSettings;
