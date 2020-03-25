import React from 'react';
import { Calendar, CalendarUserSettings } from 'proton-shared/lib/interfaces/calendar';

import CalendarsSection from './section/CalendarsSection';
import Main from '../../components/Main';

interface Props {
    calendars: Calendar[];
    calendarUserSettings: CalendarUserSettings;
}
const SettingsCalendarPage = ({ calendars, calendarUserSettings }: Props) => {
    return (
        <Main className="p2">
            <CalendarsSection calendars={calendars} calendarUserSettings={calendarUserSettings} />
        </Main>
    );
};

export default SettingsCalendarPage;
