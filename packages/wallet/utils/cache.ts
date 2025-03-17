const WALLET_ACCOUNT_METRICS = 'metrics:wallet_account:';

export interface WalletAccountMetrics {
    hasPositiveBalance: boolean;
    lastBalanceActivityTime: number;
}

/**
 * Get Wallet Account metrics key.
 */
const getWalletAccountMetricsKey = (walletAccountID: string) => {
    return WALLET_ACCOUNT_METRICS + walletAccountID;
};

/**
 * Get Wallet Account metrics.
 */
export const getWalletAccountMetrics = (walletAccountID: string): WalletAccountMetrics | undefined => {
    const storage = localStorage.getItem(getWalletAccountMetricsKey(walletAccountID));
    if (storage) {
        return JSON.parse(storage);
    }

    return undefined;
};

/**
 * Save Wallet Account metrics.
 */
export const updateWalletAccountActivityMetrics = (walletAccountID: string, hasUTXO: boolean): void => {
    const metrics = getWalletAccountMetrics(walletAccountID);

    const updatedMetrics = {
        hasPositiveBalance: hasUTXO,
        lastBalanceActivityTime: Date.now(),
    };

    localStorage.setItem(
        getWalletAccountMetricsKey(walletAccountID),
        JSON.stringify({ ...metrics, ...updatedMetrics })
    );
};
