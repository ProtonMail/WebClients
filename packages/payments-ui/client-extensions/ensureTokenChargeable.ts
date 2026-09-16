import { c } from 'ttag';

import type { EnsureTokenChargeableTranslations } from '@proton/payments/core/ensureTokenChargeable';

export const getDefaultTranslations = () =>
    ({
        processAbortedError: c('Error').t`Process aborted`,
        paymentProcessCanceledError: c('Error').t`Payment process canceled`,
        paymentProcessFailedError: c('Error').t`Payment process failed`,
        paymentProcessConsumedError: c('Error').t`Payment process consumed`,
        paymentProcessNotSupportedError: c('Error').t`Payment process not supported`,
        unknownPaymentTokenStatusError: c('Error').t`Unknown payment token status`,
        tabClosedError: c('Error').t`Tab closed`,
    }) satisfies EnsureTokenChargeableTranslations;
