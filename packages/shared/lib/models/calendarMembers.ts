import {
    getIsCalendarEventManagerCreate,
    getIsCalendarEventManagerDelete,
    getIsCalendarEventManagerUpdate,
    getIsCalendarMemberEventManagerCreate,
    getIsCalendarMemberEventManagerDelete,
    getIsCalendarMemberEventManagerUpdate,
} from '../eventManager/helpers';
import { CalendarWithOwnMembers } from '../interfaces/calendar';
import { CalendarEventManager, CalendarMemberEventManager } from '../interfaces/calendar/EventManager';
import { STATUS } from './cache';
import { CALENDARS_CACHE_KEY } from './calendarsModel';

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

export const updateCalendarsWithMembers = (
    cache: Map<string, any>,
    {
        Calendars = [],
        CalendarMembers = [],
    }: {
        Calendars?: CalendarEventManager[];
        CalendarMembers?: CalendarMemberEventManager[];
    }
) => {
    const { value: oldCalendarsWithMembers, status } = cache.get(CALENDARS_CACHE_KEY) || {};
    if (status !== STATUS.RESOLVED) {
        return;
    }

    const newCalendarsWithMembers: CalendarWithOwnMembers[] = [...oldCalendarsWithMembers];

    if (Calendars.length) {
        for (const event of Calendars) {
            if (getIsCalendarEventManagerDelete(event)) {
                const index = newCalendarsWithMembers.findIndex(({ ID }) => ID === event.ID);
                if (index !== -1) {
                    newCalendarsWithMembers.splice(index, 1);
                }
            } else if (getIsCalendarEventManagerCreate(event)) {
                const { ID: calendarID, Calendar } = event;
                const index = newCalendarsWithMembers.findIndex(({ ID }) => ID === calendarID);
                if (index !== -1) {
                    // The calendar already exists for a creation event. Ignore it.
                    continue;
                }
                newCalendarsWithMembers.push({ ...Calendar });
            } else if (getIsCalendarEventManagerUpdate(event)) {
                const { ID: calendarID, Calendar } = event;
                const index = newCalendarsWithMembers.findIndex(({ ID }) => ID === calendarID);
                if (index !== -1) {
                    // update only the calendar part. Members updated below if needed
                    const oldCalendarWithMembers = oldCalendarsWithMembers[index];
                    newCalendarsWithMembers.splice(index, 1, { ...oldCalendarWithMembers, ...Calendar });
                }
            }
        }
    }
    if (CalendarMembers.length) {
        for (const event of CalendarMembers) {
            if (getIsCalendarMemberEventManagerDelete(event)) {
                const [calendarIndex, memberIndex] = findMemberIndices(event.ID, newCalendarsWithMembers);
                // Remove the member from the calendar if it exists.
                if (calendarIndex !== -1 && memberIndex !== -1) {
                    newCalendarsWithMembers[calendarIndex].Members.splice(memberIndex, 1);
                }
            } else {
                const [calendarIndex, memberIndex] = findMemberIndices(
                    event.ID,
                    newCalendarsWithMembers,
                    event.Member.CalendarID
                );
                // If the targeted calendar cannot be found, ignore this update. It will be dealt with when the calendar update happens.
                if (calendarIndex === -1) {
                    continue;
                }
                if (getIsCalendarMemberEventManagerCreate(event)) {
                    if (memberIndex !== -1) {
                        continue;
                    }
                    newCalendarsWithMembers[calendarIndex].Members.push(event.Member);
                } else if (getIsCalendarMemberEventManagerUpdate(event)) {
                    if (memberIndex === -1) {
                        continue;
                    }
                    newCalendarsWithMembers[calendarIndex].Members.splice(memberIndex, 1, event.Member);
                }
            }
        }
    }
    cache.set(CALENDARS_CACHE_KEY, {
        status: STATUS.RESOLVED,
        value: newCalendarsWithMembers,
    });
};
