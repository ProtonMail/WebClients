import { type PaymentStatus, queryPaymentMethodStatus } from '@proton/payments';
import { addApiMock } from '@proton/testing/index';

export const statusDefaultResponse: PaymentStatus = {
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
    addApiMock(queryPaymentMethodStatus().url, () => status);
}
