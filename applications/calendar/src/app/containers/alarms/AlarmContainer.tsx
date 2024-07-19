import type { MutableRefObject } from 'react';

import type { Calendar } from '@proton/shared/lib/interfaces/calendar';

import type { CalendarsEventsCache } from '../calendar/eventStore/interface';
import AlarmWatcher from './AlarmWatcher';
import type { CalendarsAlarmsCache } from './CacheInterface';
import useCalendarsAlarms from './useCalendarsAlarms';

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
