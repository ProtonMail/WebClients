import { c } from 'ttag';

import { IcBrandGoogle } from '@proton/icons/icons/IcBrandGoogle';
import type { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import googlePayMarkSvg from '@proton/styles/assets/img/bank-icons/google-pay-mark.svg';

import { maskedLast4 } from '../maskedLast4';
import type { PaymentMethodUi } from '../paymentMethodUi';

export const googlePayPaymentMethodUi: PaymentMethodUi<PAYMENT_METHOD_TYPES.GOOGLE_PAY> = {
    newMethodView: () => ({ text: c('Payment method option').t`Google Pay` }),
    renderOptionMark: () => (
        <span className="mr-2 w-custom" style={{ '--w-custom': '2.5rem' }}>
            <img
                src={googlePayMarkSvg}
                alt={c('Info').t`Google Pay mark`}
                style={{ maxHeight: '1.25rem', marginTop: '-0.15625rem' }}
            />
        </span>
    ),
    savedMethodIcon: () => IcBrandGoogle,
    savedMethodLabel: ({ Last4 }) =>
        // translator: example "Google Pay - card ending in 1234". Please do not translate brand "Google Pay".
        c('Payments.Saved payment method details').t`Google Pay - card ending in ${Last4}`,
    renderSavedMethodTableCell: ({ Last4 }) => (
        <span data-testid="google-pay-details">{`Google Pay (${maskedLast4(Last4)})`}</span>
    ),
};
