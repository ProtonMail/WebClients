import { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { useSettingsLink } from '@proton/components/components';
import DrawerView, { SelectedDrawerOption } from '@proton/components/components/drawer/views/DrawerView';
import DefaultQuickSettings from '@proton/components/components/drawer/views/quickSettings/DefaultQuickSettings';
import { useConfig } from '@proton/components/hooks';
import { APPS_CONFIGURATION } from '@proton/shared/lib/constants';

import './quickSettings/QuickSettings.scss';

interface Props {
    customAppSettings?: ReactNode;
}

const DrawerSettingsView = ({ customAppSettings }: Props) => {
    const goToSettings = useSettingsLink();
    const { APP_NAME } = useConfig();

    const path = APPS_CONFIGURATION[APP_NAME].publicPath;

    const tab: SelectedDrawerOption = {
        text: c('Title').t`Settings`,
        value: 'settings',
    };

    const settingsButton = (
        <Button
            onClick={() => goToSettings(path, APP_NAME, false)}
            data-testid="drawer-quick-settings:all-settings-button"
        >{c('Title').t`All settings`}</Button>
    );

    const defaultSettings = (
        <div className="p-4 flex flex-column gap-2 scroll-if-needed">
            <DefaultQuickSettings />
        </div>
    );

    return (
        <DrawerView
            tab={tab}
            content={customAppSettings ? customAppSettings : defaultSettings}
            footerButtons={[settingsButton]}
            id="drawer-app-proton-settings"
            className="quickSettings"
        />
    );
};

export default DrawerSettingsView;
