import { useMemo } from 'react';

import { MONTHLY_TYPE } from '@proton/shared/lib/calendar/constants';
import { getOnDayString } from '@proton/shared/lib/calendar/recurrence/getFrequencyString';
import { getNegativeSetpos, getPositiveSetpos } from '@proton/shared/lib/calendar/recurrence/rrule';

// Filter out strings since TS creates an inverse mapping
const MONTHLY_TYPE_VALUES = Object.values(MONTHLY_TYPE).filter((type): type is number => typeof type === 'number');

const useMonthlyOptions = (date: Date) => {
    const options = useMemo(() => {
        const allOptions = MONTHLY_TYPE_VALUES.map((type) => {
            const onDayString = getOnDayString(date, type);
            return { text: onDayString || '', value: type };
        });

        const isLastDay = getNegativeSetpos(date) === -1;
        const isFifthDay = getPositiveSetpos(date) === 5;

        return allOptions.filter(({ value }) => {
            if (value === MONTHLY_TYPE.ON_NTH_DAY && isFifthDay) {
                // we don't offer "on the fifth <weekday>" possibility, i.e "on the fifth Monday"
                return false;
            }
            if (value === MONTHLY_TYPE.ON_MINUS_NTH_DAY && !isLastDay) {
                // only display "last day" option when we are in the last day of the month
                return false;
            }
            return true;
        });
    }, [date]);
    return options;
};

export default useMonthlyOptions;
