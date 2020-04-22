import React from 'react';
import AlarmWatcher from './AlarmWatcher';
import useCalendarsAlarms from './useCalendarsAlarms';
import { Calendar, CalendarEvent } from 'proton-shared/lib/interfaces/calendar';

interface Props {
    calendars: Calendar[];
    tzid: string;
    getCachedEvent: (calendarID: string, eventID: string) => Promise<CalendarEvent>;
}

const AlarmContainer = ({ calendars, tzid, getCachedEvent }: Props) => {
    const alarms = useCalendarsAlarms(calendars);
    return <AlarmWatcher alarms={alarms} tzid={tzid} getCachedEvent={getCachedEvent} />;
};

export default AlarmContainer;
