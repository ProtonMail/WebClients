import { listTimeZones, findTimeZone, getZonedTime, getUTCOffset } from 'timezone-support';

export const toLocalDate = ({ year = 0, month = 1, day = 0, hours = 0, minutes = 0, seconds = 0 }) => {
    return new Date(year, month - 1, day, hours, minutes, seconds);
};

export const toUTCDate = ({ year = 0, month = 1, day = 0, hours = 0, minutes = 0, seconds = 0 }) => {
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
};

export const fromLocalDate = (date) => {
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds()
    };
};

export const fromUTCDate = (date) => {
    return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hours: date.getUTCHours(),
        minutes: date.getUTCMinutes(),
        seconds: date.getUTCSeconds()
    };
};

const NOT_SUPPORTED_ZONES = [
    'America/Fort_Wayne',
    'Asia/Rangoon',
    'CET',
    'CST6CDT',
    'EET',
    'EST',
    'EST5EDT',
    'Etc/GMT+1',
    'Etc/GMT+10',
    'Etc/GMT+11',
    'Etc/GMT+12',
    'Etc/GMT+2',
    'Etc/GMT+3',
    'Etc/GMT+4',
    'Etc/GMT+5',
    'Etc/GMT+6',
    'Etc/GMT+7',
    'Etc/GMT+8',
    'Etc/GMT+9',
    'Etc/GMT-0',
    'Etc/GMT-1',
    'Etc/GMT-10',
    'Etc/GMT-11',
    'Etc/GMT-12',
    'Etc/GMT-13',
    'Etc/GMT-14',
    'Etc/GMT-2',
    'Etc/GMT-3',
    'Etc/GMT-4',
    'Etc/GMT-5',
    'Etc/GMT-6',
    'Etc/GMT-7',
    'Etc/GMT-8',
    'Etc/GMT-9',
    'Etc/UTC',
    'HST',
    'MET',
    'MST',
    'MST7MDT',
    'PST8PDT',
    'WET'
];

const guessTimezone = (timezones) => {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Ensure it exists.
        return timezones.find((tz) => tz === timezone);
    } catch (error) {
        const date = new Date();
        const timezoneOffset = date.getTimezoneOffset();
        return timezones.find((tz) => {
            const { zone = {} } = getZonedTime(date, findTimeZone(tz));
            return zone.offset === timezoneOffset;
        });
    }
};

/**
 * Get current timezone by using Intl
 * if not available use timezone-support lib and pick the first timezone from the current date timezone offset
 * @returns {String}
 */
export const getTimezone = () => {
    const timezones = listTimeZones();
    const timezone = guessTimezone(timezones);
    if (!timezone || NOT_SUPPORTED_ZONES.indexOf(timezone) !== -1) {
        return timezones[0];
    }
    return timezone;
};

/**
 * Get a list of all IANA time zones
 * @return {Array<Object>}      [{ text: 'Africa/Nairobi: UTC +03:00', value: 'Africa/Nairobi'}, ...]
 */
export const getTimeZoneOptions = (date = new Date()) => {
    return (
        listTimeZones()
            // UTC is called Etc/UTC but the API accepts UTC
            .concat('UTC')
            .filter((name) => NOT_SUPPORTED_ZONES.indexOf(name) === -1)
            .map((name) => {
                const { offset } = getUTCOffset(date, findTimeZone(name));

                return {
                    name,
                    offset
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
                // offset comes with the opposite sign in the timezone-support library
                const sign = Math.sign(offset) === 1 ? '-' : '+';
                const minutes = Math.abs(offset % 60);
                const hours = (Math.abs(offset) - minutes) / 60;

                const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
                const hh = hours < 10 ? `0${hours}` : `${hours}`;

                return {
                    text: `(GMT ${sign}${hh}:${mm}) ${name}`,
                    value: name,
                    key: i
                };
            })
    );
};

const findUTCTransitionIndex = ({ unixTime, untils }) => {
    const max = untils.length - 1;
    for (let i = 0; i < max; i++) {
        if (unixTime < untils[i]) {
            return i;
        }
    }
    return max;
};

const findZoneTransitionIndex = ({
    unixTime,
    untils,
    offsets,
    moveAmbiguousForward = false,
    moveInvalidForward = false
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

export const convertZonedDateTimeToUTC = (dateTime, tzid, options) => {
    const timezone = findTimeZone(tzid);
    const unixTime = Date.UTC(dateTime.year, dateTime.month - 1, dateTime.day, dateTime.hours, dateTime.minutes, 0);
    const idx = findZoneTransitionIndex({
        unixTime,
        untils: timezone.untils,
        offsets: timezone.offsets,
        ...options
    });
    const offset = timezone.offsets[idx];
    const date = new Date(unixTime + offset * 60000);
    return fromUTCDate(date);
};

export const convertUTCDateTimeToZone = (dateTime, tzid) => {
    const timezone = findTimeZone(tzid);
    const unixTime = Date.UTC(dateTime.year, dateTime.month - 1, dateTime.day, dateTime.hours, dateTime.minutes, 0);
    const idx = findUTCTransitionIndex({
        unixTime,
        untils: timezone.untils
    });
    const offset = timezone.offsets[idx];
    const date = new Date(unixTime - offset * 60000);
    return fromUTCDate(date);
};
