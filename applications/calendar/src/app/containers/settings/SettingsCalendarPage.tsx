import React from 'react';
import { Address } from 'proton-shared/lib/interfaces';

import CalendarsSection from './section/CalendarsSection';
import Main from '../../components/Main';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';

interface Props {
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
    defaultCalendar
}: Props) => {
    return (
        <Main className="p2">
            <CalendarsSection
                activeAddresses={activeAddresses}
                calendars={calendars}
                activeCalendars={activeCalendars}
                disabledCalendars={disabledCalendars}
                defaultCalendar={defaultCalendar}
            />
        </Main>
    );
};

export default SettingsCalendarPage;
