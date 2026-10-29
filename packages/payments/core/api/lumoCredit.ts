export interface LumoCreditResponse {
    Code: number;
    Balance: string;
    Usage: string;
    UsageLimit: string;
    AutoTopUp: {
        Enabled: boolean;
        Threshold: number;
        Quantity: number | null;
    };
}

export const getLumoCreditConfig = () => ({
    url: 'payments/v5/products/lumo-credit',
    method: 'get',
});
