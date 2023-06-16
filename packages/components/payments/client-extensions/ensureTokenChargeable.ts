import { c } from 'ttag';

import {
    EnsureTokenChargeableInputs,
    EnsureTokenChargeableTranslations,
    ensureTokenChargeable as innerEnsureTokenChargeable,
} from '../core';

export const defaultTranslations: EnsureTokenChargeableTranslations = {
    processAbortedError: c('Error').t`Process aborted`,
    paymentProcessCanceledError: c('Error').t`Payment process canceled`,
    paymentProcessFailedError: c('Error').t`Payment process failed`,
    paymentProcessConsumedError: c('Error').t`Payment process consumed`,
    paymentProcessNotSupportedError: c('Error').t`Payment process not supported`,
    unknownPaymentTokenStatusError: c('Error').t`Unknown payment token status`,
    tabClosedError: c('Error').t`Tab closed`,
};

export const getEnsureTokenChargeable =
    (translations: EnsureTokenChargeableTranslations = defaultTranslations) =>
    (inputs: EnsureTokenChargeableInputs, delay?: number) =>
        innerEnsureTokenChargeable(inputs, translations, delay);

export const ensureTokenChargeable = getEnsureTokenChargeable();
