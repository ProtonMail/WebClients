import { ReactNode } from 'react';

import { c } from 'ttag';

import DrawerView, { SelectedDrawerOption } from '@proton/components/components/drawer/views/DrawerView';
import DefaultQuickSettings from '@proton/components/components/drawer/views/quickSettings/DefaultQuickSettings';

import './quickSettings/QuickSettings.scss';

interface Props {
    customAppSettings?: ReactNode;
}

const DrawerSettingsView = ({ customAppSettings }: Props) => {
    const tab: SelectedDrawerOption = {
        text: c('Title').t`Settings`,
        value: 'settings',
    };

    const defaultSettings = (
        <div className="p-4 flex flex-column gap-2 scroll-if-needed">
            <DefaultQuickSettings />
        </div>
    );

    return (
        <DrawerView
            tab={tab}
            content={customAppSettings ? customAppSettings : defaultSettings}
            id="drawer-app-proton-settings"
            className="quickSettings"
        />
    );
};

export default DrawerSettingsView;
