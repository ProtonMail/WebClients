/* @ngInject */
function currencyFilter() {
    const MAP = {
        USD: '$',
        EUR: '€',
        CHF: 'CHF'
    };

    const getValue = (value, forceValue) => {
        const val = Math.abs(value);
        if (!forceValue) {
            return val;
        }

        // ~~3.00 === 3 but ~~'7.50' !== 7.5
        if (~~value === val) {
            return val;
        }

        return value;
    };

    return (amount = 0, currency = '', isValue) => {
        const symbol = MAP[currency] || currency;
        const value = Number(amount).toFixed(2);

        const prefix = value < 0 ? '-' : '';
        const absValue = getValue(value, isValue);

        if (currency === 'USD') {
            // Negative amount, - is before the devise
            return `${prefix}${symbol}${absValue}`;
        }

        return `${prefix}${absValue} ${symbol}`;
    };
}
export default currencyFilter;
