import { c } from 'ttag';

import { IcBrandApple } from '@proton/icons/icons/IcBrandApple';
import type { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';

import { maskedLast4 } from '../maskedLast4';
import type { PaymentMethodUi } from '../paymentMethodUi';

export const applePayPaymentMethodUi: PaymentMethodUi<PAYMENT_METHOD_TYPES.APPLE_PAY> = {
    newMethodView: () => ({ icon: IcBrandApple, text: c('Payment method option').t`Apple Pay` }),
    savedMethodIcon: () => IcBrandApple,
    savedMethodLabel: ({ Last4 }) =>
        // translator: example "Apple Pay - card ending in 1234". Please do not translate brand "Apple Pay".
        c('Payments.Saved payment method details').t`Apple Pay - card ending in ${Last4}`,
    renderSavedMethodTableCell: ({ Last4 }) => (
        <span data-testid="apple-pay-details">{`Apple Pay (${maskedLast4(Last4)})`}</span>
    ),
};
