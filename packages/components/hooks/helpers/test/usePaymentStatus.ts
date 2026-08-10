import { DEFAULT_PAYMENT_VENDOR_STATES } from '@proton/payments/core/constants';
import type { PaymentStatus } from '@proton/payments/core/interface';
import { addApiMock } from '@proton/testing/lib/api';

export const statusDefaultResponse: PaymentStatus = {
    CountryCode: 'CH',
    State: null,
    VendorStates: DEFAULT_PAYMENT_VENDOR_STATES,
};

export function mockStatusApi(status = statusDefaultResponse) {
    addApiMock('payments/v5/status', () => status);
}
