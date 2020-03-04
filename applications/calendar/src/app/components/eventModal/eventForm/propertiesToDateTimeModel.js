import { toUTCDate } from 'proton-shared/lib/date/timezone';
import { addDays } from 'proton-shared/lib/date-fns-utc';
import { getDateTimeState } from './time';

const getTzid = ({ value, parameters: { type, tzid } = {} }) => {
    if (type === 'date') {
        return;
    }
    return value.isUTC ? 'UTC' : tzid;
};

const propertiesToDateTimeModel = (dtstart, dtend, isAllDay, tzid) => {
    const localStart = toUTCDate(dtstart.value);
    const localEnd = toUTCDate(dtend.value);

    if (isAllDay) {
        // All day events date ranges are stored non-inclusively, so remove a full day from the end date
        const modifiedEnd = addDays(localEnd, -1);

        return {
            start: getDateTimeState(localStart, tzid),
            end: getDateTimeState(modifiedEnd, tzid)
        };
    }

    const tzStart = getTzid(dtstart) || tzid;
    const tzEnd = getTzid(dtend) || tzid;

    return {
        start: getDateTimeState(localStart, tzStart),
        end: getDateTimeState(localEnd, tzEnd)
    };
};

export default propertiesToDateTimeModel;
