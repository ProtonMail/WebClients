import type { PAYMENT_METHOD_TYPES } from '../constants';
import { getPaymentMethodConfig } from './registry';

/**
 * Some payment methods can be saved by the system to be used later in the subsequent payments.
 * Bitcoin, for example, can't be saved, because user has to initiate transaction every time.
 */
export function isSavablePaymentMethod(type: PAYMENT_METHOD_TYPES): boolean {
    return getPaymentMethodConfig(type)?.savable ?? false;
}
