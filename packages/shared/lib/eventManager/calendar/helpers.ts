import { EVENT_ACTIONS } from '../../constants';
import { CalendarWithOwnMembers } from '../../interfaces/calendar';
import {
    CalendarEventManager,
    CalendarEventManagerCreate,
    CalendarEventManagerDelete,
    CalendarEventManagerUpdate,
    CalendarMemberEventManager,
    CalendarMemberEventManagerCreate,
    CalendarMemberEventManagerDelete,
    CalendarMemberEventManagerUpdate,
} from '../../interfaces/calendar/EventManager';

export const getIsCalendarEventManagerDelete = (event: CalendarEventManager): event is CalendarEventManagerDelete => {
    return event.Action === EVENT_ACTIONS.DELETE;
};
export const getIsCalendarEventManagerCreate = (event: CalendarEventManager): event is CalendarEventManagerCreate => {
    return event.Action === EVENT_ACTIONS.CREATE;
};
export const getIsCalendarEventManagerUpdate = (event: CalendarEventManager): event is CalendarEventManagerUpdate => {
    return event.Action === EVENT_ACTIONS.UPDATE;
};
export const getIsCalendarMemberEventManagerDelete = (
    event: CalendarMemberEventManager
): event is CalendarMemberEventManagerDelete => {
    return event.Action === EVENT_ACTIONS.DELETE;
};
export const getIsCalendarMemberEventManagerCreate = (
    event: CalendarMemberEventManager
): event is CalendarMemberEventManagerCreate => {
    return event.Action === EVENT_ACTIONS.CREATE;
};
export const getIsCalendarMemberEventManagerUpdate = (
    event: CalendarMemberEventManager
): event is CalendarMemberEventManagerUpdate => {
    return event.Action === EVENT_ACTIONS.UPDATE;
};
export const findMemberIndices = (
    memberID: string,
    calendarsWithMembers: CalendarWithOwnMembers[],
    memberCalendarID?: string
) => {
    let calendarIndex = -1;
    let memberIndex = -1;

    calendarsWithMembers.forEach(({ ID, Members }, i) => {
        if (ID === memberCalendarID) {
            calendarIndex = i;
        }
        Members.forEach(({ ID }, j) => {
            if (ID === memberID) {
                memberIndex = j;
                calendarIndex = i;
            }
        });
    });

    return [calendarIndex, memberIndex];
};
