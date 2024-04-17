import { fromUnixTime, getUnixTime } from 'date-fns';

import { getBusyTimeSlots } from '@proton/shared/lib/api/calendars';
import { BUSY_TIME_SLOTS_MAX_ATTENDEES_DISPLAYED } from '@proton/shared/lib/calendar/constants';
import { ACCENT_COLORS } from '@proton/shared/lib/colors';
import { convertZonedDateTimeToUTC, fromUTCDate, toUTCDate } from '@proton/shared/lib/date/timezone';
import { Api } from '@proton/shared/lib/interfaces';
import {
    BUSY_TIME_SLOT_TYPE,
    CalendarWithOwnMembers,
    GetBusyTimeSlotsResponse,
} from '@proton/shared/lib/interfaces/calendar';
import diff from '@proton/utils/diff';

import type { CalendarState } from '../store';
import type {
    BusyAttendeeFetchStatusSuccessActionPayload,
    BusyTimeSlot,
    BusyTimeSlotsState,
} from './busyTimeSlotsSlice';

export const getBusyAttendeesToFetch = (state: CalendarState): string[] => {
    const { busyTimeSlots } = state;
    const { attendees: eventAttendees, attendeeFetchStatus } = busyTimeSlots;
    const attendeesToFetch = eventAttendees.filter((email) => attendeeFetchStatus[email] === undefined);

    return attendeesToFetch;
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
            const calendarColors = userCalendars.map((item) => item?.Members?.[0]?.Color).filter(Boolean) || [];
            const attendeeColors = [...Object.values(actualAttendeesColors), ...Object.values(result)];
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
 * @returns Timerange to fetch busy slots in UTC timestamp based on the current view Timezone
 */
export const getBusyDatesToFetch = (state: CalendarState): [startTimestamp: number, endTimestamp: number] => {
    const { viewStartDate, viewEndDate, tzid } = assertBusyTimeSlotMetadata(state.busyTimeSlots.metadata);

    return [
        getUnixTime(toUTCDate(convertZonedDateTimeToUTC(fromUTCDate(fromUnixTime(viewStartDate)), tzid))),
        getUnixTime(toUTCDate(convertZonedDateTimeToUTC(fromUTCDate(fromUnixTime(viewEndDate)), tzid))),
    ];
};

/**
 * Check if busy slots date range has changed
 * @returns boolean
 */
export const busySlotsDateRangeChanged = (prevState: CalendarState, nextState: CalendarState) => {
    // If prev state start date was not defined it's not considered as a change but an init
    if (prevState.busyTimeSlots.metadata?.viewStartDate === undefined) {
        return false;
    }

    const prevStartDate = getBusyDatesToFetch(prevState)[0];
    const nextStartDate = getBusyDatesToFetch(nextState)[0];

    // If the start date has changed and the view start date is not the same day
    if (prevStartDate !== nextStartDate) {
        return true;
    }

    return false;
};

const normalizeDataFromResponse = (
    response: GetBusyTimeSlotsResponse,
    type: BUSY_TIME_SLOT_TYPE
): { busyTimeSlots: BusyTimeSlot[]; isDataAccessible: boolean } => {
    const isDataAccessible = !!response?.BusySchedule?.IsDataAccessible;
    const busyTimeSlots = (response?.BusySchedule?.BusyTimeSlots || []).reduce<BusyTimeSlot[]>((acc, timeSlot) => {
        if (!timeSlot || !timeSlot.Start || !timeSlot.End) {
            return acc;
        }
        const isAllDay = [BUSY_TIME_SLOT_TYPE.FULL_DAY_BEFORE, BUSY_TIME_SLOT_TYPE.FULL_DAY_IN].includes(type);
        acc.push({
            Start: timeSlot.Start,
            // Remove a second to the event to avoid overlapping in the UI
            End: isAllDay ? timeSlot.End - 1000 : timeSlot.End,
            // Add isAllDay flag to the busy time slots
            isAllDay,
        });
        return acc;
    }, []);

    return { busyTimeSlots, isDataAccessible };
};

const fetchBusySlotsFactory = async (
    type: BUSY_TIME_SLOT_TYPE,
    options: FetchAttendeeBusyTimeSlotsOptions,
    normalizer: typeof normalizeDataFromResponse
) => {
    const { api, email, startDate, endDate, tzid } = options;
    const result = await api<GetBusyTimeSlotsResponse>(
        getBusyTimeSlots(email, {
            Start: startDate,
            End: endDate,
            Type: type,
            Timezone: tzid,
        })
    );

    return normalizer(result, type);
};
interface FetchAttendeeBusyTimeSlotsOptions {
    api: Api;
    email: string;
    startDate: number;
    endDate: number;
    tzid: string;
}

export const fetchAttendeeBusyTimeSlots = async (options: FetchAttendeeBusyTimeSlotsOptions) => {
    // Fetch with `allSettled` to get results even if some of them fail
    const results = await Promise.allSettled([
        fetchBusySlotsFactory(BUSY_TIME_SLOT_TYPE.PARTIAL_DAY_IN, options, normalizeDataFromResponse),
        fetchBusySlotsFactory(BUSY_TIME_SLOT_TYPE.PARTIAL_DAY_BEFORE, options, normalizeDataFromResponse),
        fetchBusySlotsFactory(BUSY_TIME_SLOT_TYPE.FULL_DAY_IN, options, normalizeDataFromResponse),
        fetchBusySlotsFactory(BUSY_TIME_SLOT_TYPE.FULL_DAY_BEFORE, options, normalizeDataFromResponse),
    ]);

    // Filter out the failed promises
    const result = results.reduce<ReturnType<typeof normalizeDataFromResponse>[]>((acc, res) => {
        if (res.status === 'fulfilled') {
            acc.push(res.value);
        }
        return acc;
    }, []);

    /** Based on the first successful result out of all the busy time slots calls for this attendee */
    const isDataAccessible = !!result[0].isDataAccessible;

    let busyTimeSlots: BusyTimeSlot[] = result.reduce<BusyTimeSlot[]>((acc, res) => {
        if (Array.isArray(res.busyTimeSlots)) {
            acc.push(...res.busyTimeSlots);
        }
        return acc;
    }, []);

    return {
        isDataAccessible,
        busyTimeSlots,
    };
};

interface FetchAttendeesParams {
    api: Api;
    attendeesToFetch: string[];
    state: CalendarState;
    onColorChange: (attendees: { email: string; color: string }[]) => void;
    onFetchSuccess: (attendees: BusyAttendeeFetchStatusSuccessActionPayload[]) => void;
    onFetchFailed: (attendees: string[]) => void;
}

/**
 * Main function in charge of fetching attendees busy slots
 * @info This function dispatches redux actions
 */
export const fetchAttendeesBusyTimeSlots = async ({
    attendeesToFetch,
    state,
    api,
    onColorChange,
    onFetchFailed,
    onFetchSuccess,
}: FetchAttendeesParams) => {
    const { tzid } = assertBusyTimeSlotMetadata(state.busyTimeSlots.metadata);

    // Define attendees color
    const nextAttendeesColor = getBusyAttendeesColor(
        attendeesToFetch,
        state.busyTimeSlots.attendeeColor,
        state.calendars.value || []
    );

    onColorChange(
        attendeesToFetch.map((email) => ({
            email,
            color: nextAttendeesColor[email],
        }))
    );

    const [startDateToFetch, endDateToFetch] = getBusyDatesToFetch(state);

    // Set statuses to fetching
    const promises = attendeesToFetch.map((email) =>
        fetchAttendeeBusyTimeSlots({
            api,
            email,
            startDate: startDateToFetch,
            endDate: endDateToFetch,
            tzid,
        })
    );

    const results = await Promise.allSettled(promises);
    const fulfilledAttendees: Record<string, Awaited<ReturnType<typeof fetchAttendeeBusyTimeSlots>>> = {};
    const rejectedAttendeesEmails: string[] = [];

    results.forEach((result, index) => {
        const attendeeEmail = attendeesToFetch[index];
        if ('fulfilled' === result.status) {
            fulfilledAttendees[attendeeEmail] = result.value;
        }
        if ('rejected' === result.status) {
            rejectedAttendeesEmails.push(attendeeEmail);
        }
    });

    const currentVisibleAttendeesCount = state.busyTimeSlots.attendees.filter(
        (email) =>
            state.busyTimeSlots.attendeeVisibility[email] === 'visible' &&
            state.busyTimeSlots.attendeeDataAccessible[email]
    ).length;

    if (Object.keys(fulfilledAttendees).length > 0) {
        let nonAccessibleCounter = 0;
        const formattedAttendees: BusyAttendeeFetchStatusSuccessActionPayload[] = Object.entries(
            fulfilledAttendees
        ).map(([email, { isDataAccessible, busyTimeSlots }], index) => {
            if (!isDataAccessible) {
                nonAccessibleCounter++;
            }
            const visibleAttendeesCount = currentVisibleAttendeesCount + index - nonAccessibleCounter;

            const visibility = visibleAttendeesCount >= BUSY_TIME_SLOTS_MAX_ATTENDEES_DISPLAYED ? 'hidden' : 'visible';

            return {
                busyTimeSlots,
                email,
                isDataAccessible,
                visibility,
            };
        });
        onFetchSuccess(formattedAttendees);
    }

    if (rejectedAttendeesEmails.length > 0) {
        onFetchFailed(rejectedAttendeesEmails);
    }
};

export const getBusySlotStateChangeReason = (prevState: CalendarState, nextState: CalendarState) => {
    const attendeesChanged =
        nextState.busyTimeSlots.attendees !== prevState.busyTimeSlots.attendees &&
        diff(nextState.busyTimeSlots.attendees, prevState.busyTimeSlots.attendees).length > 0;

    const calendarViewDateChanged =
        nextState.busyTimeSlots.attendees.length > 0 &&
        nextState.busyTimeSlots.metadata?.viewStartDate !== prevState.busyTimeSlots.metadata?.viewStartDate;

    const calendarViewChanged =
        nextState.busyTimeSlots.attendees.length > 0 &&
        nextState.busyTimeSlots.metadata?.view !== prevState.busyTimeSlots.metadata?.view;

    if (attendeesChanged) {
        return 'attendees-changed';
    }

    if (calendarViewDateChanged) {
        return 'calendar-view-date-changed';
    }

    if (calendarViewChanged) {
        return 'calendar-view-changed';
    }

    return null;
};
