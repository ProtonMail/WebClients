import { format, addMilliseconds } from 'date-fns';
import getTimezoneOffsetInMilliseconds from 'date-fns/_lib/getTimezoneOffsetInMilliseconds';

const formatUTC = (date, formatString, options) => {
    const timezoneOffset = getTimezoneOffsetInMilliseconds(date);
    const adjustedUtcDate = addMilliseconds(date, timezoneOffset);
    // The date-fn library is already working with UTC time inside the format functions,
    // However it assumes the date passed is a local date, so it subtracts the timezone offset.
    // Here we are adjusting it.
    return format(adjustedUtcDate, formatString, options);
};

export default formatUTC;
