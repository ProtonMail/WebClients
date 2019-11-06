import { fromUnixTime, isSameDay, format as formatDate } from 'date-fns';

/**
 * Convert UNIX timestamp into a readable time. The format of the readable time is:
 * ** Hours and minutes if the UNIX timestamp is from the same day,
 * ** Day, month and year otherwise
 * @param {Number} time     UNIX timestamp
 * @param {String} format   Format admitted by date-fns
 * @param {Object} options
 */
const readableTime = (time, format = 'PP', options) => {
    const date = fromUnixTime(time);

    if (isSameDay(date, Date.now())) {
        return formatDate(date, 'p', options);
    }

    return formatDate(date, format, options);
};

export default readableTime;
