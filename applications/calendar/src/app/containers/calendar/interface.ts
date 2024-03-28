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
import { SendPreferences } from '@proton/shared/lib/interfaces/mail/crypto';

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
    uniqueId: string;
    isAllDay: boolean;
    isAllPartDay: boolean;
    start: Date;
    end: Date;
    data: CalendarViewEventData;
}

export interface SharedViewProps {
    view: VIEWS;
    isSmallViewport: boolean;
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
    onClickToday: () => void;
}

export interface TimeGridRef {
    scrollToNow: () => void;
    scrollToTime: (date: Date) => void;
}

export interface InteractiveRef {
    createEvent: (attendees: AttendeeModel[]) => void;
}

export interface CalendarViewEventTemporaryEvent extends CalendarViewEvent {
    targetUniqueId?: string;
    tmpData: EventModel;
    tmpDataOriginal: EventModel;
    tmpOriginalTarget?: CalendarViewEvent | CalendarViewEventTemporaryEvent;
}

export interface CalendarViewBusyEvent
    extends Pick<CalendarViewEvent, 'start' | 'end' | 'isAllDay' | 'isAllPartDay' | 'uniqueId'> {
    type: 'busy';
    color: string;
    email: string;
}

export interface TargetEventData {
    uniqueId: string;
    idx?: number;
    type: TYPE;
    /** We want to prevent popover opening when calendar app is opened in the drawer */
    preventPopover?: boolean;
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
    searchData?: CalendarViewEvent;
}

export interface DisplayNameEmail {
    displayName: string;
    displayEmail: string;
}

export interface CalendarSearchQuery {
    keyword?: string;
    begin?: string;
    end?: string;
    page?: string;
}

export interface OnSaveConfirmationArgs {
    type: SAVE_CONFIRMATION_TYPES;
    data?: {
        types: RECURRING_TYPES[];
        hasSingleEdits: boolean;
        hasSingleDeletes: boolean;
        hasSingleEditsAfter: boolean;
        hasSingleDeletesAfter: boolean;
        hasRruleModification: boolean;
        hasCalendarModification: boolean;
        isBreakingChange: boolean;
    };
    inviteActions: InviteActions;
    isOrganizer: boolean;
    isAttendee: boolean;
    canEditOnlyPersonalPart: boolean;
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
    uniqueId: string;
    isAllDay: boolean;
    isAllPartDay: boolean;
    startInTzid: Date;
    preventPopover?: boolean; // used when opening an event from PM inside the drawer
}

export interface AugmentedSendPreferences extends SendPreferences {
    isInternal: boolean;
}
