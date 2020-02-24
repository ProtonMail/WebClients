import { toUTCDate } from '../date/timezone';

export const createExdateMap = (exdate = []) => {
    return exdate.reduce((acc, dateProperty) => {
        const localExclude = toUTCDate(dateProperty.value);
        acc[+localExclude] = true;
        return acc;
    }, {});
};
