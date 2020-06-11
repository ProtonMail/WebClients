import React from 'react';
import { PrivateMainSettingsArea, SettingsPropsShared } from 'react-components';
import { Address } from 'proton-shared/lib/interfaces';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { c } from 'ttag';

import CalendarsSection from './section/CalendarsSection';

export const getCalendarSettingsPage = () => {
    return {
        link: '/calendar/settings/calendars',
        icon: 'calendar',
        text: c('Link').t`Calendars`,
        subsections: [
            {
                text: c('Title').t`Calendars`,
                id: 'calendars',
            },
        ],
    };
};

interface Props extends SettingsPropsShared {
    activeAddresses: Address[];
    calendars: Calendar[];
    disabledCalendars: Calendar[];
    activeCalendars: Calendar[];
    defaultCalendar?: Calendar;
}
const SettingsCalendarPage = ({
    activeAddresses,
    calendars,
    disabledCalendars,
    activeCalendars,
    defaultCalendar,
    setActiveSection,
    location,
}: Props) => {
    const { text, subsections } = getCalendarSettingsPage();
    return (
        <PrivateMainSettingsArea
            title={text}
            location={location}
            appName="ProtonCalendar"
            setActiveSection={setActiveSection}
            subsections={subsections}
        >
            <CalendarsSection
                activeAddresses={activeAddresses}
                calendars={calendars}
                activeCalendars={activeCalendars}
                disabledCalendars={disabledCalendars}
                defaultCalendar={defaultCalendar}
            />
        </PrivateMainSettingsArea>
    );
};

export default SettingsCalendarPage;
