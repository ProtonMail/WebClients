import type { LumoCreditResponse } from '../core/api/lumoCredit';

export const MOCK_LUMO_CREDIT_RESPONSE: LumoCreditResponse = {
    Code: 1000,
    Balance: '15.0000000000',
    Usage: '12.5000000000',
    UsageLimit: '250.0000000000',
    AutoTopUp: {
        Enabled: false,
        Threshold: 20,
        Quantity: null,
    },
};
