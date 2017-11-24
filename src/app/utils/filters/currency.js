angular.module('proton.utils')
    .filter('currency', () => {

        const FORMATTERS = {};
        const MAP = {
            USD: '$',
            EUR: '€',
            CHF: 'CHF'
        };

        function fallbackFormat(amount = 0, currency = '') {

            const symbol = MAP[currency] || currency;
            const value = Number(amount).toFixed(2);

            if (currency === 'USD') {
                // Negative amount, - is before the devise
                const prefix = (value < 0) ? '-' : '';
                return `${prefix}${symbol}${Math.abs(value)}`.trim();
            }

            return `${value} ${symbol}`.trim();
        }

        const getFormatter = (currency) => (amount) => fallbackFormat(amount, currency);

        return (amount, currency) => {

            if (!currency) {
                return fallbackFormat(amount, currency);
            }

            !FORMATTERS[currency] && (FORMATTERS[currency] = getFormatter(currency));
            return FORMATTERS[currency](amount);
        };
    });
