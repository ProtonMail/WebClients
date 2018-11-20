import { BLACK_FRIDAY, CYBER_MONDAY } from '../../constants';

export const isBlackFriday = () => moment().isBetween(BLACK_FRIDAY.BETWEEN.START, BLACK_FRIDAY.BETWEEN.END);

export const isCyberMonday = () => moment().isBetween(CYBER_MONDAY.BETWEEN.START, CYBER_MONDAY.BETWEEN.END);

export const isDealEvent = () => isBlackFriday() || isCyberMonday();

export const getEventName = () => (isBlackFriday() ? 'Black Friday' : 'Cyber Monday');
