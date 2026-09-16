import { c } from 'ttag';

export const getBilledUserWarning = () =>
    c('Payments')
        .t`During this time, you will not be able to modify or cancel your subscription. Please wait until your payment is completed before attempting any changes. Thank you for your patience.`;
