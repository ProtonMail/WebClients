import type { Currency } from '@proton/shared/lib/interfaces';

const hasEligibileCurrencyForBF = (currency: Currency) => {
    return currency === 'CHF' || currency === 'EUR' || currency === 'USD';
};

export default hasEligibileCurrencyForBF;
