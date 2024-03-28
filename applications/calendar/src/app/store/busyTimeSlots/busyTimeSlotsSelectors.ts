import { createSelector } from '@reduxjs/toolkit';

import { getBusyScheduledEvent } from '../../containers/calendar/eventHelper';
import { CalendarViewBusyEvent } from '../../containers/calendar/interface';
import { CalendarState } from '../store';

export const selectAttendeesBusyTimeSlots = createSelector(
    (state: CalendarState) => state.busyTimeSlots.metadata,
    (state: CalendarState) => state.busyTimeSlots.attendees,
    (state: CalendarState) => state.busyTimeSlots.attendeeBusySlots,
    (state: CalendarState) => state.busyTimeSlots.attendeeVisibility,
    (state: CalendarState) => state.busyTimeSlots.attendeeDataAccessible,
    (state: CalendarState) => state.busyTimeSlots.attendeeColor,
    (metadata, attendees, busyTimeSlots, availabilities, dataAccessible, attendeesColor): CalendarViewBusyEvent[] => {
        if (!metadata || attendees.length === 0) {
            return [];
        }

        return Object.keys(busyTimeSlots).reduce<CalendarViewBusyEvent[]>((acc, email) => {
            if (
                attendees.includes(email) &&
                dataAccessible[email] === true &&
                availabilities[email] === 'visible' &&
                busyTimeSlots[email].length > 0
            ) {
                const attendeeFormattedTimeslots = busyTimeSlots[email].map((timeSlot) => {
                    return getBusyScheduledEvent(
                        email,
                        timeSlot.Start,
                        timeSlot.End,
                        metadata.tzid,
                        attendeesColor[email] || ''
                    );
                });

                acc = [...acc, ...attendeeFormattedTimeslots];
            }
            return acc;
        }, []);
    }
);

const selectAttendeeColor = (state: CalendarState, email: string) => state.busyTimeSlots.attendeeColor[email];
const selectAttendeeVisibility = (state: CalendarState, email: string) => state.busyTimeSlots.attendeeVisibility[email];
const selectAttendeeAvailability = (state: CalendarState, email: string) =>
    state.busyTimeSlots.attendeeDataAccessible[email];
const selectAttendeeFetchStatus = (state: CalendarState, email: string) =>
    state.busyTimeSlots.attendeeFetchStatus[email];

export const selectAttendeeBusyData = createSelector(
    [selectAttendeeColor, selectAttendeeVisibility, selectAttendeeAvailability, selectAttendeeFetchStatus],
    (color, visibility, hasAvailability, fetchStatus) => {
        return {
            color,
            hasAvailability,
            isVisible: visibility === 'visible',
            isLoading: fetchStatus === 'loading',
            isError: fetchStatus === 'error',
        };
    }
);

/**
 * Display availability unknown sentence in the participant rows if at least one attendee has unknown availability
 * @param state CalendarState
 * @returns boolean
 */
export const selectDisplayAvailabilityUnknown = (state: CalendarState) =>
    Object.entries(state.busyTimeSlots.attendeeDataAccessible).reduce((acc, [email, attendeeDataAccessible]) => {
        if (!attendeeDataAccessible && state.busyTimeSlots.attendees.includes(email)) {
            acc = true;
        }
        return acc;
    }, false);
