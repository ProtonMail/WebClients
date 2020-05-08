import React, { MutableRefObject } from 'react';
import AlarmWatcher from './AlarmWatcher';
import useCalendarsAlarms from './useCalendarsAlarms';
import { Calendar, CalendarEvent } from 'proton-shared/lib/interfaces/calendar';
import { CalendarAlarmsCache } from './CacheInterface';

interface Props {
    calendars: Calendar[];
    tzid: string;
    getCachedEvent: (calendarID: string, eventID: string) => CalendarEvent | undefined;
    cacheRef: MutableRefObject<CalendarAlarmsCache>;
}

const AlarmContainer = ({ calendars, tzid, getCachedEvent, cacheRef }: Props) => {
    const alarms = useCalendarsAlarms(calendars, cacheRef);
    return <AlarmWatcher alarms={alarms} tzid={tzid} getCachedEvent={getCachedEvent} />;
};

export default AlarmContainer;
