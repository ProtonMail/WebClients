import pick from 'lodash/pick';

import type { WasmApiWallet, WasmApiWalletAccount, WasmPagination, WasmSortOrder } from '@proton/andromeda';
import isTruthy from '@proton/utils/isTruthy';
import type { IWasmApiWalletData } from '@proton/wallet';

import type { AccountWithChainData, WalletChainDataByWalletId, WalletWithChainData } from '../types';

export const removeMasterPrefix = (derivationPath: string) => {
    return derivationPath.replace(/m\//, '');
};

export const getAccountBalance = async (account?: AccountWithChainData) => {
    const balance = await account?.account.getBalance();

    const confirmed = Number(balance?.confirmed ?? 0);
    const trustedPending = Number(balance?.trusted_pending ?? 0);

    return confirmed + trustedPending;
};

export const getAccountUntrustedBalance = async (account?: AccountWithChainData) => {
    const balance = await account?.account.getBalance();

    const untrusted = Number(balance?.untrusted_pending ?? 0);
    const immature = Number(balance?.immature ?? 0);

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

export const getAccountTransactions = async (
    walletsChainData: WalletChainDataByWalletId,
    walletId: string,
    accountId: string,
    pagination?: WasmPagination,
    sort?: WasmSortOrder
) => {
    const account = walletsChainData[walletId]?.accounts?.[accountId]?.account;
    return (await account?.getTransactions(pagination, sort))?.[0].map(({ Data }) => Data) ?? [];
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

export const getWalletBalance = async (walletsChainData: WalletChainDataByWalletId, walletId: string) => {
    const balance = await walletsChainData[walletId]?.wallet.getBalance();

    const confirmed = Number(balance?.confirmed ?? 0);
    const trustedPending = Number(balance?.trusted_pending ?? 0);

    return confirmed + trustedPending;
};

export const getWalletUntrustedBalance = async (walletsChainData: WalletChainDataByWalletId, walletId: string) => {
    const balance = await walletsChainData[walletId]?.wallet.getBalance();

    const untrusted = Number(balance?.untrusted_pending ?? 0);
    const immature = Number(balance?.immature ?? 0);

    return untrusted + immature;
};

export const getWalletTransactions = async (
    walletsChainData: WalletChainDataByWalletId,
    walletId: string,
    pagination?: WasmPagination,
    sort?: WasmSortOrder
) => {
    return (
        (await walletsChainData[walletId]?.wallet.getTransactions(pagination, sort))?.[0].map(({ Data }) => Data) ?? []
    );
};

export const isWalletAccountSet = (
    value: [WasmApiWallet, WasmApiWalletAccount?]
): value is [WasmApiWallet, WasmApiWalletAccount] => {
    return !!value[1];
};
