import React, { MutableRefObject } from 'react';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import AlarmWatcher from './AlarmWatcher';
import useCalendarsAlarms from './useCalendarsAlarms';
import { CalendarsAlarmsCache } from './CacheInterface';
import { CalendarsEventsCache } from '../calendar/eventStore/interface';

interface Props {
    calendars: Calendar[];
    tzid: string;
    calendarsAlarmsCacheRef: MutableRefObject<CalendarsAlarmsCache>;
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
}

const AlarmContainer = ({ calendars, tzid, calendarsAlarmsCacheRef, calendarsEventsCacheRef }: Props) => {
    const alarms = useCalendarsAlarms(calendars, calendarsAlarmsCacheRef);
    return <AlarmWatcher alarms={alarms} tzid={tzid} calendarsEventsCacheRef={calendarsEventsCacheRef} />;
};

export default AlarmContainer;
