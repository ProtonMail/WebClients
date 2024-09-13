import { c } from 'ttag';

import {
    type EnsureTokenChargeableInputs,
    type EnsureTokenChargeableTranslations,
    ensureTokenChargeable as innerEnsureTokenChargeable,
} from '@proton/payments';

export const defaultTranslations: EnsureTokenChargeableTranslations = {
    processAbortedError: c('Error').t`Process aborted`,
    paymentProcessCanceledError: c('Error').t`Payment process canceled`,
    paymentProcessFailedError: c('Error').t`Payment process failed`,
    paymentProcessConsumedError: c('Error').t`Payment process consumed`,
    paymentProcessNotSupportedError: c('Error').t`Payment process not supported`,
    unknownPaymentTokenStatusError: c('Error').t`Unknown payment token status`,
    tabClosedError: c('Error').t`Tab closed`,
};

/**
 * Partially preconfigured ensureTokenChargeable function.
 */
export const getEnsureTokenChargeable =
    (translations: EnsureTokenChargeableTranslations = defaultTranslations) =>
    (inputs: EnsureTokenChargeableInputs, delay?: number) =>
        innerEnsureTokenChargeable(inputs, translations, delay);

/**
 * Default implementation of the ensureTokenChargeable function.
 */
export const ensureTokenChargeable = getEnsureTokenChargeable();
