import React, { MutableRefObject } from 'react';
import { PrivateMainSettingsArea, SettingsPropsShared } from 'react-components';
import { Address } from 'proton-shared/lib/interfaces';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { c } from 'ttag';

import { CalendarsEventsCache } from '../calendar/eventStore/interface';
import CalendarsSection from './section/CalendarsSection';
import ImportSection from './section/ImportSection';

export const getCalendarSettingsPage = () => {
    return {
        to: '/settings/calendars',
        icon: 'calendar',
        text: c('Link').t`Calendars`,
        subsections: [
            {
                text: c('Title').t`Calendars`,
                id: 'calendars',
            },
            {
                text: c('Title').t`Import`,
                id: 'import',
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
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
}
const SettingsCalendarPage = ({
    calendarsEventsCacheRef,
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
            <ImportSection
                activeCalendars={activeCalendars}
                defaultCalendar={defaultCalendar}
                calendarsEventsCacheRef={calendarsEventsCacheRef}
            />
        </PrivateMainSettingsArea>
    );
};

export default SettingsCalendarPage;
