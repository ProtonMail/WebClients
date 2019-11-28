import { isWithinInterval, isAfter, isBefore } from 'date-fns';

import { BLACK_FRIDAY } from '../constants';

const { START, END } = BLACK_FRIDAY;

export const isBlackFridayPeriod = () => {
    return isWithinInterval(new Date(), { start: START, end: END });
};

export const isAfterBlackFriday = () => {
    return isAfter(new Date(), END);
};

export const isBeforeBlackFriday = () => {
    return isBefore(new Date(), START);
};
