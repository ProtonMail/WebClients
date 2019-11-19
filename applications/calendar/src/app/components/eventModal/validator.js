import { propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';

export const validateDateTimeProperties = (dstart, dtend) => {
    const startDate = propertyToUTCDate(dstart);
    const endDate = propertyToUTCDate(dtend);
    return startDate.getTime() <= endDate.getTime();
};
