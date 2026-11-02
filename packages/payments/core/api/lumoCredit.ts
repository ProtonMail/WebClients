export type LumoCreditAutoTopUpStatus = 'Failed' | 'Paused';

export interface LumoCreditResponse {
    Code: number;
    Balance: string;
    Usage: string;
    UsageLimit: string;
    AutoTopUp: {
        Enabled: boolean;
        Threshold: number;
        Quantity: number | null;
        Status?: LumoCreditAutoTopUpStatus;
        Reason?: string;
    };
}

export const getLumoCreditConfig = () => ({
    url: 'payments/v5/products/lumo-credit',
    method: 'get',
});

export const updateLumoCreditAutoTopUpConfig = (data: { Enabled: boolean; Quantity?: number }) => ({
    url: 'payments/v5/products/lumo-credit/auto-top-up',
    method: 'put',
    data,
    silence: true,
});

export const updateLumoCreditSpendingLimitConfig = (data: { Enabled: boolean; Limit: number }) => ({
    url: 'payments/v5/products/lumo-credit/spending-limit',
    method: 'put',
    data,
    silence: true,
});
