import { endOfDay, endOfWeek, fromUnixTime, getUnixTime, isSameDay, startOfDay, startOfWeek } from 'date-fns';

import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { ACCENT_COLORS } from '@proton/shared/lib/colors';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { CalendarWithOwnMembers } from '@proton/shared/lib/interfaces/calendar';

import { CalendarState } from '../store';
import { BusyTimeSlotsState } from './busyTimeSlotsSlice';

/**
 * Makes a difference between two arrays
 * @param displayedAttendees attendees email list
 * @param fetchedAttendees  attendees object with email as key and fetch status as value
 * @returns attendees email list
 */
export const getBusyAttendeesToFetch = (
    displayedAttendees: string[],
    fetchedAttendees: BusyTimeSlotsState['attendeeFetchStatus']
) => {
    const fetchedOrCurrentlyFetchingAttendees = Object.entries(fetchedAttendees).reduce<string[]>(
        (acc, [email, status]) => {
            // We want to refetch the ones who've had errors while fetching their busy slots
            if (status !== 'error') {
                acc.push(email);
            }
            return acc;
        },
        []
    );

    return displayedAttendees.filter((email) => !fetchedOrCurrentlyFetchingAttendees.includes(email));
};

export const getBusyAttendeesColor = (
    nextAttendees: string[],
    actualAttendeesColors: BusyTimeSlotsState['attendeeColor'],
    userCalendars: CalendarWithOwnMembers[]
) => {
    const result: { [email: string]: string } = {};

    for (const email of nextAttendees) {
        if (actualAttendeesColors[email]) {
            result[email] = actualAttendeesColors[email];
            continue;
        }

        const attendeeColor = (() => {
            if (actualAttendeesColors[email]) {
                return actualAttendeesColors[email];
            }

            const calendarColors = userCalendars.map((item) => item?.Members?.[0]?.Color).filter(Boolean) || [];
            const attendeeColors = Object.values(actualAttendeesColors);
            const availableColors = ACCENT_COLORS.filter((color) => {
                return !calendarColors.includes(color) && !attendeeColors.includes(color);
            });

            return availableColors[0] || ACCENT_COLORS[0];
        })();

        result[email] = attendeeColor;
    }
    return result;
};

/**
 * Typescript guard to assert that metadata is not undefined
 * @param metadata
 * @returns object metatada
 */
export const assertBusyTimeSlotMetadata = (
    metadata: BusyTimeSlotsState['metadata']
): Exclude<BusyTimeSlotsState['metadata'], undefined> => {
    if (metadata === undefined) {
        throw new Error('Missing metadata');
    }
    return metadata;
};

/**
 * Get the range of dates to fetch busy slots
 * @params Takes event start date and current view to calculate the range of dates to fetch
 * @returns Timerange to fetch busy slots.
 */
export const getBusyDatesToFetch = ({
    startTimestamp,
    view,
    currentViewStartTimestamp,
    nowTimestamp,
    weekStartsOn,
}: {
    startTimestamp: number;
    view: VIEWS;
    currentViewStartTimestamp: number;
    nowTimestamp: number;
    weekStartsOn: WeekStartsOn;
}) => {
    const startTime = fromUnixTime(startTimestamp);
    let start = startOfDay(startTime);
    let end = endOfDay(startTime);

    if (view === VIEWS.WEEK) {
        // If the current view start is in the future, we need to fetch the whole week
        // Example: today is Wednesday and i'm on next wee view so:
        // - `nowTimestamp` is this wednesday
        // - `currentViewStartTimestamp` is next Monday
        // If i create an event in the next week view, i want to fetch the whole week to see
        // availability of others.
        start =
            currentViewStartTimestamp > nowTimestamp ? startOfWeek(startTime, { weekStartsOn }) : startOfDay(startTime);
        end = endOfWeek(startTime, { weekStartsOn });
    }

    // Return locale dates
    return [getUnixTime(start), getUnixTime(end)];
};

/**
 * Check if busy slots date range has changed
 * @returns boolean
 */
export const busySlotsDateRangeChanged = (prevState: CalendarState, nextState: CalendarState) => {
    // If the start date is not defined,
    if (prevState.busyTimeSlots.metadata?.startDate === undefined) {
        return false;
    }

    const prevMetadata = assertBusyTimeSlotMetadata(prevState.busyTimeSlots.metadata);
    const nextMetadata = assertBusyTimeSlotMetadata(nextState.busyTimeSlots.metadata);

    // If the start date has changed and the view start date is not the same day
    if (
        prevMetadata.startDate !== nextMetadata.startDate &&
        !isSameDay(fromUnixTime(prevMetadata.viewStartDate), fromUnixTime(nextMetadata.viewStartDate))
    ) {
        return true;
    }

    return false;
};
