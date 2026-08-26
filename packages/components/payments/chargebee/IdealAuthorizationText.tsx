import { c } from 'ttag';

import { BRAND_NAME, IDEAL_WERO_BRAND_NAME } from '@proton/shared/lib/constants';

export const getIdealAuthorizationText = () =>
    c('Payments.iDEAL')
        .t`By confirming, you authorise ${BRAND_NAME} and Stripe, our payment service provider, our payment service provider, to collect future payments for your subscription from this bank account by SEPA Direct Debit, and your bank to debit those payments. Your first payment is made now by ${IDEAL_WERO_BRAND_NAME}. Your plan auto renews, until you cancel; we'll notify you before each collection. For direct debit collections you can request a refund from your bank within 8 weeks of the debit date, under the terms of your agreement with your bank. This does not apply to the ${IDEAL_WERO_BRAND_NAME} payment you're making now.`;

export const IdealAuthorizationText = () => {
    return <span className="text-sm color-weak">{getIdealAuthorizationText()}</span>;
};
