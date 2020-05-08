import { toUTCDate } from '../date/timezone';
import { VcalDateOrDateTimeProperty } from '../interfaces/calendar/VcalModel';

export const createExdateMap = (exdate: VcalDateOrDateTimeProperty[] = []) => {
    return exdate.reduce<{ [key: number]: boolean }>((acc, dateProperty: any) => {
        const localExclude = toUTCDate(dateProperty.value);
        acc[+localExclude] = true;
        return acc;
    }, {});
};
