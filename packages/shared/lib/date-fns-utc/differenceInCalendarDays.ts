import { DAY } from '@proton/shared/lib/constants';

import startOfDay from './startOfDay';

const differenceInCalendarDays = (left: Date, right: Date) => {
    const startOfDayLeft = startOfDay(left);
    const startOfDayRight = startOfDay(right);

    const diff = startOfDayLeft.getTime() - startOfDayRight.getTime();

    return Math.round(diff / DAY);
};

export default differenceInCalendarDays;
