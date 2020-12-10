import { BLACK_FRIDAY, PRODUCT_PAYER } from '../../constants';

export const isBlackFriday = () => moment().isBetween(BLACK_FRIDAY.BETWEEN.START, BLACK_FRIDAY.BETWEEN.CYBER_START);

export const isCyberMonday = () => moment().isBetween(BLACK_FRIDAY.BETWEEN.CYBER_START, BLACK_FRIDAY.BETWEEN.CYBER_END);

export const isBlackFridayExtension = () =>
    moment().isBetween(BLACK_FRIDAY.BETWEEN.CYBER_END, BLACK_FRIDAY.BETWEEN.END);

export const isDealEvent = () => moment().isBetween(BLACK_FRIDAY.BETWEEN.START, BLACK_FRIDAY.BETWEEN.END);

export const getEventName = (isProductPayer) => {
    if (isProductPayer) {
        return 'Special offer';
    }

    if (!isDealEvent()) {
        return '';
    }

    if (isBlackFriday() || isBlackFridayExtension()) {
        return 'Black Friday';
    }

    if (isCyberMonday()) {
        return 'Cyber Monday';
    }
};

export const isProductPayerPeriod = () => moment().isAfter(PRODUCT_PAYER.BETWEEN.START);
