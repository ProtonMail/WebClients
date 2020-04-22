import { listTimeZones, findTimeZone, getZonedTime, getUTCOffset } from 'timezone-support';
import { DateTime } from '../interfaces/calendar/Date';

/** @type any */
export const toLocalDate = ({ year = 0, month = 1, day = 0, hours = 0, minutes = 0, seconds = 0 }) => {
    return new Date(year, month - 1, day, hours, minutes, seconds);
};

/** @type any */
export const toUTCDate = ({ year = 0, month = 1, day = 0, hours = 0, minutes = 0, seconds = 0 }) => {
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
};

export const fromLocalDate = (date: Date) => {
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds()
    };
};

export const fromUTCDate = (date: Date) => {
    return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hours: date.getUTCHours(),
        minutes: date.getUTCMinutes(),
        seconds: date.getUTCSeconds()
    };
};

/*
 * The list of timezones supported by FE is given by the function below listTimezones(),
 * which returns the timezones in the 2019c iana database. That database is backward-compatible
 * (the list of timezones keeps changing because humans keep making crazy irrational decisions).
 * The API does not like backward-compatibility though, and they only support some of those
 * timezones (loosely based on https://www.php.net/manual/en/timezones.php). The list of timezones
 * recognized by FE but not supported by BE are the ones that serve as entries for the object below.
 * The value for each entry is the supported timezone we will re-direct to
 */
const unsupportedTimezoneLinks: { [key: string]: string } = {
    'America/Fort_Wayne': 'America/New_York',
    'Asia/Rangoon': 'Asia/Yangon',
    CET: 'Europe/Paris',
    CST6CDT: 'America/Chicago',
    EET: 'Europe/Istanbul',
    EST: 'America/New_York',
    EST5EDT: 'America/New_York',
    'Etc/GMT+1': 'Atlantic/Cape_Verde',
    'Etc/GMT+10': 'Pacific/Tahiti',
    'Etc/GMT+11': 'Pacific/Niue',
    'Etc/GMT+12': 'Pacific/Niue', // no canonical timezone exists for GMT+12
    'Etc/GMT+2': 'America/Noronha',
    'Etc/GMT+3': 'America/Sao_Paulo',
    'Etc/GMT+4': 'America/Caracas',
    'Etc/GMT+5': 'America/Lima',
    'Etc/GMT+6': 'America/Managua',
    'Etc/GMT+7': 'America/Phoenix',
    'Etc/GMT+8': 'Pacific/Pitcairn',
    'Etc/GMT+9': 'Pacific/Gambier',
    'Etc/GMT-0': 'Europe/London',
    'Etc/GMT-1': 'Europe/Paris',
    'Etc/GMT-10': 'Australia/Brisbane',
    'Etc/GMT-11': 'Australia/Sydney',
    'Etc/GMT-12': 'Pacific/Auckland',
    'Etc/GMT-13': 'Pacific/Fakaofo',
    'Etc/GMT-14': 'Pacific/Kiritimati',
    'Etc/GMT-2': 'Africa/Cairo',
    'Etc/GMT-3': 'Asia/Baghdad',
    'Etc/GMT-4': 'Asia/Dubai',
    'Etc/GMT-5': 'Asia/Tashkent',
    'Etc/GMT-6': 'Asia/Dhaka',
    'Etc/GMT-7': 'Asia/Jakarta',
    'Etc/GMT-8': 'Asia/Shanghai',
    'Etc/GMT-9': 'Asia/Tokyo',
    'Etc/UTC': 'Europe/London',
    HST: 'Pacific/Honolulu',
    MET: 'Europe/Paris',
    MST: 'Europe/Paris',
    MST7MDT: 'America/Denver',
    PST8PDT: 'America/Los_Angeles',
    WET: 'Europe/Lisbon'
};

const guessTimezone = (timezones: string[]) => {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Ensure it exists.
        return findTimeZone(timezone).name;
    } catch (error) {
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
        return ianaTimezones[0];
    }
    // If the guessed timezone is not supported, return the linked timezone
    return unsupportedTimezoneLinks[timezone] || timezone;
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

/**
 * Get a list of all IANA time zones that we support
 * @return {Array<Object>}      [{ text: 'Africa/Nairobi: UTC +03:00', value: 'Africa/Nairobi'}, ...]
 */
export const getTimeZoneOptions = (date = new Date()) => {
    return (
        listTimeZones()
            // UTC is called Etc/UTC but the API accepts UTC
            .concat('UTC')
            .filter((name) => !unsupportedTimezoneLinks[name])
            .map((name) => {
                const { abbreviation, offset } = getUTCOffset(date, findTimeZone(name));

                return {
                    name,
                    offset,
                    abbreviation
                };
            })
            .sort(({ offset: offsetA, name: nameA }, { offset: offsetB, name: nameB }) => {
                const diff = offsetA - offsetB;
                if (diff === 0) {
                    return nameA.localeCompare(nameB);
                }
                return diff;
            })
            .map(({ name, offset }, i) => {
                return {
                    text: `${name} (GMT${formatTimezoneOffset(offset)})`,
                    value: name,
                    key: i
                };
            })
    );
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
    moveInvalidForward = true
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
        offsets: timezone.offsets
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
