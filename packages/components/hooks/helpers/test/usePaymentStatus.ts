import { type PaymentMethodStatusExtended, queryPaymentMethodStatus } from '@proton/components/payments/core';
import { addApiMock } from '@proton/testing/index';

export const statusDefaultResponse: PaymentMethodStatusExtended = {
    CountryCode: 'CH',
    State: null,
    VendorStates: {
        Card: true,
        Paypal: true,
        Apple: true,
        Cash: true,
        Bitcoin: true,
    },
};

export function mockStatusApi(status = statusDefaultResponse) {
    addApiMock(queryPaymentMethodStatus('v5').url, () => status);
}
