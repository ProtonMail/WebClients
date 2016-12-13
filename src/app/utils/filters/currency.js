angular.module('proton.utils')
    .filter('currency', () => {
        return function (amount, currency) {
            let result;

            switch (currency) {
                case 'EUR':
                    result = amount + ' €';
                    break;
                case 'CHF':
                    result = amount + ' CHF';
                    break;
                case 'USD':
                    if (amount < 0) {
                        result = '-$' + Math.abs(amount); // Transform negative number to positive
                    } else {
                        result = '$' + amount;
                    }
                    break;
                default:
                    break;
            }

            return result;
        };
    });
