import { propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { c } from 'ttag';

export const validateDateTimeProperties = (dstart, dtend) => {
    const startDate = propertyToUTCDate(dstart);
    const endDate = propertyToUTCDate(dtend);

    if (startDate.getTime() > endDate.getTime()) {
        return c('Error').t`Start time must be before end time`;
    }
};
