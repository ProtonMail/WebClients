import { Calendar, CalendarEvent, CalendarEventSharedData } from 'proton-shared/lib/interfaces/calendar';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { TYPE } from '../../components/calendar/interactions/constants';
import { DELETE_CONFIRMATION_TYPES, RECURRING_TYPES, SAVE_CONFIRMATION_TYPES, VIEWS } from '../../constants';
import { EventModel } from '../../interfaces/EventModel';
import { InviteActions } from './eventActions/inviteActions';
import { EventReadResult } from './eventStore/interface';

export interface CalendarViewEventDataRecurring {
    occurrenceNumber: number;
    localStart: Date;
    localEnd: Date;
    isSingleOccurrence: boolean;
}

export interface CalendarViewEventData {
    calendarData: Calendar;
    eventData?: CalendarEvent | CalendarEventSharedData;
    eventRecurrence?: CalendarViewEventDataRecurring;
    eventReadResult?: EventReadResult;
}

export interface CalendarViewEvent {
    id: string;
    isAllDay: boolean;
    isAllPartDay: boolean;
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

export interface TimeGridRef {
    scrollToNow: () => void;
    scrollToTime: (date: Date) => void;
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
    type: TYPE;
}

export interface TargetMoreData {
    idx: number;
    row: number;
    date: Date;
    events: Set<string>;
}

export interface InteractiveState {
    temporaryEvent?: CalendarViewEventTemporaryEvent;
    targetEventData?: TargetEventData;
    targetMoreData?: TargetMoreData;
}

export interface OnSaveConfirmationArgs {
    type: SAVE_CONFIRMATION_TYPES;
    data?: {
        types: RECURRING_TYPES[];
        hasSingleModifications: boolean;
        hasSingleModificationsAfter: boolean;
        hasRruleModification: boolean;
        hasCalendarModification: boolean;
    };
    inviteActions: InviteActions;
    isInvitation: boolean;
}
export type OnSaveConfirmationCb = (data: OnSaveConfirmationArgs) => Promise<RECURRING_TYPES>;
export type OnDeleteConfirmationCb = (data: {
    type: DELETE_CONFIRMATION_TYPES;
    data?: RECURRING_TYPES[];
    inviteActions?: InviteActions;
    veventComponent?: VcalVeventComponent;
}) => Promise<RECURRING_TYPES>;

export interface EventTargetAction {
    id: string;
    isAllDay: boolean;
    isAllPartDay: boolean;
    startInTzid: Date;
}
