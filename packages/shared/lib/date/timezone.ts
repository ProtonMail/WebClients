import isTruthy from '@proton/utils/isTruthy';
import {
    findTimeZone,
    getTimeZoneLinks,
    getUTCOffset,
    getZonedTime,
    listTimeZones,
} from '@protontech/timezone-support';
import { Api } from '@proton/shared/lib/interfaces';
import { getAllowedTimeZones } from '@proton/shared/lib/api/calendars';
import { DateTime } from '../interfaces/calendar/Date';
import {
    FALLBACK_ALLOWED_SUPPORTED_TIMEZONES_LIST,
    MANUAL_TIMEZONE_LINKS,
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

/**
 * Load from API list of time zones that the BE allows
 * */
export const loadAllowedTimeZones = async (api: Api) => {
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
            console.error(`${tzid} not supported`);
        }
    }).filter(isTruthy);

    ALLOWED_TIMEZONES_LIST = supportedTimeZones;
};

/**
 * Transform a time zone supported by our library into one allowed by the BE
 */
export const toAllowedTimeZone = (tzid: string) => {
    const allowedTimeZone =
        unsupportedTimezoneLinks[tzid] || FALLBACK_ALLOWED_SUPPORTED_TIMEZONES_LIST.find((tz) => tz === tzid);

    if (!allowedTimeZone) {
        // this should never happen (we have a test for it), throwing here for TS safety
        throw new Error('Unrecognized time zone');
    }

    return allowedTimeZone;
};

const guessTimezone = (timezones: string[]) => {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Ensure it exists.
        return findTimeZone(timezone).name;
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
    const ianaTimezones = listTimeZones();
    const timezone = guessTimezone(ianaTimezones);
    // Special case for UTC since the API calls it UTC and not Etc/UTC
    if (timezone === 'Etc/UTC') {
        return 'UTC';
    }
    // If the guessed timezone is undefined, there's not much we can do
    if (!timezone) {
        return ALLOWED_TIMEZONES_LIST[0];
    }

    // The guessed time zone is supported by our library, transform it into one supported by the BE
    return toAllowedTimeZone(timezone);
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
    value: string;
    key: string;
}[];

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
        .map(({ name, offset }) => {
            return {
                text: formatter({ name, utcOffset: `GMT${formatTimezoneOffset(offset)}` }),
                value: name,
                key: name,
            };
        });
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

export const fromUTCDateToLocalFakeUTCDate = (utcDate: Date, isAllDay: boolean, tzid = 'UTC') => {
    return isAllDay ? utcDate : toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcDate), tzid));
};
