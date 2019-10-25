import isWithinRange from 'date-fns/is_within_range'

import { BLACK_FRIDAY } from '../constants';

export const isBlackFridayPeriod = () => {
    const now = new Date();
    return isWithinRange(now, BLACK_FRIDAY.START, BLACK_FRIDAY.END);
};