import { isWithinInterval } from 'date-fns';

import { BLACK_FRIDAY } from '../constants';

export const isBlackFridayPeriod = () => {
    return isWithinInterval(new Date(), { start: BLACK_FRIDAY.START, end: BLACK_FRIDAY.END });
};
