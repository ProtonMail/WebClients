import {
    DELETE_CONFIRMATION_TYPES,
    RECURRING_TYPES,
    SAVE_CONFIRMATION_TYPES,
    VIEWS,
} from '@proton/shared/lib/calendar/constants';
import {
    AttendeeModel,
    CalendarEvent,
    CalendarEventSharedData,
    EventModel,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar';

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
    calendarData: VisualCalendar;
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
    onChangeDate: (date: Date) => void;
}

export interface TimeGridRef {
    scrollToNow: () => void;
    scrollToTime: (date: Date) => void;
}

export type OnCreateEventProps = { attendees?: AttendeeModel[]; startModel?: EventModel };

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
    preventPopover?: boolean; // We want to prevent popover opening when calendar app is opened in the side panel
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
    isAttendee: boolean;
}
export interface OnDeleteConfirmationArgs {
    type: DELETE_CONFIRMATION_TYPES;
    data?: {
        types: RECURRING_TYPES[];
        hasNonCancelledSingleEdits: boolean;
    };
    inviteActions: InviteActions;
    isAttendee: boolean;
}
export type OnSaveConfirmationCb = (data: OnSaveConfirmationArgs) => Promise<RecurringActionData>;
export type OnDeleteConfirmationCb = (data: OnDeleteConfirmationArgs) => Promise<RecurringActionData>;

export interface EventTargetAction {
    id: string;
    isAllDay: boolean;
    isAllPartDay: boolean;
    startInTzid: Date;
    preventPopover?: boolean; // used when opening an event from PM inside the side app
}
