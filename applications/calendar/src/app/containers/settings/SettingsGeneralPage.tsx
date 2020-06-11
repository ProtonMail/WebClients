import React from 'react';
import { DesktopNotificationSection, PrivateMainSettingsArea, SettingsPropsShared } from 'react-components';
import { c } from 'ttag';
import { CalendarUserSettings } from 'proton-shared/lib/interfaces/calendar';

import TimeSection from './section/TimeSection';
import LayoutSection from './section/LayoutSection';
import { displayNotification } from '../alarms/AlarmWatcher';

export const getGeneralSettingsPage = () => {
    return {
        link: '/calendar/settings/general',
        icon: 'settings-master',
        text: c('Link').t`General`,
        subsections: [
            {
                text: c('Title').t`Region & time zone`,
                id: 'time',
            },
            {
                text: c('Title').t`Layout`,
                id: 'layout',
            },
            {
                text: c('Title').t`Desktop notifications`,
                id: 'desktop-notifications',
            },
        ],
    };
};

const testDefaultNotification = () => {
    const text = c('Alarm notification').t`Requested test will start at 12:00`;
    return displayNotification({ text });
};

interface Props extends SettingsPropsShared {
    calendarUserSettings: CalendarUserSettings;
}

const SettingsGeneralPage = ({ setActiveSection, calendarUserSettings, location }: Props) => {
    const { text, subsections } = getGeneralSettingsPage();
    return (
        <PrivateMainSettingsArea
            title={text}
            location={location}
            appName="ProtonCalendar"
            setActiveSection={setActiveSection}
            subsections={subsections}
        >
            <TimeSection calendarUserSettings={calendarUserSettings} />
            <LayoutSection calendarUserSettings={calendarUserSettings} />
            <DesktopNotificationSection onTest={testDefaultNotification} />
        </PrivateMainSettingsArea>
    );
};

export default SettingsGeneralPage;
