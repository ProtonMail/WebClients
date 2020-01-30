import { toUTCDate } from 'proton-shared/lib/date/timezone';
import { addDays, max } from 'proton-shared/lib/date-fns-utc';
import { getDateTimeState } from './time';

const getTzid = ({ value, parameters: { type, tzid } = {} }) => {
    if (type === 'date') {
        return;
    }
    return value.isUTC ? 'UTC' : tzid;
};

export default (dtstart, dtend, isAllDay, tzid) => {
    const tzStart = isAllDay ? undefined : getTzid(dtstart);
    const tzEnd = isAllDay ? undefined : getTzid(dtend);

    const start = toUTCDate(dtstart.value);
    const end = toUTCDate(dtend.value);
    // All day events date ranges are stored non-inclusively, so remove a full day from the end date
    const modifiedEnd = isAllDay ? addDays(end, -1) : end;
    const safeEnd = max(start, modifiedEnd);

    return {
        start: getDateTimeState(start, tzStart || tzid),
        end: getDateTimeState(safeEnd, tzEnd || tzid)
    };
};
