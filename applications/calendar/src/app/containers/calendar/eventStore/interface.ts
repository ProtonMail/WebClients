import createIntervalTree from '@protontech/interval-tree';

import { SHARED_SIGNED_FIELDS } from '@proton/shared/lib/calendar/constants';
import { OccurrenceIterationCache } from '@proton/shared/lib/calendar/recurring';
import { pick } from '@proton/shared/lib/helpers/object';
import { CalendarEvent, CalendarEventSharedData, DecryptedVeventResult } from '@proton/shared/lib/interfaces/calendar';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

import { EventInternalProperties } from '../../../interfaces/EventInternalProperties';

export type IntervalTree = ReturnType<typeof createIntervalTree>;

export interface RecurringCache {
    parentEventID?: string;
    cache?: Partial<OccurrenceIterationCache>;
    recurrenceInstances?: { [key: number]: string };
}

export type DecryptedEventTupleResult = [
    DecryptedVeventResult,
    { [memberID: string]: DecryptedVeventResult | undefined },
    Pick<EventInternalProperties, 'Permissions' | 'IsProtonProtonInvite'>
];
export type EventReadResult = {
    result?: DecryptedEventTupleResult;
    error?: Error;
};

// Just to get picked types
const sharedPick = (x: VcalVeventComponent) => pick(x, [...SHARED_SIGNED_FIELDS, 'component']);
export type SharedVcalVeventComponent = ReturnType<typeof sharedPick>;
export type MetadataVcalVeventComponent = Pick<
    VcalVeventComponent,
    'uid' | 'dtstamp' | 'component' | 'dtstart' | 'dtend' | 'recurrence-id' | 'exdate' | 'rrule'
>;

export interface CalendarEventStoreRecord {
    utcStart: Date;
    utcEnd: Date;

    isAllDay: boolean;
    isAllPartDay: boolean;

    eventData?: CalendarEvent | CalendarEventSharedData;
    eventComponent: SharedVcalVeventComponent | MetadataVcalVeventComponent;
    eventReadResult?: EventReadResult;
    eventPromise?: Promise<void>;
}

export type RecurringEventsCache = Map<string, RecurringCache>;
export type EventsCache = Map<string, CalendarEventStoreRecord>;
export type FetchCache = Map<string, { promise?: Promise<void>; dateRange: [Date, Date] }>;
export type FetchUidCache = Map<string, { promise?: Promise<void> }>;
export interface CalendarEventsCache {
    events: EventsCache;
    recurringEvents: RecurringEventsCache;
    tree: IntervalTree;
    fetchTree: IntervalTree;
    fetchCache: FetchCache;
    fetchUidCache: FetchUidCache;
}

export interface CalendarsEventsCache {
    ref: number;
    isUnmounted: boolean;
    calendars: {
        [key: string]: CalendarEventsCache | undefined;
    };
    getCachedEvent: (calendarID: string, eventID: string) => CalendarEvent | undefined;
    getCachedRecurringEvent: (calendarID: string, uid: string) => RecurringCache | undefined;
    rerender?: () => void;
}

export type GetDecryptedEventCb = (Event: CalendarEvent) => Promise<DecryptedEventTupleResult>;
