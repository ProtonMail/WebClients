import React from 'react';
import { DesktopNotificationSection } from 'react-components';
import { c } from 'ttag';
import { CalendarUserSettings } from 'proton-shared/lib/interfaces/calendar';

import Main from '../../components/Main';
import TimeSection from './section/TimeSection';
import LayoutSection from './section/LayoutSection';
import { displayNotification } from '../alarms/AlarmWatcher';

const testDefaultNotification = () => {
    const text = c('Alarm notification').t`Requested test will start at 12:00`;
    return displayNotification({ text });
};

interface Props {
    calendarUserSettings: CalendarUserSettings;
}
const SettingsGeneralPage = ({ calendarUserSettings }: Props) => {
    return (
        <Main className="p2">
            <TimeSection calendarUserSettings={calendarUserSettings} />
            <LayoutSection calendarUserSettings={calendarUserSettings} />
            <DesktopNotificationSection onTest={testDefaultNotification} />
        </Main>
    );
};

export default SettingsGeneralPage;
