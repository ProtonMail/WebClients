import type { LumoCreditResponse } from '../core/api/lumoCredit';

export const MOCK_LUMO_CREDIT_RESPONSE: LumoCreditResponse = {
    Code: 1000,
    Balance: '15.0000000000',
    AutoTopUp: {
        Enabled: false,
        Threshold: 20,
        Quantity: null,
        SpendingLimitEnabled: false,
        SpendingLimit: null,
        Spent: 0,
    },
};
