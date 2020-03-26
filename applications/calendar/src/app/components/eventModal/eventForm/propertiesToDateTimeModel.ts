import { toUTCDate } from 'proton-shared/lib/date/timezone';
import { addDays } from 'proton-shared/lib/date-fns-utc';
import { getDateTimeState } from './time';
import { VcalDateOrDateTimeProperty } from '../../../interfaces/VcalModel';

const getTzid = ({ value, parameters }: VcalDateOrDateTimeProperty) => {
    if (parameters.type === 'date') {
        return;
    }
    return value.isUTC ? 'UTC' : parameters.tzid;
};

const propertiesToDateTimeModel = (
    dtstart: VcalDateOrDateTimeProperty,
    dtend: VcalDateOrDateTimeProperty,
    isAllDay: boolean,
    tzid: string
) => {
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
