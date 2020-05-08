import { DELETE_CONFIRMATION_TYPES, RECURRING_TYPES, SAVE_CONFIRMATION_TYPES, VIEWS } from '../../constants';
import { CalendarEvent, Calendar } from 'proton-shared/lib/interfaces/calendar';
import { ReadEventCb } from './eventStore/interface';
import { EventModel } from '../../interfaces/EventModel';

export interface CalendarViewEventDataRecurring {
    occurrenceNumber: number;
    localStart: Date;
    localEnd: Date;
    isSingleOccurrence: boolean;
}

export interface CalendarViewEventData {
    Calendar: Calendar;
    Event?: CalendarEvent;
    readEvent?: ReadEventCb;
    counter?: number;
    recurrence?: CalendarViewEventDataRecurring;
}

export interface CalendarViewEvent {
    id: string;
    isAllDay: boolean;
    isAllPartDay: boolean;
    isRecurring: boolean;
    start: Date;
    end: Date;
    data: CalendarViewEventData;
}

export interface SharedViewProps {
    view: VIEWS;
    isNarrow: boolean;
    primaryTimezone: string;
    secondaryTimezone: string;
    secondaryTimezoneOffset: number;
    displayWeekNumbers: boolean;
    displaySecondaryTimezone: boolean;
    now: Date;
    date: Date;
    dateRange: [Date, Date];
    tzid: string;
    events: CalendarViewEvent[];
    onClickDate: (date: Date) => void;
}

export type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TimeGridRef {
    scrollToNow: () => void;
}
export interface InteractiveRef {
    createEvent: () => void;
}

export interface CalendarViewEventTemporaryEvent extends CalendarViewEvent {
    targetId?: string;
    tmpData: EventModel;
    tmpDataOriginal: EventModel;
    tmpOriginalTarget?: CalendarViewEvent | CalendarViewEventTemporaryEvent;
}

export interface TargetEventData {
    id: string;
    idx?: number;
    type: string;
}

export interface TargetMoreData {
    idx: number;
    row: number;
    date: Date;
    events: CalendarViewEvent[];
}

export interface InteractiveState {
    temporaryEvent?: CalendarViewEventTemporaryEvent;
    targetEventData?: TargetEventData;
    targetMoreData?: TargetMoreData;
}

export type OnSaveConfirmationCb = (data: {
    type: SAVE_CONFIRMATION_TYPES;
    data?: RECURRING_TYPES[];
}) => Promise<RECURRING_TYPES>;
export type OnDeleteConfirmationCb = (data: {
    type: DELETE_CONFIRMATION_TYPES;
    data?: RECURRING_TYPES[];
}) => Promise<RECURRING_TYPES>;
