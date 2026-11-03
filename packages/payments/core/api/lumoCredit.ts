export type LumoCreditAutoTopUpStatus = 'Failed' | 'Paused';

export interface LumoCreditResponse {
    Code: number;
    Balance: string;
    AutoTopUp: {
        Enabled: boolean;
        Threshold: number;
        Quantity: number | null;
        SpendingLimitEnabled: boolean;
        SpendingLimit: number | null;
        Spent: number;
        Status?: LumoCreditAutoTopUpStatus;
        Reason?: string;
    };
}

export const getLumoCreditConfig = () => ({
    url: 'payments/v5/products/lumo-credit',
    method: 'get',
});

export const updateLumoCreditAutoTopUpConfig = (data: {
    Enabled: boolean;
    Quantity?: number;
    SpendingLimitEnabled?: boolean;
    SpendingLimit?: number;
}) => ({
    url: 'payments/v5/products/lumo-credit/auto-top-up',
    method: 'put',
    data,
    silence: true,
});
