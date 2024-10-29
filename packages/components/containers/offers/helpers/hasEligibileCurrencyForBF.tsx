import type { Currency } from '@proton/payments';

const hasEligibileCurrencyForBF = (currency: Currency) => {
    return currency === 'CHF' || currency === 'EUR' || currency === 'USD';
};

export default hasEligibileCurrencyForBF;
