import { CalendarAlarm } from 'proton-shared/lib/interfaces/calendar';

export interface CalendarAlarmCacheRecord {
    result?: CalendarAlarm[];
    promise?: Promise<void>;
}

export interface CalendarAlarmCache {
    [id: string]: CalendarAlarmCacheRecord;
}

export interface CalendarsAlarmsCache {
    calendarsCache: CalendarAlarmCache;
    end: Date;
    start: Date;
    promise?: Promise<void[]>;
    rerender?: () => void;
}
