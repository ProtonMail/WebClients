import { type PaymentsVersion } from '@proton/shared/lib/api/payments';
import { type Api } from '@proton/shared/lib/interfaces';

import { DEFAULT_TAX_BILLING_ADDRESS } from './billing-address';
import { type PaymentMethodStatusExtended } from './interface';

export const queryPaymentMethodStatus = (version: PaymentsVersion) => ({
    url: `payments/${version}/status`,
    method: 'get',
});

export async function getPaymentMethodStatus(api: Api) {
    const status = await api<PaymentMethodStatusExtended>(queryPaymentMethodStatus('v5'));
    if (!status.CountryCode) {
        status.CountryCode = DEFAULT_TAX_BILLING_ADDRESS.CountryCode;
    }

    const keys = Object.keys(status.VendorStates) as (keyof PaymentMethodStatusExtended['VendorStates'])[];
    // Normalizing the boolean values, converting them from 0 or 1 to false or true
    for (const key of keys) {
        status.VendorStates[key] = !!status.VendorStates[key];
    }
    // The backend doesn't return the Cash key. We still use it in the frontend,
    // so we synthetize it here.
    if (!Object.hasOwn(status.VendorStates, 'Cash')) {
        status.VendorStates.Cash = true;
    }
    return status;
}
