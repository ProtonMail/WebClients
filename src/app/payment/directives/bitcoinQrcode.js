angular.module('proton.payment')
    .directive('bitcoinQrcode', (paymentBitcoinModel, CONSTANTS) => {

        const getURL = () => {
            const { Address = CONSTANTS.BTC_DONATION_ADDRESS, AmountBitcoin } = paymentBitcoinModel.get('payment') || {};

            if (paymentBitcoinModel.isDonation()) {
                return `bitcoin:${Address}`;
            }

            return `bitcoin:${Address}?amount=${AmountBitcoin}`;
        };

        return {
            replace: true,
            template: '<div class="bitcoinPayment-container"></div>',
            link(scope, el) {
                /* eslint no-new: "off" */
                new QRCode(el[0], getURL());
            }
        };
    });

