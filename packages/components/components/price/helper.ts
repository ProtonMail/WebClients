import humanPrice from '@proton/shared/lib/helpers/humanPrice';
import { Currency } from '@proton/shared/lib/interfaces';

export const getSimplePriceString = (currency: Currency, rawPrice: number, suffix: string) => {
    const price = humanPrice(rawPrice, 100);
    if (currency === 'EUR') {
        return `${price} €${suffix}`;
    }
    if (currency === 'CHF') {
        return `CHF ${price}${suffix}`;
    }
    if (currency === 'USD') {
        return `$${price}${suffix}`;
    }
    return `${currency} ${price}${suffix}`;
};
