/* @ngInject */
function currencyFilter() {
    const MAP = {
        USD: '$',
        EUR: '€',
        CHF: 'CHF'
    };

    return (amount = 0, currency = '') => {
        const symbol = MAP[currency] || currency;
        const value = Number(amount).toFixed(2);

        const prefix = value < 0 ? '-' : '';
        const absValue = Math.abs(value);

        if (currency === 'USD') {
            // Negative amount, - is before the devise
            return `${prefix}${symbol}${absValue}`;
        }

        return `${prefix}${absValue} ${symbol}`;
    };
}
export default currencyFilter;
