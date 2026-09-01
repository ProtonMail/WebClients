import {
    type WasmApiWallet,
    type WasmApiWalletAccount,
    type WasmBalanceWrapper,
    type WasmPagination,
    type WasmSortOrder,
    WasmTransactionFilter,
} from '@proton/andromeda';

import type { AccountWithChainData, WalletChainDataByWalletId } from '../types';

export const removeMasterPrefix = (derivationPath: string) => {
    return derivationPath.replace(/m\//, '');
};

const computeTrustedBalance = async (_balance?: WasmBalanceWrapper) => {
    const balance = _balance?.data;

    const confirmed = Number(balance?.confirmed ?? 0);
    const trustedPending = Number(balance?.trusted_pending ?? 0);

    return confirmed + trustedPending;
};

export const getAccountBalance = async (account?: AccountWithChainData) => {
    const balance = await account?.account.getBalance();

    return computeTrustedBalance(balance);
};

export const getAccountWithChainDataFromManyWallets = (
    walletsChainData: WalletChainDataByWalletId,
    walletId?: string | null,
    accountId?: string | null
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
    pagination: WasmPagination,
    sort?: WasmSortOrder
) => {
    const account = walletsChainData[walletId]?.accounts?.[accountId]?.account;
    return (
        (await account?.getTransactions(pagination, WasmTransactionFilter.All, sort))?.[0].map(({ Data }) => Data) ?? []
    );
};

export const getWalletBalance = async (walletsChainData: WalletChainDataByWalletId, walletId: string) => {
    const balance = await walletsChainData[walletId]?.wallet.getBalance();

    return computeTrustedBalance(balance);
};

export const getWalletTransactions = async (
    walletsChainData: WalletChainDataByWalletId,
    walletId: string,
    pagination?: WasmPagination,
    sort?: WasmSortOrder
) => {
    return (
        (
            await walletsChainData[walletId]?.wallet.getTransactions(WasmTransactionFilter.All, pagination, sort)
        )?.[0].map(({ Data }) => Data) ?? []
    );
};

export const isWalletAccountSet = (
    value: [WasmApiWallet, WasmApiWalletAccount?]
): value is [WasmApiWallet, WasmApiWalletAccount] => {
    return !!value[1];
};
