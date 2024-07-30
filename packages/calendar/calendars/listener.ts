import { createNextState } from '@reduxjs/toolkit';

import { selectAddresses } from '@proton/account/addresses';
import { serverEvent } from '@proton/account/eventLoop';
import {
    findMemberIndices,
    getIsCalendarEventManagerCreate,
    getIsCalendarEventManagerDelete,
    getIsCalendarEventManagerUpdate,
    getIsCalendarMemberEventManagerCreate,
    getIsCalendarMemberEventManagerDelete,
    getIsCalendarMemberEventManagerUpdate,
} from '@proton/shared/lib/eventManager/calendar/helpers';

import type { CalendarStartListening } from '../interface';
import { CalendarsState, calendarsActions, selectCalendars } from './index';

// This calendar event listener needs to access the global state to get the addresses, so it's a listener and not a reducer.
export const startCalendarEventListener = (startListening: CalendarStartListening<CalendarsState>) => {
    startListening({
        actionCreator: serverEvent,
        effect: async (action, listenerApi) => {
            if (!action.payload.Calendars && !action.payload.CalendarMembers) {
                return;
            }

            const state = listenerApi.getState();
            const currentCalendarsWithMembers = selectCalendars(state).value;
            if (!currentCalendarsWithMembers) {
                return;
            }

            const updateCalendars = action.payload.Calendars;
            const updateMembers = action.payload.CalendarMembers;
            const calendarEventModelManager = listenerApi.extra.calendarModelEventManager;

            const oldCalendarsWithMembers = [...currentCalendarsWithMembers];
            const newCalendarsWithMembers = createNextState(oldCalendarsWithMembers, (newCalendarsWithMembers) => {
                if (updateCalendars?.length) {
                    for (const event of updateCalendars) {
                        if (getIsCalendarEventManagerDelete(event)) {
                            const index = newCalendarsWithMembers.findIndex(({ ID }) => ID === event.ID);
                            if (index !== -1) {
                                newCalendarsWithMembers.splice(index, 1);
                            }
                            calendarEventModelManager.reset([event.ID]);
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

                if (updateMembers?.length) {
                    const ownAddressIDs = (selectAddresses(state)?.value || []).map(({ ID }) => ID);

                    for (const event of updateMembers) {
                        if (getIsCalendarMemberEventManagerDelete(event)) {
                            const [calendarIndex, memberIndex] = findMemberIndices(event.ID, newCalendarsWithMembers);
                            if (calendarIndex !== -1 && memberIndex !== -1) {
                                const { CalendarID, AddressID } =
                                    newCalendarsWithMembers[calendarIndex].Members[memberIndex]!;
                                if (ownAddressIDs.includes(AddressID)) {
                                    // the user is the member removed -> remove the calendar
                                    newCalendarsWithMembers.splice(calendarIndex, 1);
                                    calendarEventModelManager.reset([CalendarID]);
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
            });

            if (newCalendarsWithMembers !== oldCalendarsWithMembers) {
                listenerApi.dispatch(calendarsActions.updateCalendars(newCalendarsWithMembers));
            }
        },
    });
};
