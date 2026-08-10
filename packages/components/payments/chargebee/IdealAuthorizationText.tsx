import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

export const getIdealAuthorizationText = () =>
    c('Payments.iDEAL')
        .t`By confirming this payment, you authorize ${BRAND_NAME} and Stripe, our payment service provider, to instruct your bank to debit your account accordingly. You can get a refund within 8 weeks from the debit date, under the conditions of your agreement with your bank.`;

export const IdealAuthorizationText = () => {
    return <span className="text-sm color-weak">{getIdealAuthorizationText()}</span>;
};
