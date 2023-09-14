import { CalendarWithOwnMembers } from '../../interfaces/calendar';
import { CalendarEventManager, CalendarMemberEventManager } from '../../interfaces/calendar/EventManager';
import { STATUS } from '../../models/cache';
import { CALENDARS_CACHE_KEY } from '../../models/calendarsModel';
import {
    findMemberIndices,
    getIsCalendarEventManagerCreate,
    getIsCalendarEventManagerDelete,
    getIsCalendarEventManagerUpdate,
    getIsCalendarMemberEventManagerCreate,
    getIsCalendarMemberEventManagerDelete,
    getIsCalendarMemberEventManagerUpdate,
} from './helpers';

export const updateCalendarsWithMembers = (
    cache: Map<string, any>,
    {
        Calendars = [],
        CalendarMembers = [],
    }: {
        Calendars?: CalendarEventManager[];
        CalendarMembers?: CalendarMemberEventManager[];
    },
    ownAddressIDs: string[],
    stopManagers?: (ids: string[]) => void
) => {
    const { value: oldCalendarsWithMembers, status } = cache.get(CALENDARS_CACHE_KEY) || {};
    if (status !== STATUS.RESOLVED) {
        return;
    }

    const updateCalendars = !!Calendars.length;
    const updateMembers = !!CalendarMembers.length;

    if (!updateCalendars && !updateMembers) {
        return;
    }

    const newCalendarsWithMembers: CalendarWithOwnMembers[] = [...oldCalendarsWithMembers];

    if (updateCalendars) {
        for (const event of Calendars) {
            if (getIsCalendarEventManagerDelete(event)) {
                const index = newCalendarsWithMembers.findIndex(({ ID }) => ID === event.ID);
                if (index !== -1) {
                    newCalendarsWithMembers.splice(index, 1);
                }
                stopManagers?.([event.ID]);
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

    if (updateMembers) {
        for (const event of CalendarMembers) {
            if (getIsCalendarMemberEventManagerDelete(event)) {
                const [calendarIndex, memberIndex] = findMemberIndices(event.ID, newCalendarsWithMembers);
                if (calendarIndex !== -1 && memberIndex !== -1) {
                    const { CalendarID, AddressID } = newCalendarsWithMembers[calendarIndex].Members[memberIndex]!;
                    if (ownAddressIDs.includes(AddressID)) {
                        // the user is the member removed -> remove the calendar
                        newCalendarsWithMembers.splice(calendarIndex, 1);
                        stopManagers?.([CalendarID]);
                    } else {
                        // otherwise a member of one of an owned calendar got removed -> remove the member
                        newCalendarsWithMembers[calendarIndex].Members.splice(memberIndex, 1);
                    }
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
