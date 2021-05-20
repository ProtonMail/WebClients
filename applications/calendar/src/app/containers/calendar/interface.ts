import {
    AttendeeModel,
    Calendar,
    CalendarEvent,
    CalendarEventSharedData,
    EventModel,
} from 'proton-shared/lib/interfaces/calendar';
import {
    DELETE_CONFIRMATION_TYPES,
    RECURRING_TYPES,
    SAVE_CONFIRMATION_TYPES,
    VIEWS,
} from 'proton-shared/lib/calendar/constants';

import { TYPE } from '../../components/calendar/interactions/constants';
import { InviteActions, RecurringActionData } from '../../interfaces/Invite';
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
    createEvent: (attendees: AttendeeModel[]) => void;
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

export interface DisplayNameEmail {
    displayName: string;
    displayEmail: string;
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
export interface OnDeleteConfirmationArgs {
    type: DELETE_CONFIRMATION_TYPES;
    data?: {
        types: RECURRING_TYPES[];
        hasNonCancelledSingleEdits: boolean;
    };
    inviteActions: InviteActions;
    isInvitation: boolean;
}
export type OnSaveConfirmationCb = (data: OnSaveConfirmationArgs) => Promise<RecurringActionData>;
export type OnDeleteConfirmationCb = (data: OnDeleteConfirmationArgs) => Promise<RecurringActionData>;

export interface EventTargetAction {
    id: string;
    isAllDay: boolean;
    isAllPartDay: boolean;
    startInTzid: Date;
}
