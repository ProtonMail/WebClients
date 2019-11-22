import { isWithinInterval, isAfter } from 'date-fns';

import { BLACK_FRIDAY } from '../constants';

export const isBlackFridayPeriod = () => {
    return isWithinInterval(new Date(), { start: new Date(BLACK_FRIDAY.START), end: new Date(BLACK_FRIDAY.END) });
};

export const isAfterBlackFriday = () => {
    return isAfter(new Date(), new Date(BLACK_FRIDAY.END));
};
