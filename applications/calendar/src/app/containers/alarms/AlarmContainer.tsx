import { MutableRefObject } from 'react';

import { Calendar } from '@proton/shared/lib/interfaces/calendar';

import { CalendarsEventsCache } from '../calendar/eventStore/interface';
import AlarmWatcher from './AlarmWatcher';
import { CalendarsAlarmsCache } from './CacheInterface';
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
