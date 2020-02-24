import {
    getDateProperty,
    getDateTimeProperty,
    getPropertyTzid,
    isIcalPropertyAllDay
} from 'proton-shared/lib/calendar/vcalConverter';
import { fromUTCDate, toUTCDate } from 'proton-shared/lib/date/timezone';
import { uniqueBy } from 'proton-shared/lib/helpers/array';

const toExdate = (dateObject, isAllDay, tzid) => {
    if (isAllDay) {
        return getDateProperty(dateObject);
    }
    return getDateTimeProperty(dateObject, tzid);
};

const deleteSingleRecurrence = (component, localStartToExclude) => {
    const { dtstart, exdate: oldExdate = [] } = component;

    const singleExdate = toExdate(
        fromUTCDate(localStartToExclude),
        isIcalPropertyAllDay(dtstart),
        getPropertyTzid(dtstart)
    );

    const newExdates = uniqueBy([...oldExdate, singleExdate], (property) => {
        return +toUTCDate(property.value);
    }).sort((a, b) => {
        return toUTCDate(a.value) - toUTCDate(b.value);
    });

    return {
        ...component,
        exdate: newExdates
    };
};

export default deleteSingleRecurrence;
