const WALLET_ACCOUNT_METRICS = 'metrics:wallet_account:';
const SETTINGS = 'settings';

export interface WalletAccountMetrics {
    hasPositiveBalance: boolean;
    lastBalanceActivityTime: number;
}

const getLocalID = (url = window.location.href): string | null => {
    try {
        const pathName = new URL(url).pathname;
        const match = pathName.match(/\/u\/(\d+)\//);
        return match ? match[1] : null;
    } catch {
        return null;
    }
};

/**
 * Get Wallet local settings key.
 */
const getLocalSettingsKey = () => {
    const localID = getLocalID();
    return localID ? SETTINGS + ':' + localID : SETTINGS;
};

/**
 * Get Wallet local settings.
 */
export const getSettings = () => {
    const storage = localStorage.getItem(getLocalSettingsKey());
    if (storage) {
        return JSON.parse(storage);
    }
    return null;
};

/**
 * Save Wallet local settings.
 */
export const setSettings = (data: any) => {
    localStorage.setItem(getLocalSettingsKey(), JSON.stringify(data));
};

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

/**
 * Clear Wallet local settings.
 */
export const clearSettings = () => {
    localStorage.removeItem(getLocalSettingsKey());
};
