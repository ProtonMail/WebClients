import { toUTCDate } from '../date/timezone';
import { DateTimeValue } from '../interfaces/calendar';
import { VcalDateOrDateTimeProperty } from '../interfaces/calendar/VcalModel';
import { getDateProperty, getDateTimeProperty } from './vcalConverter';

export const createExdateMap = (exdate: VcalDateOrDateTimeProperty[] = []) => {
    return exdate.reduce<{ [key: number]: boolean }>((acc, dateProperty: any) => {
        const localExclude = toUTCDate(dateProperty.value);
        acc[+localExclude] = true;
        return acc;
    }, {});
};

export const toExdate = (dateObject: DateTimeValue, isAllDay: boolean, tzid = 'UTC'): VcalDateOrDateTimeProperty => {
    if (isAllDay) {
        return getDateProperty(dateObject);
    }
    return getDateTimeProperty(dateObject, tzid);
};
