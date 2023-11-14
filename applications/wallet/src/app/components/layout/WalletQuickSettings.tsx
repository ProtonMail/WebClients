import { DefaultQuickSettings, QuickSettingsMain } from '@proton/components/components/drawer/views/quickSettings';
import DrawerAllSettingsView from '@proton/components/components/drawer/views/quickSettings/DrawerAllSettingsView';

const WalletQuickSettings = () => {
    return (
        <QuickSettingsMain>
            <DrawerAllSettingsView />
            <DefaultQuickSettings />
        </QuickSettingsMain>
    );
};

export default WalletQuickSettings;
