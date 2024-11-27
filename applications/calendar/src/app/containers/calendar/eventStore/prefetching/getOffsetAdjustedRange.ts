import { subMinutes } from 'date-fns';

import type { DateTuple } from '@proton/components/components/miniCalendar/interface';

export const getOffsetAdjustedRange = (date0: Date, date1: Date): DateTuple => {
    const offset0 = date0.getTimezoneOffset();
    const offset1 = date1.getTimezoneOffset();

    return [subMinutes(date0, offset0), subMinutes(date1, offset1)];
};
