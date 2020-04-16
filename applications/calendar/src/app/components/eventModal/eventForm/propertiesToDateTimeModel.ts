import { toUTCDate } from 'proton-shared/lib/date/timezone';
import { addDays } from 'proton-shared/lib/date-fns-utc';
import { getDateTimeState } from './time';
import { VcalDateOrDateTimeProperty, VcalDateTimeProperty } from '../../../interfaces/VcalModel';

const getTzidFromDateTime = (property: VcalDateTimeProperty) => {
    return property.value.isUTC ? 'UTC' : property.parameters?.tzid;
};

const getTzid = (property: VcalDateOrDateTimeProperty) => {
    if (property.parameters?.type === 'date') {
        return;
    }
    return getTzidFromDateTime(property as VcalDateTimeProperty);
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
