angular.module('proton.payment')
    .factory('paymentModel', (Payment, paymentPlansFormator) => {

        const plans = (Currency, Cycle, filter) => {
            return Payment.plans({ Currency, Cycle }).then(paymentPlansFormator(Currency, Cycle, filter));
        };

        return { plans };
    });
