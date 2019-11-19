import { isWithinInterval } from 'date-fns';

import { BLACK_FRIDAY } from '../constants';

export const isBlackFridayPeriod = () => {
    return isWithinInterval(new Date(), { start: new Date(BLACK_FRIDAY.START), end: new Date(BLACK_FRIDAY.END) });
};
