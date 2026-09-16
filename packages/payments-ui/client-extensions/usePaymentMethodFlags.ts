import type { PaymentMethodFlags } from '@proton/payments/core/payment-methods/paymentMethodAvailability';
import { useFlag } from '@proton/unleash/useFlag';

/**
 * Resolves every feature flag the payment method availability rules depend on.
 *
 * The one place that reads them: the result travels to the rules as a single object, so adding a
 * flag does not mean threading a new boolean through both payment facades and useMethods.
 */
export const usePaymentMethodFlags = (): PaymentMethodFlags => ({
    enableSepa: useFlag('SepaPayments'),
    enableSepaB2C: useFlag('SepaPaymentsB2C'),
    enablePaypalRegionalCurrenciesBatch3: useFlag('PaypalRegionalCurrenciesBatch3'),
    enablePaypalKrw: useFlag('PaypalKrw'),
    enableIdeal: useFlag('EnableIdeal'),
});
