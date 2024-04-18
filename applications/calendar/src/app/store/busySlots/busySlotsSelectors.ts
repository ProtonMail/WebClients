import { createSelector } from '@reduxjs/toolkit';

import { getBusyScheduledEvent } from '../../containers/calendar/eventHelper';
import { CalendarViewBusyEvent } from '../../containers/calendar/interface';
import { CalendarState } from '../store';
import { BusySlotFetchStatus, BusySlotsVisibility, busySlotsSliceName } from './busySlotsSlice';

export const selectAttendeesBusySlots = createSelector(
    (state: CalendarState) => state[busySlotsSliceName].displayOnGrid,
    (state: CalendarState) => state[busySlotsSliceName].metadata,
    (state: CalendarState) => state[busySlotsSliceName].attendees,
    (state: CalendarState) => state[busySlotsSliceName].attendeeBusySlots,
    (state: CalendarState) => state[busySlotsSliceName].attendeeVisibility,
    (state: CalendarState) => state[busySlotsSliceName].attendeeDataAccessible,
    (state: CalendarState) => state[busySlotsSliceName].attendeeColor,
    (
        display,
        metadata,
        attendees,
        busySlots,
        availabilities,
        dataAccessible,
        attendeesColor
    ): CalendarViewBusyEvent[] => {
        if (!display || !metadata || attendees.length === 0) {
            return [];
        }

        return Object.keys(busySlots).reduce<CalendarViewBusyEvent[]>((acc, email) => {
            if (
                attendees.includes(email) &&
                dataAccessible[email] === true &&
                availabilities[email] === 'visible' &&
                busySlots[email].length > 0
            ) {
                const attendeeFormattedTimeslots = busySlots[email].map((busySlot) => {
                    return getBusyScheduledEvent(email, busySlot, metadata.tzid, attendeesColor[email] || '');
                });

                acc = [...acc, ...attendeeFormattedTimeslots];
            }
            return acc;
        }, []);
    }
);

const selectAttendeeColor = (state: CalendarState, email: string): string | undefined =>
    state[busySlotsSliceName].attendeeColor[email];
const selectAttendeeVisibility = (state: CalendarState, email: string): BusySlotsVisibility | undefined =>
    state[busySlotsSliceName].attendeeVisibility[email];
const selectAttendeeAvailability = (state: CalendarState, email: string): boolean =>
    !!state[busySlotsSliceName].attendeeDataAccessible[email];
const selectAttendeeFetchStatus = (state: CalendarState, email: string): BusySlotFetchStatus | undefined =>
    state[busySlotsSliceName].attendeeFetchStatus[email];

export const selectAttendeeBusyData = createSelector(
    [selectAttendeeColor, selectAttendeeVisibility, selectAttendeeAvailability, selectAttendeeFetchStatus],
    (color, visibility, hasAvailability, fetchStatus) => {
        const status: 'loading' | 'available' | 'not-available' = (() => {
            if (fetchStatus === 'loading') {
                return 'loading';
            }

            return hasAvailability ? 'available' : 'not-available';
        })();

        return {
            color,
            hasAvailability,
            isVisible: visibility === 'visible',
            status,
        };
    }
);

/**
 * Display availability unknown sentence in the participant rows if at least one attendee has unknown availability
 * @param state CalendarState
 * @returns boolean
 */
export const selectDisplayAvailabilityUnknown = (state: CalendarState) =>
    Object.entries(state[busySlotsSliceName].attendeeDataAccessible).reduce((acc, [email, attendeeDataAccessible]) => {
        if (!attendeeDataAccessible && state[busySlotsSliceName].attendees.includes(email)) {
            acc = true;
        }
        return acc;
    }, false);
