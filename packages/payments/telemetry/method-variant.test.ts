import { telemetry } from '@proton/shared/lib/telemetry';

import { setOfferedApplePayFlow } from '../core/apple-pay-support';
import { CYCLE, PAYMENT_METHOD_TYPES, PLANS } from '../core/constants';
import type { PaymentMethodType, PlainPaymentMethodType } from '../core/interface';
import { reportPayment, reportSubscriptionEstimationChange } from './shared-checkout-telemetry';

jest.mock('@proton/shared/lib/telemetry', () => ({
    telemetry: { sendCustomEvent: jest.fn() },
}));

const sendCustomEvent = telemetry.sendCustomEvent as jest.Mock;

const commonPayload = {
    context: 'account-home',
    userCurrency: 'EUR',
    subscription: undefined,
    selectedCurrency: 'EUR',
    selectedPlanIDs: { [PLANS.MAIL]: 1 },
    selectedCycle: CYCLE.MONTHLY,
    selectedCoupon: null,
    build: 'proton-account',
    product: 'proton-mail',
    isTrial: false,
} as const;

const method = (
    paymentMethodType: PlainPaymentMethodType,
    paymentMethodValue: PaymentMethodType = paymentMethodType
) => ({ paymentMethodType, paymentMethodValue });

const lastPayload = () => {
    expect(sendCustomEvent).toHaveBeenCalledTimes(1);
    const [, payload] = sendCustomEvent.mock.calls[0];
    return payload as Record<string, unknown>;
};

beforeEach(() => sendCustomEvent.mockClear());
afterEach(() => setOfferedApplePayFlow(null));

describe('methodVariant', () => {
    it('splits Apple Pay by flow in the payment event while keeping the method abstract', () => {
        setOfferedApplePayFlow('qr');

        reportPayment({ ...commonPayload, stage: 'attempt', amount: 499, ...method(PAYMENT_METHOD_TYPES.APPLE_PAY) });

        expect(lastPayload()).toMatchObject({ method: 'apple_pay', methodVariant: 'apple_pay_qr' });
    });

    it('splits Apple Pay by flow in the estimation change event', () => {
        setOfferedApplePayFlow('native');

        reportSubscriptionEstimationChange({
            ...commonPayload,
            action: 'payment_method_changed',
            ...method(PAYMENT_METHOD_TYPES.APPLE_PAY),
        });

        expect(lastPayload()).toMatchObject({ method: 'apple_pay', methodVariant: 'apple_pay_native' });
    });

    it('sends a null variant for methods that have only one presentation', () => {
        setOfferedApplePayFlow('native');

        reportPayment({
            ...commonPayload,
            stage: 'payment_success',
            amount: 499,
            ...method(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD),
        });

        expect(lastPayload()).toMatchObject({ method: 'card', methodVariant: null });
    });
});
