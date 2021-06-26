import { toUTCDate } from 'proton-shared/lib/date/timezone';
import { addDays } from 'proton-shared/lib/date-fns-utc';
import { VcalDateOrDateTimeProperty } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { getPropertyTzid } from 'proton-shared/lib/calendar/vcalHelper';
import { getDateTimeState } from './time';

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
            end: getDateTimeState(modifiedEnd, tzid),
        };
    }

    const tzStart = getPropertyTzid(dtstart) || tzid;
    const tzEnd = getPropertyTzid(dtend) || tzid;

    return {
        start: getDateTimeState(localStart, tzStart),
        end: getDateTimeState(localEnd, tzEnd),
    };
};

export default propertiesToDateTimeModel;
