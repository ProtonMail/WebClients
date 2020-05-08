import createIntervalTree from 'interval-tree';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { OccurrenceIterationCache } from 'proton-shared/lib/calendar/recurring';
import { EventPersonalMap } from '../../../interfaces/EventPersonalMap';

export type IntervalTree = ReturnType<typeof createIntervalTree>;

export interface RecurringCache {
    parentEventID?: string;
    cache?: Partial<OccurrenceIterationCache>;
    recurrenceInstances?: { [key: number]: string };
}

export interface CalendarEventStoreRecord {
    Event: CalendarEvent;
    component: VcalVeventComponent;

    isRecurring: boolean;
    isAllDay: boolean;
    isAllPartDay: boolean;

    start: Date;
    end: Date;

    counter: number;
}

export type DecryptedTupleResult = [VcalVeventComponent, DecryptedEventPersonalMap];
export type DecryptedEventPersonalMap = EventPersonalMap;

export type ReadEventCb = (calendarID: string, eventID: string) => DecryptedEventRecord;
export type GetDecryptedEventCb = (Event: CalendarEvent) => Promise<DecryptedTupleResult>;

export type DecryptedEventRecord = [
    DecryptedTupleResult | undefined,
    Promise<DecryptedEventRecord> | undefined,
    Error | undefined
];

export type RecurringEventsCache = Map<string, RecurringCache>;
export type EventsCache = Map<string, CalendarEventStoreRecord>;
export type DecryptedEventsCache = Map<string, DecryptedEventRecord>;
export interface CalendarEventCache {
    dateRanges: Date[][];
    events: EventsCache;
    recurringEvents: RecurringEventsCache;
    decryptedEvents: DecryptedEventsCache;
    tree: IntervalTree;
}

export interface CalendarsEventsCache {
    ref: number;
    isUnmounted: boolean;
    calendars: {
        [key: string]: CalendarEventCache;
    };
    getCachedEvent: (calendarID: string, eventID: string) => CalendarEvent | undefined;
    rerender?: () => void;
}
