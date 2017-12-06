/* @ngInject */
function bitcoinDetails(paymentBitcoinModel, gettextCatalog, CONSTANTS) {
    const node = (type, value) => {
        const span = document.createElement('SPAN');
        const kbd = document.createElement('KBD');
        kbd.className = `bitcoinDetails-item-${type}`;
        span.className = `bitcoinDetails-label-${type}`;

        if (type === 'amount') {
            if (!value) {
                return {};
            }

            span.innerHTML = gettextCatalog.getString('Amount BTC', null, 'Bitcoin donation');
            kbd.textContent = value;
            return { span, kbd };
        }

        span.textContent = gettextCatalog.getString('BTC address', null, 'Bitcoin donation');
        kbd.textContent = value;
        return { span, kbd };
    };

    return {
        replace: true,
        template: '<p class="bitcoinDetails-container"></p>',
        link(scope, el) {
            const { Address = CONSTANTS.BTC_DONATION_ADDRESS, AmountBitcoin } = paymentBitcoinModel.get('payment') || {};

            // Null for donation because we don't need an amount
            const amount = node('amount', AmountBitcoin);
            if (amount.span) {
                el[0].appendChild(amount.span);
                el[0].appendChild(amount.kbd);
            }

            const address = node('address', Address);
            el[0].appendChild(address.span);
            el[0].appendChild(address.kbd);
        }
    };
}
export default bitcoinDetails;
