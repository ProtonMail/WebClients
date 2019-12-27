import { convertZonedDateTimeToUTC, toUTCDate } from '../date/timezone';

export const dateToProperty = ({ year, month = 1, day = 1 }) => {
    // All day date properties are always floating time
    return {
        value: { year, month, day },
        parameters: { type: 'date' }
    };
};

export const dateTimeToProperty = ({
    year,
    month = 1,
    day = 1,
    hours = 0,
    minutes = 0,
    seconds = 0,
    isUTC = false,
    tzid
}) => {
    const parameters = tzid ? { tzid } : undefined;
    return {
        value: { year, month, day, hours, minutes, seconds, isUTC },
        parameters: {
            type: 'date-time',
            ...parameters
        }
    };
};

export const getDateProperty = ({ year, month, day }) => {
    return dateToProperty({ year, month, day });
};

export const getDateTimeProperty = (zonelessTime, tzid) => {
    /**
     * If a specific timezone is wanted, the zoneless time is already relative
     * to the specific timezone so we can store it as-is.
     */
    const isUTC = !!(tzid || '').toLowerCase().includes('utc');
    return dateTimeToProperty({
        ...zonelessTime,
        isUTC,
        tzid: isUTC ? undefined : tzid
    });
};

export const isIcalPropertyAllDay = ({ parameters }) => {
    return parameters ? parameters.type === 'date' : false;
};

export const isIcalAllDay = ({ dtstart, dtend }) => {
    return !!((dtstart && isIcalPropertyAllDay(dtstart)) || (dtend && isIcalPropertyAllDay(dtend)));
};

/**
 * Returns a date object relative to UTC time.
 * @param {Object} value
 * @param {Object} parameters
 * @return {Date}
 */
export const propertyToUTCDate = ({ value, parameters = {} }) => {
    if (value.isUTC || parameters.type === 'date') {
        return toUTCDate(value);
    }
    // For dates with a timezone, convert the relative date time to UTC time
    return toUTCDate(convertZonedDateTimeToUTC(value, parameters.tzid));
};
