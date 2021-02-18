import React from 'react';
import { PrivateMainArea, useAppTitle, OverviewLayout, useEarlyAccess } from 'react-components';
import { c } from 'ttag';

import { getGeneralSettingsPage } from './SettingsGeneralPage';
import { getCalendarSettingsPage } from './SettingsCalendarPage';

export const getOverviewSettingsPage = () => {
    return {
        text: c('Title').t`Overview`,
        to: '/settings/overview',
        icon: 'apps',
    };
};

const SettingsOverviewPage = () => {
    useAppTitle(c('Title').t`Overview`);
    const { hasEarlyAccess } = useEarlyAccess();
    return (
        <PrivateMainArea className="flex">
            <OverviewLayout
                pages={[getGeneralSettingsPage({ hasEarlyAccess }), getCalendarSettingsPage()]}
                title={c('Title').t`Calendar settings`}
            />
        </PrivateMainArea>
    );
};

export default SettingsOverviewPage;
