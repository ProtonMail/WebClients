import { BTC_DONATION_ADDRESS } from '../../constants';

/* @ngInject */
function bitcoinQrcode(paymentBitcoinModel) {
    const getURL = () => {
        const { Address = BTC_DONATION_ADDRESS, AmountBitcoin } = paymentBitcoinModel.get('payment') || {};

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
}
export default bitcoinQrcode;
