import { pick } from 'lodash';

import { WasmApiWalletAccount } from '@proton/andromeda';
import isTruthy from '@proton/utils/isTruthy';

import { AccountWithChainData, IWasmApiWalletData, WalletChainDataByWalletId, WalletWithChainData } from '../types';

export const getAccountBalance = (account?: AccountWithChainData) => {
    const confirmed = Number(account?.balance?.confirmed ?? 0);
    const trustedPending = Number(account?.balance?.trusted_pending ?? 0);

    return confirmed + trustedPending;
};

export const getAccountUntrustedBalance = (account?: AccountWithChainData) => {
    const untrusted = Number(account?.balance?.untrusted_pending ?? 0);
    const immature = Number(account?.balance?.immature ?? 0);

    return untrusted + immature;
};

export const getDefaultAccount = (apiWallet?: IWasmApiWalletData): WasmApiWalletAccount | undefined => {
    return apiWallet?.WalletAccounts?.[0];
};

export const getSelectedAccount = (
    apiWallet?: IWasmApiWalletData,
    accountId?: string
): WasmApiWalletAccount | undefined => {
    return apiWallet?.WalletAccounts?.find?.(({ ID }) => ID === accountId);
};

export const getSelectedWallet = (
    apiWallets?: IWasmApiWalletData[],
    walletId?: string
): IWasmApiWalletData | undefined => apiWallets?.find(({ Wallet }) => walletId === Wallet.ID) ?? apiWallets?.[0];

export const getWalletsWithChainData = (walletsChainData: WalletChainDataByWalletId): WalletWithChainData[] => {
    return Object.values(walletsChainData).filter(isTruthy);
};

export const getAccountWithChainDataFromManyWallets = (
    walletsChainData: WalletChainDataByWalletId,
    walletId?: string,
    accountId?: string
): AccountWithChainData | undefined => {
    if (!walletId || !accountId) {
        return undefined;
    }

    return walletsChainData[walletId]?.accounts[accountId];
};

export const getAccountsWithChainDataFromManyWallets = (
    walletsChainData: WalletChainDataByWalletId
): AccountWithChainData[] => {
    return getWalletsWithChainData(walletsChainData).flatMap((wallet) =>
        Object.values(wallet.accounts ?? {}).filter(isTruthy)
    );
};

export const getAccountsWithChainDataFromSingleWallet = (
    walletsChainData: WalletChainDataByWalletId,
    walletId: string
): AccountWithChainData[] => {
    return getAccountsWithChainDataFromManyWallets(pick(walletsChainData, walletId));
};

export const getWalletBalance = (walletsChainData: WalletChainDataByWalletId, walletId: string) => {
    return getAccountsWithChainDataFromSingleWallet(walletsChainData, walletId).reduce(
        (acc, account) => acc + getAccountBalance(account),
        0
    );
};

export const getWalletUntrustedBalance = (walletsChainData: WalletChainDataByWalletId, walletId: string) => {
    return getAccountsWithChainDataFromSingleWallet(walletsChainData, walletId).reduce(
        (acc, account) => acc + getAccountUntrustedBalance(account),
        0
    );
};

export const getWalletTransactions = (walletsChainData: WalletChainDataByWalletId, walletId: string) => {
    return getAccountsWithChainDataFromSingleWallet(walletsChainData, walletId)
        .flatMap(({ transactions }) => transactions)
        .filter(isTruthy);
};
