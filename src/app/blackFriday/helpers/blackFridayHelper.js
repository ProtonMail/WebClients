import { BLACK_FRIDAY } from '../../constants';

export const isBlackFriday = () =>
    moment().isBetween(BLACK_FRIDAY.BETWEEN.START, moment(BLACK_FRIDAY.BETWEEN.END).utc());

export const isCyberMonday = () => false;

export const isDealEvent = () => isBlackFriday() || isCyberMonday();

export const getEventName = () => 'Black Friday';
