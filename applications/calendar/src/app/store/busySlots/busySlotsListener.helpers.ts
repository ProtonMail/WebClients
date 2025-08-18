import { fromUnixTime, getUnixTime } from 'date-fns';

import { getBusySlots } from '@proton/shared/lib/api/calendars';
import { BUSY_TIME_SLOTS_MAX_ATTENDEES_DISPLAYED } from '@proton/shared/lib/calendar/constants';
import { ACCENT_COLORS } from '@proton/shared/lib/colors';
import { convertZonedDateTimeToUTC, fromUTCDate, toUTCDate } from '@proton/shared/lib/date/timezone';
import type { Api } from '@proton/shared/lib/interfaces';
import type { CalendarWithOwnMembers, GetBusySlotsResponse } from '@proton/shared/lib/interfaces/calendar';
import { BUSY_TIME_SLOT_TYPE } from '@proton/shared/lib/interfaces/calendar';
import diff from '@proton/utils/diff';

import type { CalendarState } from '../store';
import {
    type BusySlot,
    type BusySlotsAttendeeFetchStatusSuccessActionPayload,
    type BusySlotsState,
    busySlotsSliceName,
} from './busySlotsSlice';

export const getBusyAttendeesToFetch = (state: CalendarState): string[] => {
    const { attendees: eventAttendees, attendeeFetchStatus } = state[busySlotsSliceName];
    const attendeesToFetch = eventAttendees.filter((email) => attendeeFetchStatus[email] === undefined);

    return attendeesToFetch;
};

const getInfinitelyLoopingColor = (() => {
    let index = 0;
    return () => {
        const color = ACCENT_COLORS[index];
        index = (index + 1) % ACCENT_COLORS.length;
        return color;
    };
})();

const getBusyAttendeesColor = (
    nextAttendees: string[],
    actualAttendeesColors: BusySlotsState['attendeeColor'],
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
            const availableColors = ACCENT_COLORS.filter(
                (color) => !calendarColors.includes(color) && !attendeeColors.includes(color)
            );

            // If filtered colors are available, return the first one
            if (availableColors.length > 0) {
                return availableColors[0];
            }

            // If too much attendees then loop over the entire color palette
            return getInfinitelyLoopingColor();
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
const assertBusySlotsMetadata = (
    metadata: BusySlotsState['metadata']
): Exclude<BusySlotsState['metadata'], undefined> => {
    if (metadata === undefined) {
        throw new Error('Missing metadata');
    }
    return metadata;
};

/**
 * Get the range of dates to fetch busy slots
 * @returns Timerange to fetch busy slots in UTC timestamp based on the current view Timezone
 */
const getBusyDatesToFetch = (state: CalendarState): [startTimestamp: number, endTimestamp: number] => {
    const { viewStartDate, viewEndDate, tzid } = assertBusySlotsMetadata(state[busySlotsSliceName].metadata);

    return [
        getUnixTime(toUTCDate(convertZonedDateTimeToUTC(fromUTCDate(fromUnixTime(viewStartDate)), tzid))),
        getUnixTime(toUTCDate(convertZonedDateTimeToUTC(fromUTCDate(fromUnixTime(viewEndDate)), tzid))),
    ];
};

const normalizeBusySlotsResponse = (
    response: GetBusySlotsResponse,
    type: BUSY_TIME_SLOT_TYPE
): { busySlots: BusySlot[]; isDataAccessible: boolean } => {
    const isDataAccessible = !!response?.BusySchedule?.IsDataAccessible;
    const busySlots = (response?.BusySchedule?.BusyTimeSlots || []).reduce<BusySlot[]>((acc, timeSlot) => {
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

    return { busySlots, isDataAccessible };
};

const fetchBusySlotsFactory = async (
    type: BUSY_TIME_SLOT_TYPE,
    options: FetchAttendeeBusySlotsOptions,
    normalizer: typeof normalizeBusySlotsResponse
) => {
    const { api, email, startDate, endDate, tzid } = options;
    const result = await api<GetBusySlotsResponse>(
        getBusySlots(email, {
            Start: startDate,
            End: endDate,
            Type: type,
            Timezone: tzid,
        })
    );

    return normalizer(result, type);
};
interface FetchAttendeeBusySlotsOptions {
    api: Api;
    email: string;
    startDate: number;
    endDate: number;
    tzid: string;
}

const fetchAttendeeBusySlots = async (options: FetchAttendeeBusySlotsOptions) => {
    // Fetch with `allSettled` to get results even if some of them fail
    const results = await Promise.allSettled([
        fetchBusySlotsFactory(BUSY_TIME_SLOT_TYPE.PARTIAL_DAY_IN, options, normalizeBusySlotsResponse),
        fetchBusySlotsFactory(BUSY_TIME_SLOT_TYPE.PARTIAL_DAY_BEFORE, options, normalizeBusySlotsResponse),
        fetchBusySlotsFactory(BUSY_TIME_SLOT_TYPE.FULL_DAY_IN, options, normalizeBusySlotsResponse),
        fetchBusySlotsFactory(BUSY_TIME_SLOT_TYPE.FULL_DAY_BEFORE, options, normalizeBusySlotsResponse),
    ]);

    // Filter out the failed promises
    const result = results.reduce<ReturnType<typeof normalizeBusySlotsResponse>[]>((acc, res) => {
        if (res.status === 'fulfilled') {
            acc.push(res.value);
        }
        return acc;
    }, []);

    /** Based on the first successful result out of all the busy time slots calls for this attendee */
    const isDataAccessible = !!result[0].isDataAccessible;

    const busySlots: BusySlot[] = result.reduce<BusySlot[]>((acc, res) => {
        if (Array.isArray(res.busySlots)) {
            acc.push(...res.busySlots);
        }
        return acc;
    }, []);

    return {
        isDataAccessible,
        busySlots,
    };
};

interface FetchAttendeesParams {
    api: Api;
    attendeesToFetch: string[];
    state: CalendarState;
    onColorChange: (attendees: { email: string; color: string }[]) => void;
    onFetchSuccess: (attendees: BusySlotsAttendeeFetchStatusSuccessActionPayload[]) => void;
    onFetchFailed: (attendees: string[]) => void;
}

/**
 * Main function in charge of fetching attendees busy slots
 * @info This function dispatches redux actions
 */
export const fetchAttendeesBusySlots = async ({
    attendeesToFetch,
    state,
    api,
    onColorChange,
    onFetchFailed,
    onFetchSuccess,
}: FetchAttendeesParams) => {
    const { tzid } = assertBusySlotsMetadata(state[busySlotsSliceName].metadata);

    // Define attendees color
    const nextAttendeesColor = getBusyAttendeesColor(
        attendeesToFetch,
        state[busySlotsSliceName].attendeeColor,
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
        fetchAttendeeBusySlots({
            api,
            email,
            startDate: startDateToFetch,
            endDate: endDateToFetch,
            tzid,
        })
    );

    const results = await Promise.allSettled(promises);
    const fulfilledAttendees: Record<string, Awaited<ReturnType<typeof fetchAttendeeBusySlots>>> = {};
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

    const currentVisibleAttendeesCount = state[busySlotsSliceName].attendees.filter(
        (email) =>
            state[busySlotsSliceName].attendeeVisibility[email] === 'visible' &&
            state[busySlotsSliceName].attendeeDataAccessible[email]
    ).length;

    if (Object.keys(fulfilledAttendees).length > 0) {
        let nonAccessibleCounter = 0;
        const formattedAttendees: BusySlotsAttendeeFetchStatusSuccessActionPayload[] = Object.entries(
            fulfilledAttendees
        ).map(([email, { isDataAccessible, busySlots }], index) => {
            if (!isDataAccessible) {
                nonAccessibleCounter++;
            }
            const visibleAttendeesCount = currentVisibleAttendeesCount + index - nonAccessibleCounter;

            const visibility =
                visibleAttendeesCount >= BUSY_TIME_SLOTS_MAX_ATTENDEES_DISPLAYED || !isDataAccessible
                    ? 'hidden'
                    : 'visible';

            return {
                busySlots,
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
        nextState[busySlotsSliceName].attendees !== prevState[busySlotsSliceName].attendees &&
        diff(nextState[busySlotsSliceName].attendees, prevState[busySlotsSliceName].attendees).length > 0;

    const calendarViewDateChanged =
        nextState[busySlotsSliceName].attendees.length > 0 &&
        nextState[busySlotsSliceName].metadata?.viewStartDate !== prevState[busySlotsSliceName].metadata?.viewStartDate;

    const calendarViewChanged =
        nextState[busySlotsSliceName].attendees.length > 0 &&
        nextState[busySlotsSliceName].metadata?.view !== prevState[busySlotsSliceName].metadata?.view;

    const timezoneChanged =
        nextState[busySlotsSliceName].attendees.length > 0 &&
        nextState[busySlotsSliceName].metadata?.tzid !== prevState[busySlotsSliceName].metadata?.tzid;

    const displayChanged = nextState[busySlotsSliceName].displayOnGrid !== prevState[busySlotsSliceName].displayOnGrid;

    if (attendeesChanged) {
        return 'attendees-changed';
    }

    if (calendarViewDateChanged) {
        return 'calendar-view-date-changed';
    }

    if (calendarViewChanged) {
        return 'calendar-view-changed';
    }

    if (displayChanged) {
        return 'display-changed';
    }

    if (timezoneChanged) {
        return 'timezone-changed';
    }

    return null;
};
