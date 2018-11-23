import _ from 'lodash';

import { BLACK_FRIDAY, CYCLE } from '../../constants';
import { isIE11 } from '../../../helpers/browser';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

/* @ngInject */
function paymentUtils(gettextCatalog, paymentModel, $state) {
    const I18N = {
        cash: gettextCatalog.getString('Cash', null, 'Payment method'),
        card: gettextCatalog.getString('Credit Card', null, 'Payment method')
    };
    const cardNumber = ({ Last4 = '' } = {}) => `•••• •••• •••• ${Last4}`;
    const formatMethods = (methods = []) => {
        return methods.map(({ ID = '', Details = {} }) => ({
            ID,
            label: cardNumber(Details),
            value: 'use.card'
        }));
    };

    /**
     * Get the list of payment methods for the user
     * Return the selected method:
     *     - card (first one) if no payment methods for the user
     *     - 1st payment method if the user has custom payment methods
     * @param  {Array} config.methods custom list default -> API methods
     * @param  {String} config.choice custom selected choice
     * @return {Object}         { selected, list }
     */
    const generateMethods = ({
        methods = paymentModel.get('methods'),
        choice,
        Cycle = YEARLY,
        Amount,
        CouponCode,
        modal = ''
    } = {}) => {
        const list = [
            {
                value: 'card',
                label: I18N.card
            }
        ];

        // Min amount to activate it if monthly is 50
        const isMonthlyValid = Amount > 5000 && Cycle === MONTHLY;
        const isYearly = Cycle === YEARLY;
        const isTwoYear = Cycle === TWO_YEARS;
        const isInvoiceModal = modal === 'invoice';
        // Paypal doesn't work with IE11. For the payment modal we cannot pay monthly via paypal
        if (!isIE11() && (isYearly || isTwoYear || isMonthlyValid || isInvoiceModal)) {
            list.push({
                label: 'PayPal',
                value: 'paypal'
            });
        }

        if (!$state.is('signup') && CouponCode !== BLACK_FRIDAY.COUPON_CODE) {
            list.push({
                value: 'bitcoin',
                label: 'Bitcoin'
            });

            list.push({
                value: 'cash',
                label: I18N.cash
            });
        }

        let selected = list[0];

        if ((methods || []).length) {
            const size = list.length;
            list.push(...formatMethods(methods));
            selected = list[size];
        }

        const exist = _.find(list, { value: choice });
        if (exist) {
            selected = exist;
        }

        return { list, selected };
    };

    return { generateMethods };
}
export default paymentUtils;
