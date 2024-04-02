import { endOfDay, endOfWeek, fromUnixTime, getUnixTime, startOfDay, startOfWeek } from 'date-fns';

import { selectUserSettings } from '@proton/account';
import { getBusyTimeSlots } from '@proton/shared/lib/api/calendars';
import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { ACCENT_COLORS } from '@proton/shared/lib/colors';
import { convertZonedDateTimeToUTC, fromLocalDate, toUTCDate } from '@proton/shared/lib/date/timezone';
import { Api } from '@proton/shared/lib/interfaces';
import {
    BUSY_TIME_SLOT_TYPE,
    CalendarWithOwnMembers,
    GetBusyTimeSlotsResponse,
} from '@proton/shared/lib/interfaces/calendar';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';

import { CalendarState } from '../store';
import { BusyTimeSlot, BusyTimeSlotsState } from './busyTimeSlotsSlice';

export const getBusyAttendeesToFetch = (state: CalendarState) => {
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
    const { startDate, tzid, view } = assertBusyTimeSlotMetadata(state.busyTimeSlots.metadata);

    const userSettings = selectUserSettings(state).value;
    if (!userSettings) {
        throw new Error('User settings not found');
    }

    const weekStartsOn = getWeekStartsOn(userSettings);
    const startTime = fromUnixTime(startDate);
    let start = startOfDay(startTime);
    let end = endOfDay(startTime);

    if (view === VIEWS.WEEK) {
        start = startOfWeek(startTime, { weekStartsOn });
        end = endOfWeek(startTime, { weekStartsOn });
    }

    return [
        getUnixTime(toUTCDate(convertZonedDateTimeToUTC(fromLocalDate(start), tzid))),
        getUnixTime(toUTCDate(convertZonedDateTimeToUTC(fromLocalDate(end), tzid))),
    ];
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
