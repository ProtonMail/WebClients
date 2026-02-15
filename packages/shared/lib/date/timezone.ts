import React, { type ReactNode } from 'react';

import { findTimeZone, getTimeZoneLinks, getUTCOffset, getZonedTime } from '@protontech/timezone-support';

import isTruthy from '@proton/utils/isTruthy';

import { getAllowedTimeZones } from '../api/calendars';
import { SECOND } from '../constants';
import type { Api } from '../interfaces';
import type { DateTime } from '../interfaces/calendar/Date';
import {
    FALLBACK_ALLOWED_SUPPORTED_TIMEZONES_LIST,
    MANUAL_TIMEZONE_EQUIVALENCE,
    MANUAL_TIMEZONE_LINKS,
    manualFindTimeZone,
    unsupportedTimezoneLinks,
} from './timezoneDatabase';

export const toLocalDate = ({
    year = 0,
    month = 1,
    day = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
}: Partial<DateTime>) => {
    return new Date(year, month - 1, day, hours, minutes, seconds);
};

export const toUTCDate = ({ year = 0, month = 1, day = 0, hours = 0, minutes = 0, seconds = 0 }: Partial<DateTime>) => {
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
};

export const fromLocalDate = (date: Date) => {
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds(),
    };
};

export const fromUTCDate = (date: Date) => {
    return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hours: date.getUTCHours(),
        minutes: date.getUTCMinutes(),
        seconds: date.getUTCSeconds(),
    };
};

// The list of all IANA time zones that we support is fetched from the BE at app load
export let ALLOWED_TIMEZONES_LIST: string[] = [...FALLBACK_ALLOWED_SUPPORTED_TIMEZONES_LIST];

let timezonesLoaded = false;
/**
 * Load from API list of time zones that the BE allows
 * */
export const loadAllowedTimeZones = async (api: Api) => {
    if (timezonesLoaded) {
        return;
    }
    timezonesLoaded = true;
    const { Timezones } = await api<{ Code: number; Timezones: string[] }>(getAllowedTimeZones());

    /*
     * We remove time zones that we cannot parse. In practice there should never be a need for this,
     * but because time zone updating is a manual process involving multiple teams, better be extra safe to avoid app crashes.
     *
     * The time it takes to run this code is one order of magnitude less than the API call above,
     * so it doesn't significatively decrease the performance of this function. If we ever need better
     * performance, there's room for improvement
     */
    const supportedTimeZones = Timezones.map((tzid) => {
        try {
            findTimeZone(tzid);
            return tzid;
        } catch (e: any) {
            // eslint-disable-next-line no-console
            console.error(`${tzid} not supported`);
        }
    }).filter(isTruthy);

    ALLOWED_TIMEZONES_LIST = supportedTimeZones;
};

export const guessTimezone = (timezones: string[]) => {
    try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Ensure it belongs in the list
        const tzid = manualFindTimeZone(timeZone) || findTimeZone(timeZone).name;
        const supportedTzid = unsupportedTimezoneLinks[tzid] || tzid;
        if (!timezones.includes(supportedTzid)) {
            throw new Error('Time zone not allowed');
        }
        return supportedTzid;
    } catch (error: any) {
        const date = new Date();
        const timezoneOffset = date.getTimezoneOffset();
        return timezones.find((tz) => {
            const { zone } = getZonedTime(date, findTimeZone(tz));
            return zone ? zone.offset === timezoneOffset : false;
        });
    }
};

/**
 * Get current timezone id by using Intl
 * if not available use timezone-support lib and pick the first timezone from the current date timezone offset
 */
export const getTimezone = () => {
    const ianaTimezones = ALLOWED_TIMEZONES_LIST;
    const timezone = guessTimezone(ianaTimezones);
    // If the guessed timezone is undefined, there's not much we can do
    if (!timezone) {
        return ALLOWED_TIMEZONES_LIST[0];
    }
    return timezone;
};

/**
 * Given a date and a timezone, return an object that contains information about the
 * UTC offset of that date in that timezone. Namely an offset abbreviation (e.g. 'CET')
 * and the UTC offset itself in minutes
 */
export const getTimezoneOffset = (nowDate: Date, tzid: string) => {
    return getUTCOffset(nowDate, findTimeZone(tzid));
};

export const formatTimezoneOffset = (offset: number) => {
    // offset comes with the opposite sign in the timezone-support library
    const sign = Math.sign(offset) === 1 ? '-' : '+';
    const minutes = Math.abs(offset % 60);
    const hours = (Math.abs(offset) - minutes) / 60;

    if (minutes > 0) {
        const paddedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
        return `${sign}${hours}:${paddedMinutes}`;
    }

    return `${sign}${hours}`;
};

export const formatGMTOffsetAbbreviation = (offset: number) => {
    return `GMT${formatTimezoneOffset(offset)}`;
};

interface FormatterProps {
    utcOffset: string;
    name: string;
}

type GetTimeZoneOptions = (
    date?: Date,
    options?: { formatter?: (a1: FormatterProps) => string }
) => {
    text: string;
    formattedText: ReactNode;
    value: string;
    key: string;
}[];

const formattedFormatter = ({ utcOffset, name }: FormatterProps): ReactNode =>
    React.createElement(
        React.Fragment,
        null,
        React.createElement('span', null, utcOffset),
        ' ',
        React.createElement('span', { className: 'timezone-separator' }, '•'),
        ' ',
        React.createElement('span', { className: 'timezone-name' }, name)
    );

const getTimeZoneDisplayName = (ianaName: string) => {
    if (ianaName === 'Europe/Kiev') {
        // Update Kyiv name before fully transitioning to 2022g
        return 'Europe/Kyiv';
    }
    return ianaName;
};

/**
 * @return {Array<Object>}      [{ text: 'Africa/Nairobi: UTC +03:00', value: 'Africa/Nairobi'}, ...]
 */
export const getTimeZoneOptions: GetTimeZoneOptions = (
    date = new Date(),
    { formatter = ({ utcOffset, name }: FormatterProps) => `${utcOffset} • ${name}` } = {}
) => {
    return ALLOWED_TIMEZONES_LIST.map((name) => {
        const { abbreviation, offset } = getUTCOffset(date, findTimeZone(name));

        return {
            name,
            offset,
            abbreviation,
        };
    })
        .sort(({ offset: offsetA, name: nameA }, { offset: offsetB, name: nameB }) => {
            const diff = offsetA - offsetB;
            if (diff === 0) {
                return nameA.localeCompare(nameB);
            }
            return diff;
        })
        .map(({ name: ianaName, offset }) => {
            const name = getTimeZoneDisplayName(ianaName);

            return {
                text: formatter({ name, utcOffset: `GMT${formatTimezoneOffset(offset)}` }),
                formattedText: formattedFormatter({ name, utcOffset: `GMT${formatTimezoneOffset(offset)}` }),
                value: ianaName,
                key: ianaName,
            };
        });
};

/**
 * Given two time zone ids, determine if they are equivalent.
 * */
export const getIsEquivalentTimeZone = (tzid1: string, tzid2: string) => {
    const equivalentTimeZone1 = MANUAL_TIMEZONE_EQUIVALENCE[tzid1] || tzid1;
    const equivalentTimeZone2 = MANUAL_TIMEZONE_EQUIVALENCE[tzid2] || tzid2;

    return equivalentTimeZone1 === equivalentTimeZone2;
};

/**
 * Given a timezone id, try to convert it into an iana timezone supported by the API (cf. description of unsupportedTimezoneLinks function)
 * No longer supported timezones are converted into supported ones
 * Alias timezones are converted into canonical-and-supported ones
 * We try to convert other possible strange timezones, like those produced by Outlook calendar
 * If no conversion is possible, return undefined
 */
export const getSupportedTimezone = (tzid: string): string | undefined => {
    try {
        const timezone = findTimeZone(tzid).name;
        return unsupportedTimezoneLinks[timezone] || timezone;
    } catch (e: any) {
        // clean tzid of offsets
        const offsetRegex = /^\((?:UTC|GMT).*\) (.*)$|^(.*) \((?:UTC|GMT).*\)/i;
        const match = offsetRegex.exec(tzid);
        const strippedTzid = match ? match[1] || match[2] : tzid;
        const normalizedTzid = strippedTzid.toLowerCase().replace(/\./g, '');
        // try manual conversions
        const timezone = MANUAL_TIMEZONE_LINKS[normalizedTzid];
        if (timezone) {
            return timezone;
        }
        // It might be a globally unique timezone identifier, whose specification is not addressed by the RFC.
        // We try to match it with one of our supported list by brute force. We should fall here rarely
        const lowerCaseStrippedTzid = strippedTzid.toLowerCase();
        const supportedTimezone = ALLOWED_TIMEZONES_LIST.find((supportedTzid) =>
            lowerCaseStrippedTzid.includes(supportedTzid.toLowerCase())
        );
        if (supportedTimezone) {
            return supportedTimezone;
        }
        // Try alias timezones
        const aliasMap = getTimeZoneLinks();
        // some alias names have overlap (e.g. GB-Eire and Eire). To find the longest match, we sort them by decreasing length
        const sortedAlias = Object.keys(aliasMap).sort((a: string, b: string) => b.length - a.length);
        for (const alias of sortedAlias) {
            if (lowerCaseStrippedTzid.includes(alias.toLowerCase())) {
                return aliasMap[alias];
            }
        }
    }
};

const findUTCTransitionIndex = ({ unixTime, untils }: { unixTime: number; untils: number[] }) => {
    const max = untils.length - 1;
    for (let i = 0; i < max; i++) {
        if (unixTime < untils[i]) {
            return i;
        }
    }
    return max;
};

/**
 * @param moveAmbiguousForward  move an ambiguous date like Sunday 27 October 2019 2:00 AM CET, which corresponds to two times because of DST  change, to the latest of the two
 * @param moveInvalidForward    move an invalid date like Sunday 31 March 2019 2:00 AM CET, which does not correspond to any time because of DST change, to Sunday 31 March 2019 3:00 AM CET
 */
const findZoneTransitionIndex = ({
    unixTime,
    untils,
    offsets,
    moveAmbiguousForward = true,
    moveInvalidForward = true,
}: {
    unixTime: number;
    untils: number[];
    offsets: number[];
    moveAmbiguousForward?: boolean;
    moveInvalidForward?: boolean;
}) => {
    const max = untils.length - 1;

    for (let i = 0; i < max; i++) {
        const offsetNext = offsets[i + 1];
        const offsetPrev = offsets[i ? i - 1 : i];

        let offset = offsets[i];
        if (offset < offsetNext && moveAmbiguousForward) {
            offset = offsetNext;
        } else if (offset > offsetPrev && moveInvalidForward) {
            offset = offsetPrev;
        }

        if (unixTime < untils[i] - offset * 60000) {
            return i;
        }
    }

    return max;
};

interface ConvertZonedDateTimeOptions {
    moveAmbiguousForward?: boolean;
    moveInvalidForward?: boolean;
}

export const convertZonedDateTimeToUTC = (dateTime: DateTime, tzid: string, options?: ConvertZonedDateTimeOptions) => {
    const timezone = findTimeZone(tzid);
    const unixTime = Date.UTC(
        dateTime.year,
        dateTime.month - 1,
        dateTime.day,
        dateTime.hours,
        dateTime.minutes,
        dateTime.seconds || 0
    );
    const idx = findZoneTransitionIndex({
        ...options,
        unixTime,
        untils: timezone.untils,
        offsets: timezone.offsets,
    });
    const offset = timezone.offsets[idx];
    const date = new Date(unixTime + offset * 60000);
    return fromUTCDate(date);
};

export const convertUTCDateTimeToZone = (dateTime: DateTime, tzid: string) => {
    const timezone = findTimeZone(tzid);
    const unixTime = Date.UTC(
        dateTime.year,
        dateTime.month - 1,
        dateTime.day,
        dateTime.hours,
        dateTime.minutes,
        dateTime.seconds || 0
    );
    const idx = findUTCTransitionIndex({ unixTime, untils: timezone.untils });
    const offset = timezone.offsets[idx];
    const date = new Date(unixTime - offset * 60000);
    return fromUTCDate(date);
};

export const fromUTCDateToTimezone = (date: Date, tzid: string) => {
    return toUTCDate(convertUTCDateTimeToZone(fromUTCDate(date), tzid));
};

export const fromUTCDateToLocalFakeUTCDate = (utcDate: Date, isAllDay: boolean, tzid = 'UTC') => {
    return isAllDay ? utcDate : fromUTCDateToTimezone(utcDate, tzid);
};

export const convertTimestampToTimezone = (timestamp: number, timezone: string) => {
    return convertUTCDateTimeToZone(fromUTCDate(new Date(timestamp * SECOND)), timezone);
};

/**
 * Remove potential underscores from time zone city
 * E.g. "Los_Angeles" should become "Los Angeles"
 */
export const getReadableCityTimezone = (timezone: string = '') => {
    return timezone.replaceAll('_', ' ');
};

export type AbbreviatedTimezone = 'offset' | 'city';

/**
 * Get an abbreviated time zone, from AbbreviatedTimezone type:
 * - "offset": "Europe/Paris" should return "GMT+1" (winter time) or 'GMT+2' (summer time)
 * - "city": "Europe/Paris" should return "Paris"
 */
export const getAbbreviatedTimezoneName = (
    abbreviatedTimezone: AbbreviatedTimezone,
    timezone: string | undefined,
    date?: Date
) => {
    if (timezone) {
        if (abbreviatedTimezone === 'offset') {
            const timezoneOffset = getTimezoneOffset(date || new Date(), timezone).offset;
            const abbreviatedTimezoneName = formatGMTOffsetAbbreviation(timezoneOffset);
            return abbreviatedTimezoneName;
        }

        if (abbreviatedTimezone === 'city') {
            // Return the city if found e.g "Europe/Paris" should return "Paris"
            const match = getTimeZoneDisplayName(timezone).match(/(.+?)(?:\/|$)/g);

            // However, we can also get longer time zones. That's why we need to take the last matched element
            // e.g. "America/North_Dakota/New_Salem" should return "New Salem"
            return getReadableCityTimezone(match?.[match?.length - 1]) || timezone;
        }
    }
};

export const getTimezoneAndOffset = (timezone?: string, date?: Date) => {
    const timezoneOffset = getAbbreviatedTimezoneName('offset', timezone, date);
    const timezoneName = getTimeZoneDisplayName(timezone || '');

    return `${timezoneOffset} • ${timezoneName}`;
};
