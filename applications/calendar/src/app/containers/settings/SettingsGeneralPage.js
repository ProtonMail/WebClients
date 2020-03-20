import React from 'react';
import { DesktopNotificationSection, Loader } from 'react-components';
import { c } from 'ttag';

import Main from '../../components/Main';
import TimeSection from './section/TimeSection';
import LayoutSection from './section/LayoutSection';
import { displayNotification } from '../alarms/AlarmWatcher';

const testDefaultNotification = () => {
    const text = c('Alarm notification').t`Requested test will start at 12:00`;
    return displayNotification({ text });
};

const SettingsGeneralPage = ({ calendarUserSettings }) => {
    if (!calendarUserSettings) {
        return (
            <Main className="p2">
                <Loader />
            </Main>
        );
    }

    return (
        <Main className="p2">
            <TimeSection calendarUserSettings={calendarUserSettings} />
            <LayoutSection calendarUserSettings={calendarUserSettings} />
            <DesktopNotificationSection onTest={testDefaultNotification} />
        </Main>
    );
};

export default SettingsGeneralPage;
