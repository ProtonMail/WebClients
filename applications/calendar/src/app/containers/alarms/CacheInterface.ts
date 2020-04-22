import { CalendarAlarm } from 'proton-shared/lib/interfaces/calendar';

export interface CacheRecord {
    result?: CalendarAlarm[];
    promise?: Promise<void>;
}

export interface CacheMap {
    [key: string]: CacheRecord;
}

export interface Cache {
    cache: CacheMap;
    end: Date;
    start: Date;
    promise?: Promise<void[]>;
}
